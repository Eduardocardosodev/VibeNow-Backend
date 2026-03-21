import {
  IsInt,
  IsNotEmpty,
  IsNumber,
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

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  rating: number;

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
