import {
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

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number | null;

  @IsNumber()
  @Min(0, { message: 'El margen no puede ser negativo' })
  @Max(500, { message: 'El margen no puede superar el 500%' })
  profitMargin: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePriceUnit?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePriceTira?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePriceCaja?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}