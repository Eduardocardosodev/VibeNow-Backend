import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MenuItemType, MENU_ITEM_TYPES } from '../domain/entities/menu.entity';

function emptyToUndefined({ value }: { value: unknown }): unknown {
  if (value === '' || value === undefined || value === null) return undefined;
  return value;
}

/** Campos de multipart (exceto ficheiro `photo`) para criar item. */
export class CreateMenuItemFormDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUrl()
  @MaxLength(500)
  photoMenuItem?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(MENU_ITEM_TYPES)
  type: MenuItemType;
}
