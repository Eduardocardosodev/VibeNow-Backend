/** Tipo do item do cardápio. */
export type MenuItemType =
  | 'ALCOHOLIC_DRINK'
  | 'NON_ALCOHOLIC_DRINK'
  | 'COMBO'
  | 'BOTTLE'
  | 'FOOD'
  | 'HOOKAH';

export const MENU_ITEM_TYPES: MenuItemType[] = [
  'ALCOHOLIC_DRINK',
  'NON_ALCOHOLIC_DRINK',
  'COMBO',
  'BOTTLE',
  'FOOD',
  'HOOKAH',
];

export class MenuItem {
  constructor(
    public readonly id: number,
    public menuId: number,
    public name: string,
    public description: string | null,
    public photoMenuItem: string | null,
    public price: number,
    public type: MenuItemType,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}

export class Menu {
  constructor(
    public readonly id: number,
    public establishmentId: number,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
