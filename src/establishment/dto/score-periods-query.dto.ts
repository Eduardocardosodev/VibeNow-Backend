import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ScorePeriodsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  getPage(): number {
    return Math.max(1, this.page ?? 1);
  }

  getPageSize(): number {
    return Math.min(100, Math.max(1, this.pageSize ?? 20));
  }
}
