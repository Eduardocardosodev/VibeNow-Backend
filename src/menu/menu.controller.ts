import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MenuUsecase } from './usecases/Menu.usecase';
import { CreateMenuDto } from './dto/create-menu.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateMenuItemFormDto } from './dto/create-menu-item-form.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpdateMenuItemFormDto } from './dto/update-menu-item-form.dto';
import { buildMenuItemPhotoPublicUrl } from './config/menu-item-photo-url';
import { getMenuItemMulterOptions } from './config/menu-item-multer.config';

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

  @Post(':id/items/upload')
  @UseInterceptors(FileInterceptor('photo', getMenuItemMulterOptions()))
  addItemUpload(
    @Req() req: Request,
    @Param('id') menuId: string,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Body() body: CreateMenuItemFormDto,
  ) {
    const photoUrl = photo
      ? buildMenuItemPhotoPublicUrl(req, photo.filename)
      : (body.photoMenuItem ?? null);
    const dto: CreateMenuItemDto = {
      name: body.name,
      description: body.description ?? null,
      photoMenuItem: photoUrl,
      price: body.price,
      type: body.type,
    };
    return this.menuUsecase.addItem(+menuId, dto);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') menuId: string,
    @Param('itemId') itemId: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ) {
    return this.menuUsecase.updateItem(+menuId, +itemId, updateMenuItemDto);
  }

  @Patch(':id/items/:itemId/upload')
  @UseInterceptors(FileInterceptor('photo', getMenuItemMulterOptions()))
  updateItemUpload(
    @Req() req: Request,
    @Param('id') menuId: string,
    @Param('itemId') itemId: string,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Body() body: UpdateMenuItemFormDto,
  ) {
    const dto: UpdateMenuItemDto = {};
    if (body.name !== undefined) dto.name = body.name;
    if (body.description !== undefined) dto.description = body.description;
    if (body.price !== undefined) dto.price = body.price;
    if (body.type !== undefined) dto.type = body.type;
    if (photo) {
      dto.photoMenuItem = buildMenuItemPhotoPublicUrl(req, photo.filename);
    } else if (body.photoMenuItem !== undefined) {
      dto.photoMenuItem = body.photoMenuItem;
    }
    return this.menuUsecase.updateItem(+menuId, +itemId, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') menuId: string, @Param('itemId') itemId: string) {
    return this.menuUsecase.removeItem(+menuId, +itemId);
  }
}
