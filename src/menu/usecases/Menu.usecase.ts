import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Menu, MenuItem } from '../domain/entities/menu.entity';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { CreateMenuItemDto } from '../dto/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/update-menu-item.dto';
import { IRepositoryMenu } from '../infrastructure/repository/IRepository.repository';
import { IRepositoryEstablishment } from 'src/establishment/infrastructure/repository/IRepository.repository';

export type MenuWithItems = Menu & { items: MenuItem[] };

export class MenuUsecase {
  constructor(
    private readonly menuRepository: IRepositoryMenu,
    private readonly establishmentRepository: IRepositoryEstablishment,
  ) {}

  async create(data: CreateMenuDto): Promise<MenuWithItems> {
    const existing = await this.menuRepository.findByEstablishmentId(
      data.establishmentId,
    );
    if (existing) {
      throw new BadRequestException(
        'Este estabelecimento já possui um cardápio cadastrado.',
      );
    }

    const establishment = await this.establishmentRepository.findById(
      data.establishmentId,
    );
    if (!establishment) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }

    const menu = await this.menuRepository.create(data.establishmentId);
    const items: MenuItem[] = [];

    if (data.items?.length) {
      for (const dto of data.items) {
        const now = new Date();
        const item = new MenuItem(
          0,
          menu.id,
          dto.name,
          dto.description ?? null,
          dto.photoMenuItem ?? null,
          dto.price,
          dto.type,
          now,
          now,
        );
        const created = await this.menuRepository.createItem(item);
        items.push(created);
      }
    }

    return { ...menu, items };
  }

  async findByEstablishmentId(
    establishmentId: number,
  ): Promise<MenuWithItems | null> {
    const menu =
      await this.menuRepository.findByEstablishmentId(establishmentId);
    if (!menu) return null;
    const items = await this.menuRepository.findItemsByMenuId(menu.id);
    return { ...menu, items };
  }

  async findById(id: number): Promise<MenuWithItems> {
    const menu = await this.menuRepository.findById(id);
    if (!menu) {
      throw new NotFoundException('Cardápio não encontrado.');
    }
    const items = await this.menuRepository.findItemsByMenuId(menu.id);
    return { ...menu, items };
  }

  async delete(id: number): Promise<void> {
    const menu = await this.menuRepository.findById(id);
    if (!menu) {
      throw new NotFoundException('Cardápio não encontrado.');
    }
    await this.menuRepository.delete(id);
  }

  async addItem(menuId: number, dto: CreateMenuItemDto): Promise<MenuItem> {
    const menu = await this.menuRepository.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Cardápio não encontrado.');
    }
    const now = new Date();
    const item = new MenuItem(
      0,
      menuId,
      dto.name,
      dto.description ?? null,
      dto.photoMenuItem ?? null,
      dto.price,
      dto.type,
      now,
      now,
    );
    return this.menuRepository.createItem(item);
  }

  async updateItem(
    menuId: number,
    itemId: number,
    dto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    const item = await this.menuRepository.findItemById(itemId);
    if (!item || item.menuId !== menuId) {
      throw new NotFoundException('Item do cardápio não encontrado.');
    }
    const now = new Date();
    const updated = new MenuItem(
      item.id,
      item.menuId,
      dto.name ?? item.name,
      dto.description !== undefined ? dto.description : item.description,
      dto.photoMenuItem !== undefined ? dto.photoMenuItem : item.photoMenuItem,
      dto.price ?? item.price,
      dto.type ?? item.type,
      item.createdAt,
      now,
    );
    const result = await this.menuRepository.updateItem(updated);
    if (!result) throw new NotFoundException('Item do cardápio não encontrado.');
    return result;
  }

  async removeItem(menuId: number, itemId: number): Promise<void> {
    const item = await this.menuRepository.findItemById(itemId);
    if (!item || item.menuId !== menuId) {
      throw new NotFoundException('Item do cardápio não encontrado.');
    }
    await this.menuRepository.deleteItem(itemId);
  }
}
