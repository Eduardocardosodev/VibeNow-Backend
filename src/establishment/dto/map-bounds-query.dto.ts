import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

/**
 * Retângulo visível do mapa (cantos opostos).
 * O backend normaliza min/max — a ordem sw/ne não precisa ser “perfeita”.
 */
export class MapBoundsQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  swLat: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  swLng: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  neLat: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  neLng: number;

  /** Centro para ordenar por distância e preencher `distanceKm` (ex.: GPS do usuário). */
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  centerLat?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  centerLng?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(250)
  limit?: number;
}
