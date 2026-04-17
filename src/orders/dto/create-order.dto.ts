import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemLineDto {
  @IsInt()
  @Min(1)
  menuItemId: number;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class CreateOrderDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  establishmentId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  locationNote: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemLineDto)
  items: OrderItemLineDto[];
}
