import {
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

class OrderItemDto {

  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {

  @IsInt()
  customerId: number;

  @IsArray()
  @ValidateNested({ each: true })

  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}