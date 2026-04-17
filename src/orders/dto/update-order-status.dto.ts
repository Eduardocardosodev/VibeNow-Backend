import {
  OrderStatus as OrderStatusValues,
  type OrderStatus,
} from 'generated/prisma/enums';
import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(Object.values(OrderStatusValues))
  status: OrderStatus;
}
