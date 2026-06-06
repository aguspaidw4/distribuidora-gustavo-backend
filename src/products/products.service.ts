import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import PDFDocument from 'pdfkit';


@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const salePrice =
      createProductDto.purchasePrice *
      (1 + createProductDto.profitMargin / 100);

    const product = this.productsRepository.create({
      ...createProductDto,
      salePrice,
    });

    return this.productsRepository.save(product);
  }

  findAll() {
    return this.productsRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const product = await this.productsRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(
        `Producto #${id} no encontrado`,
      );
    }

    return product;
  }

  async remove(id: number) {
    const product = await this.findOne(id);

    const hasOrders = await this.productsRepository
      .createQueryBuilder('product')
      .innerJoin('order_details', 'od', 'od.productId = product.id')
      .where('product.id = :id', { id })
      .getCount();

    if (hasOrders > 0) {
      throw new BadRequestException(
        'No se puede eliminar un producto que tiene pedidos asociados',
      );
    }

    return this.productsRepository.remove(product);
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    Object.assign(product, updateProductDto);

    if (
      updateProductDto.purchasePrice !== undefined ||
      updateProductDto.profitMargin !== undefined
    ) {
      product.salePrice =
        Number(product.purchasePrice) *
        (1 + Number(product.profitMargin) / 100);
    }

    return this.productsRepository.save(product);
  }

  async generatePriceListPdf(productIds: number[]) {
    if (!productIds || productIds.length === 0) {
      throw new BadRequestException(
        'Seleccioná al menos un producto',
      );
    }

    const products = await this.productsRepository.findBy({
      id: In(productIds),
    });

    if (products.length === 0) {
      throw new BadRequestException(
        'No se encontraron los productos seleccionados',
      );
    }

    // Ordenar por nombre
    products.sort((a, b) => a.name.localeCompare(b.name));

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
    });

    const primaryColor = '#1a1a2e';
    const accentColor = '#2563eb';
    const lightGray = '#f3f4f6';
    const darkGray = '#6b7280';
    const pageWidth = 495; // A4 595 - 2*50 margins

    // ── ENCABEZADO ──
    doc
      .rect(0, 0, 595, 90)
      .fill(primaryColor);

    doc
      .fillColor('#ffffff')
      .fontSize(26)
      .font('Helvetica-Bold')
      .text('Distribuidora Gustavo', 50, 25);

    doc
      .fontSize(11)
      .fillColor('#93c5fd')
      .font('Helvetica')
      .text('Lista de Precios', 50, 57);

    const fecha = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    doc
      .fontSize(10)
      .fillColor('#93c5fd')
      .text(`Fecha: ${fecha}`, 50, 72);

    // ── SUBTÍTULO ──
    doc
      .fillColor(darkGray)
      .fontSize(10)
      .font('Helvetica')
      .text(
        `${products.length} producto${products.length !== 1 ? 's' : ''}`,
        50,
        105,
      );

    // ── TABLA ──
    const tableTop = 125;
    const col1 = 50;
    const col2 = 370;
    const rowHeight = 32;

    // Encabezado tabla
    doc
      .rect(50, tableTop, pageWidth, rowHeight)
      .fill(accentColor);

    doc
      .fillColor('#ffffff')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Producto', col1 + 10, tableTop + 10)
      .text('Precio', col2, tableTop + 10, {
        width: 125,
        align: 'right',
      });

    // Filas
    let y = tableTop + rowHeight;

    products.forEach((product, index) => {
      const isEven = index % 2 === 0;

      doc
        .rect(50, y, pageWidth, rowHeight)
        .fill(isEven ? '#ffffff' : lightGray);

      doc
        .fillColor('#111827')
        .fontSize(11)
        .font('Helvetica')
        .text(product.name, col1 + 10, y + 10, {
          width: 290,
          ellipsis: true,
        });

      const precio = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
      }).format(Number(product.salePrice));

      doc
        .fillColor('#166534')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(precio, col2, y + 10, {
          width: 125,
          align: 'right',
        });

      doc
        .moveTo(50, y + rowHeight)
        .lineTo(50 + pageWidth, y + rowHeight)
        .strokeColor('#e5e7eb')
        .lineWidth(0.5)
        .stroke();

      y += rowHeight;
    });

    // ── PIE ──
    doc
      .rect(50, y + 20, pageWidth, 1)
      .fill('#e5e7eb');

    doc
      .fillColor(darkGray)
      .fontSize(9)
      .font('Helvetica')
      .text(
        'Los precios pueden estar sujetos a cambios sin previo aviso.',
        50,
        y + 30,
        { align: 'center', width: pageWidth },
      );

    doc.end();

    return doc;
  }
}