import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Menu,
  MenuItem,
  MenuItemType,
} from '../../domain/entities/menu.entity';
import { IRepositoryMenu } from './IRepository.repository';

type PrismaMenuRow = {
  id: number;
  establishmentId: number;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaMenuItemRow = {
  id: number;
  menuId: number;
  name: string;
  description: string | null;
  photoMenuItem?: string | null;
  price: { toNumber?: () => number } | number;
  type: string;
  createdAt: Date;
  updatedAt: Date;
};

function priceToNumber(price: PrismaMenuItemRow['price']): number {
  if (typeof price === 'number') return price;
  if (
    price &&
    typeof (price as { toNumber: () => number }).toNumber === 'function'
  ) {
    return (price as { toNumber: () => number }).toNumber();
  }
  return Number(price);
}

@Injectable()
export class PrismaMenuRepository implements IRepositoryMenu {
  constructor(private readonly prisma: PrismaService) {}

  private menuToDomain(row: PrismaMenuRow): Menu {
    return new Menu(row.id, row.establishmentId, row.createdAt, row.updatedAt);
  }

  private itemToDomain(row: PrismaMenuItemRow): MenuItem {
    return new MenuItem(
      row.id,
      row.menuId,
      row.name,
      row.description,
      row.photoMenuItem ?? null,
      priceToNumber(row.price),
      row.type as MenuItemType,
      row.createdAt,
      row.updatedAt,
    );
  }

  async create(establishmentId: number): Promise<Menu> {
    const row = await this.prisma.menu.create({
      data: { establishmentId },
    });
    return this.menuToDomain(row as PrismaMenuRow);
  }

  async findByEstablishmentId(establishmentId: number): Promise<Menu | null> {
    const row = await this.prisma.menu.findUnique({
      where: { establishmentId },
    });
    return row ? this.menuToDomain(row as PrismaMenuRow) : null;
  }

  async findById(id: number): Promise<Menu | null> {
    const row = await this.prisma.menu.findUnique({
      where: { id },
    });
    return row ? this.menuToDomain(row as PrismaMenuRow) : null;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.menu.delete({ where: { id } });
  }

  async createItem(item: MenuItem): Promise<MenuItem> {
    const row = await this.prisma.menuItem.create({
      data: {
        menuId: item.menuId,
        name: item.name,
        description: item.description ?? undefined,
        photoMenuItem: item.photoMenuItem ?? undefined,
        price: item.price,
        type: item.type,
      },
    });
    return this.itemToDomain(row as PrismaMenuItemRow);
  }

  async findItemsByMenuId(menuId: number): Promise<MenuItem[]> {
    const rows = await this.prisma.menuItem.findMany({
      where: { menuId },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.itemToDomain(r as PrismaMenuItemRow));
  }

  async findItemById(id: number): Promise<MenuItem | null> {
    const row = await this.prisma.menuItem.findUnique({
      where: { id },
    });
    return row ? this.itemToDomain(row as PrismaMenuItemRow) : null;
  }

  async updateItem(item: MenuItem): Promise<MenuItem | null> {
    const row = await this.prisma.menuItem.update({
      where: { id: item.id },
      data: {
        name: item.name,
        description: item.description ?? undefined,
        photoMenuItem: item.photoMenuItem ?? undefined,
        price: item.price,
        type: item.type,
        updatedAt: item.updatedAt,
      },
    });
    return row ? this.itemToDomain(row as PrismaMenuItemRow) : null;
  }

  async deleteItem(id: number): Promise<void> {
    await this.prisma.menuItem.delete({ where: { id } });
  }
}
