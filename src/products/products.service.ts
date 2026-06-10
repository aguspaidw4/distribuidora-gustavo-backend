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

  private calcSalePrice(
    purchasePrice: number | null | undefined,
    profitMargin: number,
  ): number | null {
    if (!purchasePrice) return null;
    return purchasePrice * (1 + profitMargin / 100);
  }

  async create(dto: CreateProductDto) {
    const hasAtLeastOne =
      dto.purchasePriceUnit ||
      dto.purchasePriceTira ||
      dto.purchasePriceCaja;

    if (!hasAtLeastOne) {
      throw new BadRequestException(
        'Ingresá al menos un precio de presentación (Unidad, Tira o Caja)',
      );
    }

    const margin = dto.profitMargin;
    const salePriceUnit = this.calcSalePrice(dto.purchasePriceUnit, margin);
    const salePriceTira = this.calcSalePrice(dto.purchasePriceTira, margin);
    const salePriceCaja = this.calcSalePrice(dto.purchasePriceCaja, margin);
    const salePrice = salePriceUnit ?? salePriceTira ?? salePriceCaja ?? 0;

    const product = this.productsRepository.create({
      ...dto,
      salePriceUnit,
      salePriceTira,
      salePriceCaja,
      salePrice,
      purchasePrice: dto.purchasePriceUnit ?? dto.purchasePriceTira ?? dto.purchasePriceCaja ?? 0,
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
      throw new NotFoundException(`Producto #${id} no encontrado`);
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

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOne(id);

    Object.assign(product, dto);

    const margin = Number(product.profitMargin);
    product.salePriceUnit = this.calcSalePrice(product.purchasePriceUnit, margin);
    product.salePriceTira = this.calcSalePrice(product.purchasePriceTira, margin);
    product.salePriceCaja = this.calcSalePrice(product.purchasePriceCaja, margin);
    product.salePrice =
      product.salePriceUnit ?? product.salePriceTira ?? product.salePriceCaja ?? 0;

    return this.productsRepository.save(product);
  }

  async generatePriceListPdf(productIds: number[]) {
    if (!productIds || productIds.length === 0) {
      throw new BadRequestException('Seleccioná al menos un producto');
    }

    const products = await this.productsRepository.findBy({
      id: In(productIds),
    });

    if (products.length === 0) {
      throw new BadRequestException(
        'No se encontraron los productos seleccionados',
      );
    }

    products.sort((a, b) => a.name.localeCompare(b.name));

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const primaryColor = '#1a1a2e';
    const accentColor = '#2563eb';
    const lightGray = '#f3f4f6';
    const darkGray = '#6b7280';
    const pageWidth = 495;

    const colProducto = 50;
    const colUnidad = 245;
    const colTira = 335;
    const colCaja = 420;
    const nameWidth = 185;
    const minRowHeight = 30;
    const fontSize = 10;
    const lineHeight = 14; // px por línea a fontSize 10
    const paddingV = 10;   // padding vertical dentro de la fila

    const formatARS = (value: number | string | null) =>
      value !== null && value !== undefined
        ? new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2,
          }).format(Number(value))
        : '—';

    // Estima cuántas líneas ocupa un texto dado un ancho en puntos
    const estimateLines = (text: string, width: number, fSize: number): number => {
      // Aproximación: Helvetica regular ~0.55 del fontSize por caracter
      const charsPerLine = Math.floor(width / (fSize * 0.55));
      if (charsPerLine <= 0) return 1;
      return Math.ceil(text.length / charsPerLine);
    };

    const getRowHeight = (name: string): number => {
      const lines = estimateLines(name, nameWidth, fontSize);
      return Math.max(minRowHeight, lines * lineHeight + paddingV * 2);
    };

    const fecha = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // ── ENCABEZADO ──
    doc.rect(0, 0, 595, 90).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold')
      .text('Distribuidora Gustavo', 50, 25);
    doc.fontSize(11).fillColor('#93c5fd').font('Helvetica')
      .text('Lista de Precios', 50, 57);
    doc.fontSize(10).fillColor('#93c5fd')
      .text(`Fecha: ${fecha}`, 50, 72);
    doc.fillColor(darkGray).fontSize(10).font('Helvetica')
      .text(
        `${products.length} producto${products.length !== 1 ? 's' : ''}`,
        50, 105,
      );

    // ── ENCABEZADO TABLA ──
    const tableTop = 125;
    const headerHeight = 30;

    doc.rect(50, tableTop, pageWidth, headerHeight).fill(accentColor);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
      .text('Producto', colProducto + 8, tableTop + 10)
      .text('Unidad', colUnidad, tableTop + 10, { width: 80, align: 'right' })
      .text('Tira',   colTira,   tableTop + 10, { width: 75, align: 'right' })
      .text('Caja',   colCaja,   tableTop + 10, { width: 75, align: 'right' });

    let y = tableTop + headerHeight;

    products.forEach((product, index) => {
      const rowHeight = getRowHeight(product.name);
      const isEven = index % 2 === 0;

      // Salto de página si no entra la fila
      if (y + rowHeight > 820) {
        doc.addPage();
        y = 50;

        // Repetir encabezado en la nueva página
        doc.rect(50, y, pageWidth, headerHeight).fill(accentColor);
        doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
          .text('Producto', colProducto + 8, y + 10)
          .text('Unidad', colUnidad, y + 10, { width: 80, align: 'right' })
          .text('Tira',   colTira,   y + 10, { width: 75, align: 'right' })
          .text('Caja',   colCaja,   y + 10, { width: 75, align: 'right' });

        y += headerHeight;
      }

      // Fondo de fila
      doc.rect(50, y, pageWidth, rowHeight)
        .fill(isEven ? '#ffffff' : lightGray);

      // Centrar verticalmente el texto en la fila
      const textY = y + paddingV;

      // Nombre — permite wrap
      doc.fillColor('#111827').fontSize(10).font('Helvetica')
        .text(product.name, colProducto + 8, textY, {
          width: nameWidth,
          lineBreak: true,
        });

      // Precios — centrados verticalmente en la fila
      const priceY = y + (rowHeight - fontSize) / 2;

      if (product.salePriceUnit) {
        doc.fillColor('#166534').font('Helvetica-Bold')
          .text(formatARS(product.salePriceUnit), colUnidad, priceY, { width: 80, align: 'right' });
      } else {
        doc.fillColor(darkGray).font('Helvetica')
          .text('—', colUnidad, priceY, { width: 80, align: 'right' });
      }

      if (product.salePriceTira) {
        doc.fillColor('#1e40af').font('Helvetica-Bold')
          .text(formatARS(product.salePriceTira), colTira, priceY, { width: 75, align: 'right' });
      } else {
        doc.fillColor(darkGray).font('Helvetica')
          .text('—', colTira, priceY, { width: 75, align: 'right' });
      }

      if (product.salePriceCaja) {
        doc.fillColor('#6d28d9').font('Helvetica-Bold')
          .text(formatARS(product.salePriceCaja), colCaja, priceY, { width: 75, align: 'right' });
      } else {
        doc.fillColor(darkGray).font('Helvetica')
          .text('—', colCaja, priceY, { width: 75, align: 'right' });
      }

      // Línea separadora
      doc.moveTo(50, y + rowHeight).lineTo(50 + pageWidth, y + rowHeight)
        .strokeColor('#e5e7eb').lineWidth(0.5).stroke();

      y += rowHeight;
    });

    // ── PIE ──
    doc.rect(50, y + 20, pageWidth, 1).fill('#e5e7eb');
    doc.fillColor(darkGray).fontSize(9).font('Helvetica')
      .text(
        'Los precios pueden estar sujetos a cambios sin previo aviso.',
        50, y + 30,
        { align: 'center', width: pageWidth },
      );

    doc.end();
    return doc;
  }
}