import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  profitMargin?: number;

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

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}