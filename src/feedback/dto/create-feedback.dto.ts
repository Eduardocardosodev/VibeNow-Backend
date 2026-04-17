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
import { Type } from 'class-transformer';

export class CreateFeedbackDto {
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

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(500)
  comment?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  photoUrl?: string | null;
}
