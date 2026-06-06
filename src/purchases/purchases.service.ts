import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase, PurchaseDetail } from './entities/purchase.entity';
import { Product } from '../products/entities/product.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { CreatePurchaseDto, PurchaseItemDto } from './dto/create-purchase.dto';


@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchasesRepository: Repository<Purchase>,

    @InjectRepository(PurchaseDetail)
    private detailsRepository: Repository<PurchaseDetail>,

    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,

    @InjectRepository(StockMovement)
    private stockRepository: Repository<StockMovement>,
  ) {}

  async create(dto: CreatePurchaseDto) {
    const supplier = await this.suppliersRepository.findOne({
      where: { id: dto.supplierId },
    });

    if (!supplier) {
      throw new NotFoundException(
        `Proveedor #${dto.supplierId} no encontrado`,
      );
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'La compra debe tener al menos un producto',
      );
    }

    let total = 0;
    const details: PurchaseDetail[] = [];

    for (const item of dto.items) {
      const product = await this.productsRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new BadRequestException(
          `Producto #${item.productId} no encontrado`,
        );
      }

      const subtotal = item.unitCost * item.quantity;
      total += subtotal;

      // Sumar stock
      product.stock += item.quantity;

      // Actualizar precio de compra y recalcular venta si se indicó
      if (item.updatePrice) {
        product.purchasePrice = item.unitCost;
        product.salePrice =
          item.unitCost * (1 + Number(product.profitMargin) / 100);
      }

      await this.productsRepository.save(product);

      // Registrar movimiento de stock
      const movement = this.stockRepository.create({
        product,
        quantity: item.quantity,
        type: 'PURCHASE',
        reason: `Compra a ${supplier.name}`,
      });
      await this.stockRepository.save(movement);

      const detail = this.detailsRepository.create({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal,
        updatePrice: item.updatePrice,
      });

      details.push(detail);
    }

    const paidAmount = Math.min(
      Math.round(dto.paidAmount * 100),
      Math.round(total * 100),
    ) / 100;

    const pendingAmount =
      Math.round((total - paidAmount) * 100) / 100;

    const purchase = this.purchasesRepository.create({
      supplier,
      total,
      paidAmount,
      pendingAmount,
      notes: dto.notes,
      details,
    });

    return this.purchasesRepository.save(purchase);
  }

  findAll() {
    return this.purchasesRepository.find({
      relations: {
        supplier: true,
        details: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const purchase = await this.purchasesRepository.findOne({
      where: { id },
      relations: {
        supplier: true,
        details: true,
      },
    });

    if (!purchase) {
      throw new NotFoundException(`Compra #${id} no encontrada`);
    }

    return purchase;
  }
}