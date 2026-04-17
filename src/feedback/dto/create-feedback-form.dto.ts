import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

function emptyToUndefined({ value }: { value: unknown }): unknown {
  if (value === '' || value === undefined || value === null) return undefined;
  return value;
}

/** Campos de multipart (exceto ficheiro `photo`) para criar feedback. */
export class CreateFeedbackFormDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  establishmentId: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  ratingCrowding: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  ratingAnimation: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  ratingOrganization: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  ratingHygiene: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  ratingAmbience: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  comment?: string | null;
}
