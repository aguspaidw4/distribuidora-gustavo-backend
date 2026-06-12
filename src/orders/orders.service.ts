import {
  Injectable,
  BadRequestException,
  NotFoundException,
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

    const customer = await this.customersRepository.findOne({
      where: { id: createOrderDto.customerId },
    });

    if (!customer) {
      throw new BadRequestException('Cliente no encontrado');
    }

    const details: OrderDetail[] = [];

    for (const item of createOrderDto.items) {
      const product = await this.productsRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new BadRequestException(
          `Producto #${item.productId} no encontrado`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`,
        );
      }

      product.stock -= item.quantity;
      await this.productsRepository.save(product);

      const movement = this.stockRepository.create({
        product,
        quantity: item.quantity,
        type: 'SALE',
        reason: `Venta — ${customer.name}`,
      });
      await this.stockRepository.save(movement);

      // Usar el precio enviado desde el frontend, o el salePrice como fallback
      const unitPrice = item.unitPrice ?? Number(product.salePrice);
      const presentation = item.presentation ?? 'UNIDAD';
      const subtotal = unitPrice * item.quantity;
      total += subtotal;

      const detail = this.orderDetailsRepository.create({
        product,
        quantity: item.quantity,
        presentation,
        unitPrice,
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
        details: { product: true },
        customer: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async generatePdf(id: number) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: {
        customer: true,
        details: { product: true },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido #${id} no encontrado`);
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const primaryColor = '#1a1a2e';
    const accentColor = '#2563eb';
    const lightGray = '#f3f4f6';
    const darkGray = '#6b7280';
    const pageWidth = 495;

    const formatARS = (value: number | string) =>
      new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
      }).format(Number(value));

    const fecha = new Date(order.createdAt).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // ── ENCABEZADO ──
    doc.rect(0, 0, 595, 90).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold')
      .text('Distribuidora Gustavo', 50, 25);
    doc.fontSize(11).fillColor('#93c5fd').font('Helvetica')
      .text(`Pedido #${order.id}`, 50, 57);
    doc.fontSize(10).fillColor('#93c5fd')
      .text(`Fecha: ${fecha}`, 50, 72);

    // ── INFO CLIENTE ──
    doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold')
      .text('Cliente', 50, 108);
    doc.fillColor(darkGray).fontSize(11).font('Helvetica')
      .text(order.customer.name, 50, 125);

    // ── ESTADO ──
    const statusLabels: Record<string, string> = {
      PENDING: 'Pendiente de pago',
      PAID: 'Pagado',
      PARTIAL: 'Pago parcial',
      CANCELLED: 'Cancelado',
    };
    const statusColors: Record<string, string> = {
      PENDING: '#b45309',
      PAID: '#166534',
      PARTIAL: '#1e40af',
      CANCELLED: '#991b1b',
    };

    doc.fillColor(statusColors[order.status] ?? darkGray)
      .fontSize(11).font('Helvetica-Bold')
      .text(statusLabels[order.status] ?? order.status, 380, 115, { width: 165, align: 'right' });

    // ── TABLA ──
    const tableTop = 155;
    const rowHeight = 30;
    const colProducto = 50;
    const colPresentacion = 255;
    const colCantidad = 320;
    const colPrecio = 370;
    const colSubtotal = 430;

    doc.rect(50, tableTop, pageWidth, rowHeight).fill(accentColor);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
      .text('Producto',     colProducto + 8, tableTop + 10, { width: 195 })
      .text('Present.',     colPresentacion, tableTop + 10, { width: 55, align: 'center' })
      .text('Cant.',        colCantidad,     tableTop + 10, { width: 45, align: 'center' })
      .text('P. Unit.',     colPrecio,       tableTop + 10, { width: 55, align: 'right' })
      .text('Subtotal',     colSubtotal,     tableTop + 10, { width: 115, align: 'right' });

    let y = tableTop + rowHeight;

    order.details.forEach((detail, index) => {
      const isEven = index % 2 === 0;
      doc.rect(50, y, pageWidth, rowHeight).fill(isEven ? '#ffffff' : lightGray);

      doc.fillColor('#111827').fontSize(10).font('Helvetica')
        .text(detail.product.name, colProducto + 8, y + 10, { width: 195, ellipsis: true })
        .text(detail.presentation ?? 'UNIDAD', colPresentacion, y + 10, { width: 55, align: 'center' })
        .text(String(detail.quantity), colCantidad, y + 10, { width: 45, align: 'center' })
        .text(formatARS(detail.unitPrice), colPrecio, y + 10, { width: 55, align: 'right' })
        .text(formatARS(detail.subtotal), colSubtotal, y + 10, { width: 115, align: 'right' });

      doc.moveTo(50, y + rowHeight).lineTo(545, y + rowHeight)
        .strokeColor('#e5e7eb').lineWidth(0.5).stroke();

      y += rowHeight;
    });

    // ── TOTALES ──
    y += 15;
    doc.moveTo(310, y - 5).lineTo(545, y - 5)
      .strokeColor('#e5e7eb').lineWidth(1).stroke();

    const drawTotalRow = (label: string, value: string, bold = false, color = '#111827') => {
      doc.fillColor(darkGray).fontSize(10).font('Helvetica')
        .text(label, 310, y, { width: 100, align: 'right' });
      doc.fillColor(color).fontSize(bold ? 12 : 10).font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(value, colSubtotal, y, { width: 115, align: 'right' });
      y += bold ? 22 : 18;
    };

    drawTotalRow('Total:', formatARS(order.total), true, '#111827');
    drawTotalRow('Pagado:', formatARS(order.paidAmount), false, '#166534');
    drawTotalRow(
      'Pendiente:',
      formatARS(order.pendingAmount),
      Number(order.pendingAmount) > 0,
      Number(order.pendingAmount) > 0 ? '#991b1b' : '#166534',
    );

    // ── PIE ──
    doc.rect(50, y + 20, pageWidth, 1).fill('#e5e7eb');
    doc.fillColor(darkGray).fontSize(9).font('Helvetica')
      .text('Distribuidora Gustavo — Gracias por su compra.', 50, y + 30, {
        align: 'center', width: pageWidth,
      });

    doc.end();
    return doc;
  }
}