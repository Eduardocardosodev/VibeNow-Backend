import {
  OrderStatus as OrderStatusValues,
  type OrderStatus,
} from 'generated/prisma/enums';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export class OrderListQueryDto {
  @IsOptional()
  @IsIn(Object.values(OrderStatusValues))
  status?: OrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize?: number;
}

export function resolveOrderListPagination(query: OrderListQueryDto): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const page = Math.max(1, query.page ?? DEFAULT_PAGE);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}
