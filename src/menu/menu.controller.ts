import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MenuUsecase } from './usecases/Menu.usecase';
import { CreateMenuDto } from './dto/create-menu.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuUsecase: MenuUsecase) {}

  @Post()
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuUsecase.create(createMenuDto);
  }

  @Get('establishment/:establishmentId')
  findByEstablishment(@Param('establishmentId') establishmentId: string) {
    return this.menuUsecase.findByEstablishmentId(+establishmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuUsecase.findById(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuUsecase.delete(+id);
  }

  @Post(':id/items')
  addItem(
    @Param('id') menuId: string,
    @Body() createMenuItemDto: CreateMenuItemDto,
  ) {
    return this.menuUsecase.addItem(+menuId, createMenuItemDto);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') menuId: string,
    @Param('itemId') itemId: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ) {
    return this.menuUsecase.updateItem(+menuId, +itemId, updateMenuItemDto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') menuId: string, @Param('itemId') itemId: string) {
    return this.menuUsecase.removeItem(+menuId, +itemId);
  }
}
