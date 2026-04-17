import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MenuItemType, MENU_ITEM_TYPES } from '../domain/entities/menu.entity';

function emptyToNull({ value }: { value: unknown }): unknown {
  if (value === '') return null;
  return value;
}

/** Campos opcionais de multipart (exceto ficheiro `photo`) para atualizar item. */
export class UpdateMenuItemFormDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(MENU_ITEM_TYPES)
  type?: MenuItemType;

  @IsOptional()
  @Transform(emptyToNull)
  @IsUrl()
  @MaxLength(500)
  photoMenuItem?: string | null;
}
