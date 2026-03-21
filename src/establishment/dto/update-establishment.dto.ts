import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional } from 'class-validator';
import { CreateEstablishmentDto } from './create-establishment.dto';

export class UpdateEstablishmentDto extends PartialType(
  CreateEstablishmentDto,
) {
  @IsNumber()
  @IsOptional()
  score?: number | null;
}
