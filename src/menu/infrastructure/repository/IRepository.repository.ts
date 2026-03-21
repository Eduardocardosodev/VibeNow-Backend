import { Menu } from '../../domain/entities/menu.entity';
import { MenuItem } from '../../domain/entities/menu.entity';

export interface IRepositoryMenu {
  create(establishmentId: number): Promise<Menu>;
  findByEstablishmentId(establishmentId: number): Promise<Menu | null>;
  findById(id: number): Promise<Menu | null>;
  delete(id: number): Promise<void>;

  createItem(item: MenuItem): Promise<MenuItem>;
  findItemsByMenuId(menuId: number): Promise<MenuItem[]>;
  findItemById(id: number): Promise<MenuItem | null>;
  updateItem(item: MenuItem): Promise<MenuItem | null>;
  deleteItem(id: number): Promise<void>;
}
