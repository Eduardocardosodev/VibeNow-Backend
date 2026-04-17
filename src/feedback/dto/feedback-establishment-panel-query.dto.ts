import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Lista paginada do painel: filtros por intervalo, nota e foto. */
export class FeedbackEstablishmentPanelQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  /** Nota mínima (1–5), inclusive. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;

  /** Nota máxima (1–5), inclusive. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  maxRating?: number;

  /** Só feedbacks com foto anexada. */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '' || value === null) return undefined;
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  hasPhoto?: boolean;

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

  @IsOptional()
  @IsEnum(['desc', 'asc'])
  sort?: 'desc' | 'asc';

  getPage(): number {
    return Math.max(1, this.page ?? DEFAULT_PAGE);
  }

  getPageSize(): number {
    return Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, this.pageSize ?? DEFAULT_PAGE_SIZE),
    );
  }
}

export const FEEDBACK_PANEL_MAX_RANGE_MS = 400 * 24 * 60 * 60 * 1000;
