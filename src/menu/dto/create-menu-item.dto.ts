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
import { Type } from 'class-transformer';
import { MenuItemType, MENU_ITEM_TYPES } from '../domain/entities/menu.entity';

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string | null;

  @IsString()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  photoMenuItem?: string | null;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(MENU_ITEM_TYPES)
  type: MenuItemType;
}
