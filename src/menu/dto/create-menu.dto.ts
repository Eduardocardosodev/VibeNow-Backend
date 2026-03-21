import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMenuItemDto } from './create-menu-item.dto';

export class CreateMenuDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  establishmentId: number;

  /** Itens do cardápio (opcional na criação; pode adicionar depois). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuItemDto)
  items?: CreateMenuItemDto[];
}
