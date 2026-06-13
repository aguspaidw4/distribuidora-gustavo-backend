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

  private async checkDuplicate(name: string, excludeId?: number): Promise<void> {
    const normalized = name.trim().toLowerCase();
    const all = await this.productsRepository.find();
    const duplicate = all.find((p) => {
      if (excludeId && p.id === excludeId) return false;
      return p.name.trim().toLowerCase() === normalized;
    });
    if (duplicate) {
      const status = duplicate.active ? '' : ' (está eliminado — podés restaurarlo)';
      throw new BadRequestException(
        `Ya existe un producto con el nombre "${duplicate.name}"${status}`,
      );
    }
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

    await this.checkDuplicate(dto.name);

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
      where: { active: true },
      order: { name: 'ASC' },
    });
  }

  findDeleted() {
    return this.productsRepository.find({
      where: { active: false },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Producto #${id} no encontrado`);
    }
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (dto.name && dto.name.trim().toLowerCase() !== product.name.trim().toLowerCase()) {
      await this.checkDuplicate(dto.name, id);
    }

    const existingMargin = Number(product.profitMargin);
    Object.assign(product, dto);

    const margin = Number(product.profitMargin) || existingMargin;
    product.salePriceUnit = this.calcSalePrice(product.purchasePriceUnit, margin);
    product.salePriceTira = this.calcSalePrice(product.purchasePriceTira, margin);
    product.salePriceCaja = this.calcSalePrice(product.purchasePriceCaja, margin);
    product.salePrice =
      product.salePriceUnit ?? product.salePriceTira ?? product.salePriceCaja ?? 0;

    return this.productsRepository.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    product.active = false;
    return this.productsRepository.save(product);
  }

  async restore(id: number) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Producto #${id} no encontrado`);
    }
    if (product.active) {
      throw new BadRequestException('El producto ya está activo');
    }
    product.active = true;
    return this.productsRepository.save(product);
  }

  async generatePriceListPdf(productIds: number[]) {
    if (!productIds || productIds.length === 0) {
      throw new BadRequestException('Seleccioná al menos un producto');
    }

    const products = await this.productsRepository.findBy({ id: In(productIds) });

    if (products.length === 0) {
      throw new BadRequestException('No se encontraron los productos seleccionados');
    }

    products.sort((a, b) => a.name.localeCompare(b.name));

    // autoFirstPage: false + bufferPages: true para control total
    const doc = new PDFDocument({
      margin: 0,
      size: 'A4',
      autoFirstPage: false,
      bufferPages: true,
    });

    const primaryColor = '#1a1a2e';
    const accentColor = '#2563eb';
    const darkGray = '#6b7280';

    // Dimensiones de página A4 en puntos
    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;
    const MARGIN_LEFT = 50;
    const MARGIN_RIGHT = 50;
    const TABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

    // Columnas (posición X absoluta)
    const COL_PRODUCTO = MARGIN_LEFT + 6;
    const COL_UNIDAD = MARGIN_LEFT + 240;
    const COL_TIRA = MARGIN_LEFT + 330;
    const COL_CAJA = MARGIN_LEFT + 400;
    const COL_UNIDAD_W = 80;
    const COL_TIRA_W = 60;
    const COL_CAJA_W = 65;
    const NAME_WIDTH = 230;

    const ROW_HEIGHT = 26;
    const HEADER_HEIGHT = 28;
    const FONT_SIZE = 9;
    const ROW_PADDING_V = 8; // padding vertical dentro de la fila

    // Zona segura de contenido en cada página
    const CONTENT_TOP = 50;    // Y donde empieza el contenido (sin header de portada)
    const CONTENT_BOTTOM = PAGE_HEIGHT - 60; // Y máximo antes del pie de página

    const formatARS = (value: number | string | null | undefined): string => {
      if (value === null || value === undefined) return '—';
      const n = Number(value);
      if (!n) return '—';
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
      }).format(n);
    };

    // Truncar nombre para que entre en NAME_WIDTH a fontSize 9
    // PDFKit Helvetica a 9pt: aprox 5.2px por char → 230px / 5.2 ≈ 44 chars
    const truncateName = (name: string): string => {
      const MAX = 44;
      return name.length > MAX ? name.substring(0, MAX - 1) + '…' : name;
    };

    const fecha = new Date().toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    // ─── Función para dibujar el encabezado de tabla ───────────────────────────
    const drawTableHeader = (y: number) => {
      // Fondo del header
      doc.rect(MARGIN_LEFT, y, TABLE_WIDTH, HEADER_HEIGHT).fill(accentColor);

      doc.fillColor('#ffffff').fontSize(FONT_SIZE).font('Helvetica-Bold');
      // Usamos save/restore para evitar que text() mueva el cursor principal
      doc.save();
      doc.text('Producto', COL_PRODUCTO, y + 9, { lineBreak: false });
      doc.restore();

      doc.save();
      doc.text('Unidad', COL_UNIDAD, y + 9, { width: COL_UNIDAD_W, align: 'right', lineBreak: false });
      doc.restore();

      doc.save();
      doc.text('Tira', COL_TIRA, y + 9, { width: COL_TIRA_W, align: 'right', lineBreak: false });
      doc.restore();

      doc.save();
      doc.text('Caja', COL_CAJA, y + 9, { width: COL_CAJA_W, align: 'right', lineBreak: false });
      doc.restore();
    };

    // ─── Función para dibujar UNA fila de producto ─────────────────────────────
    // Recibe la posición Y exacta. No mueve ningún cursor global.
    const drawRow = (product: Product, y: number, isEven: boolean) => {
      // Fondo
      doc.rect(MARGIN_LEFT, y, TABLE_WIDTH, ROW_HEIGHT)
        .fill(isEven ? '#ffffff' : '#f9fafb');

      const textY = y + ROW_PADDING_V;

      // Nombre
      doc.save();
      doc.fillColor('#111827').fontSize(FONT_SIZE).font('Helvetica')
        .text(truncateName(product.name), COL_PRODUCTO, textY, {
          lineBreak: false,
          ellipsis: false,
        });
      doc.restore();

      // Precio Unidad
      doc.save();
      if (product.salePriceUnit) {
        doc.fillColor('#166534').font('Helvetica-Bold')
          .fontSize(FONT_SIZE)
          .text(formatARS(product.salePriceUnit), COL_UNIDAD, textY, {
            width: COL_UNIDAD_W, align: 'right', lineBreak: false,
          });
      } else {
        doc.fillColor(darkGray).font('Helvetica').fontSize(FONT_SIZE)
          .text('—', COL_UNIDAD, textY, {
            width: COL_UNIDAD_W, align: 'right', lineBreak: false,
          });
      }
      doc.restore();

      // Precio Tira
      doc.save();
      if (product.salePriceTira) {
        doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(FONT_SIZE)
          .text(formatARS(product.salePriceTira), COL_TIRA, textY, {
            width: COL_TIRA_W, align: 'right', lineBreak: false,
          });
      } else {
        doc.fillColor(darkGray).font('Helvetica').fontSize(FONT_SIZE)
          .text('—', COL_TIRA, textY, {
            width: COL_TIRA_W, align: 'right', lineBreak: false,
          });
      }
      doc.restore();

      // Precio Caja
      doc.save();
      if (product.salePriceCaja) {
        doc.fillColor('#6d28d9').font('Helvetica-Bold').fontSize(FONT_SIZE)
          .text(formatARS(product.salePriceCaja), COL_CAJA, textY, {
            width: COL_CAJA_W, align: 'right', lineBreak: false,
          });
      } else {
        doc.fillColor(darkGray).font('Helvetica').fontSize(FONT_SIZE)
          .text('—', COL_CAJA, textY, {
            width: COL_CAJA_W, align: 'right', lineBreak: false,
          });
      }
      doc.restore();

      // Línea separadora inferior
      doc.save();
      doc.moveTo(MARGIN_LEFT, y + ROW_HEIGHT)
        .lineTo(MARGIN_LEFT + TABLE_WIDTH, y + ROW_HEIGHT)
        .strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      doc.restore();
    };

    // ─── PÁGINA 1: Portada con encabezado ──────────────────────────────────────
    doc.addPage();

    // Header de portada
    doc.rect(0, 0, PAGE_WIDTH, 88).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold')
      .text('Distribuidora Gustavo', MARGIN_LEFT, 22, { lineBreak: false });
    doc.fillColor('#93c5fd').fontSize(11).font('Helvetica')
      .text('Lista de Precios', MARGIN_LEFT, 55, { lineBreak: false });
    doc.fillColor('#93c5fd').fontSize(10)
      .text(`Fecha: ${fecha}`, MARGIN_LEFT, 70, { lineBreak: false });

    // Subtítulo con conteo
    doc.fillColor(darkGray).fontSize(10).font('Helvetica')
      .text(
        `${products.length} producto${products.length !== 1 ? 's' : ''}`,
        MARGIN_LEFT, 100, { lineBreak: false },
      );

    // Encabezado de tabla en página 1
    const FIRST_TABLE_TOP = 118;
    drawTableHeader(FIRST_TABLE_TOP);

    // ─── BUCLE DE FILAS ────────────────────────────────────────────────────────
    // Mantenemos currentY nosotros mismos, PDFKit no avanza el cursor
    let currentY = FIRST_TABLE_TOP + HEADER_HEIGHT;

    products.forEach((product, index) => {
      // ¿Entra la fila en la página actual?
      if (currentY + ROW_HEIGHT > CONTENT_BOTTOM) {
        // Nueva página
        doc.addPage();
        // Repetir encabezado de tabla
        drawTableHeader(CONTENT_TOP);
        currentY = CONTENT_TOP + HEADER_HEIGHT;
      }

      drawRow(product, currentY, index % 2 === 0);
      currentY += ROW_HEIGHT;
    });

    // ─── PIE DE PÁGINA ─────────────────────────────────────────────────────────
    const footerY = currentY + 20;
    // Si no entra el pie, nueva página
    if (footerY + 30 > CONTENT_BOTTOM) {
      doc.addPage();
      doc.fillColor(darkGray).fontSize(9).font('Helvetica')
        .text(
          'Los precios pueden estar sujetos a cambios sin previo aviso.',
          MARGIN_LEFT, CONTENT_TOP + 10,
          { align: 'center', width: TABLE_WIDTH, lineBreak: false },
        );
    } else {
      doc.rect(MARGIN_LEFT, footerY, TABLE_WIDTH, 1).fill('#e5e7eb');
      doc.fillColor(darkGray).fontSize(9).font('Helvetica')
        .text(
          'Los precios pueden estar sujetos a cambios sin previo aviso.',
          MARGIN_LEFT, footerY + 10,
          { align: 'center', width: TABLE_WIDTH, lineBreak: false },
        );
    }

    doc.end();
    return doc;
  }
}