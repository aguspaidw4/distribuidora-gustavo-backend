import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0, { message: 'El margen no puede ser negativo' })
  @Max(500, { message: 'El margen no puede superar el 500%' })
  profitMargin: number;

  // Al menos uno de los tres debe estar presente (validado en el service)
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