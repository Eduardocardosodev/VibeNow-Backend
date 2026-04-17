import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

/** Agregações para dashboard do portal (dono / funcionário). */
export class FeedbackInsightsQueryDto {
  /** Início do intervalo (inclusivo). ISO 8601. Omitido = `to` − 7 dias. */
  @IsOptional()
  @IsISO8601()
  from?: string;

  /** Fim do intervalo (inclusivo). ISO 8601. Omitido = agora (UTC). */
  @IsOptional()
  @IsISO8601()
  to?: string;

  /** Granularidade do heatmap / buckets. */
  @IsOptional()
  @IsEnum(['hour', 'day'])
  bucket?: 'hour' | 'day';

  /**
   * Janela “ao vivo” nos últimos N minutos (relativo ao instante da requisição, UTC).
   * Ex.: 30 para humor recente. Opcional.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(60)
  liveMinutes?: number;
}
