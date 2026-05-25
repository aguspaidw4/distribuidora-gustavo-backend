import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePaymentDto {

  @IsNumber()
  orderId: number;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  method: string;

  @IsOptional()
  @IsString()
  reference?: string;
}