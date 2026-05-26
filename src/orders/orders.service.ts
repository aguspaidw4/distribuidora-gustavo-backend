import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';

import { Product } from '../products/entities/product.entity';

import { StockMovement } from '../stock/entities/stock-movement.entity';

import { CreateOrderDto } from './dto/create-order.dto';

import { Customer } from '../customers/entities/customer.entity';

import PDFDocument from 'pdfkit';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,

    @InjectRepository(OrderDetail)
    private orderDetailsRepository: Repository<OrderDetail>,

    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(StockMovement)
    private stockRepository: Repository<StockMovement>,

    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {

    let total = 0;

    const customer =
      await this.customersRepository.findOne({
        where: {
          id: createOrderDto.customerId,
        },
      });

    if (!customer) {
      throw new BadRequestException(
        'Customer not found',
      );
    }

    const details: OrderDetail[] = [];

    for (const item of createOrderDto.items) {

      const product =
        await this.productsRepository.findOne({
          where: {
            id: item.productId,
          },
        });

      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} not found`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}`,
        );
      }

      // descontar stock
      product.stock -= item.quantity;

      await this.productsRepository.save(product);

      // movimiento stock
      const movement =
        this.stockRepository.create({
          product,

          quantity: item.quantity,

          type: 'SALE',

          reason: 'Order sale',
        });

      await this.stockRepository.save(movement);

      const subtotal =
        Number(product.salePrice) * item.quantity;

      total += subtotal;

      const detail =
        this.orderDetailsRepository.create({
          product,

          quantity: item.quantity,

          unitPrice: product.salePrice,

          subtotal,
        });

      details.push(detail);
    }

    const order = this.ordersRepository.create({
      customer,

      total,

      paidAmount: 0,

      pendingAmount: total,

      details,
    });

    return this.ordersRepository.save(order);
  }

  findAll() {
    return this.ordersRepository.find({
      relations: {
        details: {
          product: true,
        },
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }
  async generatePdf(id: number) {

    const order =
      await this.ordersRepository.findOne({
        where: { id },

        relations: {
          customer: true,
          details: {
            product: true,
          },
        },
      });

    if (!order) {
      throw new Error(
        'Order not found',
      );
    }

    const doc =
      new PDFDocument({
        margin: 50,
      });

    doc.fontSize(24)
      .text(
        'Distribuidora Gustavo',
      );

    doc.moveDown();

    doc.fontSize(16)
      .text(`Pedido #${order.id}`);

    doc.text(
      `Cliente: ${order.customer.name}`,
    );

    doc.text(
      `Fecha: ${
        new Date(
          order.createdAt,
        ).toLocaleString()
      }`,
    );

    doc.moveDown();

    doc.fontSize(18)
      .text('Productos');

    doc.moveDown();

    order.details.forEach(
      (detail) => {

        doc.fontSize(12)
          .text(
            `${detail.product.name} | Cantidad: ${detail.quantity} | Precio: $${detail.unitPrice} | Subtotal: $${detail.subtotal}`,
          );
      },
    );

    doc.moveDown();

    doc.fontSize(20)
      .text(
        `TOTAL: $${order.total}`,
      );

    doc.end();

    return doc;
  }
}