import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0, { message: 'El precio de compra no puede ser negativo' })
  purchasePrice: number;

  @IsNumber()
  @Min(0, { message: 'El margen no puede ser negativo' })
  @Max(500, { message: 'El margen no puede superar el 500%' })
  profitMargin: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}