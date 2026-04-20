import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { IRepositoryMenu } from 'src/menu/infrastructure/repository/IRepository.repository';
import { EstablishmentAccessService } from 'src/establishment/services/establishment-access.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import {
  OrderListQueryDto,
  resolveOrderListPagination,
} from '../dto/order-list-query.dto';
import type { OrderStatus } from 'generated/prisma/enums';
import { isEstablishmentOpen } from 'src/@shared/utils/is-establishment-open';
import type { OpeningHoursMap } from 'src/establishment/domain/entities/establishment.entity';

function decimalToNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (
    value &&
    typeof (value as { toNumber: () => number }).toNumber === 'function'
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

/** Itens do pedido + foto/descrição do `MenuItem` (URLs em `photoMenuItem`, ver uploads em `menu-items/`). */
const orderItemsWithMenuSnapshot = {
  orderBy: { id: 'asc' as const },
  include: {
    menuItem: {
      select: {
        photoMenuItem: true,
        description: true,
        type: true,
      },
    },
  },
};

export class OrdersUsecase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly menuRepository: IRepositoryMenu,
    private readonly establishmentAccess: EstablishmentAccessService,
  ) {}

  private mapOrderRow(order: {
    id: number;
    establishmentId: number;
    userId: number;
    locationNote: string;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: number;
      menuItemId: number | null;
      quantity: number;
      unitPrice: unknown;
      itemName: string;
      menuItem: {
        photoMenuItem: string | null;
        description: string | null;
        type: string;
      } | null;
    }>;
    user?: { id: number; name: string; phone: string };
    establishment?: {
      id: number;
      name: string;
      profilePhoto: string | null;
    };
  }) {
    return {
      id: order.id,
      establishmentId: order.establishmentId,
      userId: order.userId,
      locationNote: order.locationNote,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((it) => ({
        id: it.id,
        menuItemId: it.menuItemId,
        quantity: it.quantity,
        unitPrice: decimalToNumber(it.unitPrice),
        itemName: it.itemName,
        photoMenuItem: it.menuItem?.photoMenuItem ?? null,
        description: it.menuItem?.description ?? null,
        type: it.menuItem?.type ?? null,
      })),
      user: order.user,
      establishment: order.establishment,
    };
  }

  /**
   * Resposta do detalhe do pedido (ecrã tipo app de delivery): linhas com subtotal,
   * total do pedido e ficha do estabelecimento para contacto / mapa.
   */
  private mapOrderDetailRow(order: {
    id: number;
    establishmentId: number;
    userId: number;
    locationNote: string;
    status: OrderStatus;
    idempotencyKey: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: number;
      menuItemId: number | null;
      quantity: number;
      unitPrice: unknown;
      itemName: string;
      menuItem: {
        photoMenuItem: string | null;
        description: string | null;
        type: string;
      } | null;
    }>;
    establishment: {
      id: number;
      name: string;
      address: string;
      addressNumber: string;
      city: string;
      state: string;
      zipCode: string;
      phone: string;
      profilePhoto: string | null;
      latitude: number;
      longitude: number;
    };
  }) {
    const items = order.items.map((it) => {
      const unitPrice = decimalToNumber(it.unitPrice);
      const lineTotal = Math.round(unitPrice * it.quantity * 100) / 100;
      return {
        id: it.id,
        menuItemId: it.menuItemId,
        itemName: it.itemName,
        quantity: it.quantity,
        unitPrice,
        lineTotal,
        photoMenuItem: it.menuItem?.photoMenuItem ?? null,
        description: it.menuItem?.description ?? null,
        type: it.menuItem?.type ?? null,
      };
    });
    const itemsTotal =
      Math.round(items.reduce((s, it) => s + it.lineTotal, 0) * 100) / 100;

    return {
      id: order.id,
      establishmentId: order.establishmentId,
      userId: order.userId,
      locationNote: order.locationNote,
      status: order.status,
      idempotencyKey: order.idempotencyKey,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items,
      summary: {
        itemsTotal,
        lineCount: items.length,
      },
      establishment: order.establishment,
    };
  }

  private orderMatchesResolvedPayload(
    order: {
      establishmentId: number;
      locationNote: string;
      items: Array<{ menuItemId: number | null; quantity: number }>;
    },
    establishmentId: number,
    locationNoteTrimmed: string,
    resolvedLines: Array<{ menuItemId: number; quantity: number }>,
  ): boolean {
    if (order.establishmentId !== establishmentId) return false;
    if (order.locationNote !== locationNoteTrimmed) return false;
    const qtyBy = new Map<number, number>();
    for (const it of order.items) {
      if (it.menuItemId == null) continue;
      qtyBy.set(it.menuItemId, (qtyBy.get(it.menuItemId) ?? 0) + it.quantity);
    }
    if (qtyBy.size !== resolvedLines.length) return false;
    for (const line of resolvedLines) {
      if (qtyBy.get(line.menuItemId) !== line.quantity) return false;
    }
    return true;
  }

  async create(
    userId: number,
    dto: CreateOrderDto,
    idempotencyKey: string,
  ): Promise<{
    order: ReturnType<OrdersUsecase['mapOrderRow']>;
    replay: boolean;
  }> {
    const menu = await this.menuRepository.findByEstablishmentId(
      dto.establishmentId,
    );
    if (!menu) {
      throw new NotFoundException(
        'Este estabelecimento não possui cardápio para pedidos.',
      );
    }

    const establishment = await this.prisma.establishment.findUnique({
      where: { id: dto.establishmentId },
      select: { openingHours: true, operatingTimeZone: true },
    });
    if (!establishment) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }

    const openingHours = establishment.openingHours as OpeningHoursMap | null;

    if (
      !isEstablishmentOpen(
        openingHours,
        new Date(),
        establishment.operatingTimeZone,
      )
    ) {
      throw new BadRequestException(
        'O estabelecimento está fechado no momento. Pedidos só podem ser realizados durante o horário de funcionamento.',
      );
    }

    const qtyByMenuItem = new Map<number, number>();
    for (const line of dto.items) {
      const prev = qtyByMenuItem.get(line.menuItemId) ?? 0;
      qtyByMenuItem.set(line.menuItemId, prev + line.quantity);
    }

    const resolvedLines: Array<{
      menuItemId: number;
      quantity: number;
      unitPrice: number;
      itemName: string;
    }> = [];

    for (const [menuItemId, quantity] of qtyByMenuItem) {
      const item = await this.menuRepository.findItemById(menuItemId);
      if (!item || item.menuId !== menu.id) {
        throw new BadRequestException(
          `Item do cardápio inválido ou de outro estabelecimento: ${menuItemId}`,
        );
      }
      resolvedLines.push({
        menuItemId: item.id,
        quantity,
        unitPrice: item.price,
        itemName: item.name,
      });
    }

    const locationNoteTrimmed = dto.locationNote.trim();

    const existing = await this.prisma.customerOrder.findFirst({
      where: { userId, idempotencyKey },
      include: {
        items: orderItemsWithMenuSnapshot,
        user: { select: { id: true, name: true, phone: true } },
        establishment: {
          select: { id: true, name: true, profilePhoto: true },
        },
      },
    });

    if (existing) {
      if (existing.establishmentId !== dto.establishmentId) {
        throw new ConflictException(
          'Esta Idempotency-Key já foi usada para outro estabelecimento. Gere uma chave nova para cada pedido.',
        );
      }
      if (
        !this.orderMatchesResolvedPayload(
          existing,
          dto.establishmentId,
          locationNoteTrimmed,
          resolvedLines,
        )
      ) {
        throw new ConflictException(
          'Esta Idempotency-Key já foi usada para outro pedido. Use uma chave nova ou reenvie o mesmo corpo.',
        );
      }
      return { order: this.mapOrderRow(existing), replay: true };
    }

    try {
      const order = await this.prisma.customerOrder.create({
        data: {
          establishmentId: dto.establishmentId,
          userId,
          locationNote: locationNoteTrimmed,
          idempotencyKey,
          items: {
            create: resolvedLines.map((l) => ({
              menuItemId: l.menuItemId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              itemName: l.itemName,
            })),
          },
        },
        include: {
          items: orderItemsWithMenuSnapshot,
          user: { select: { id: true, name: true, phone: true } },
          establishment: {
            select: { id: true, name: true, profilePhoto: true },
          },
        },
      });
      return { order: this.mapOrderRow(order), replay: false };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        const raced = await this.prisma.customerOrder.findFirst({
          where: { userId, idempotencyKey },
          include: {
            items: orderItemsWithMenuSnapshot,
            user: { select: { id: true, name: true, phone: true } },
            establishment: {
              select: { id: true, name: true, profilePhoto: true },
            },
          },
        });
        if (
          raced &&
          raced.establishmentId === dto.establishmentId &&
          this.orderMatchesResolvedPayload(
            raced,
            dto.establishmentId,
            locationNoteTrimmed,
            resolvedLines,
          )
        ) {
          return { order: this.mapOrderRow(raced), replay: true };
        }
      }
      throw e;
    }
  }

  async listMine(
    userId: number,
    query: OrderListQueryDto,
  ): Promise<{
    items: ReturnType<OrdersUsecase['mapOrderRow']>[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { page: p, pageSize: size, skip } = resolveOrderListPagination(query);

    const where: { userId: number; status?: OrderStatus } = { userId };
    if (query.status != null) {
      where.status = query.status;
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.customerOrder.count({ where }),
      this.prisma.customerOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: size,
        include: {
          items: orderItemsWithMenuSnapshot,
          establishment: {
            select: { id: true, name: true, profilePhoto: true },
          },
        },
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / size);
    return {
      items: rows.map((o) =>
        this.mapOrderRow({
          ...o,
          user: undefined,
        }),
      ),
      total,
      page: p,
      pageSize: size,
      totalPages,
    };
  }

  /** Detalhe de um pedido do utilizador (404 se não existir ou for de outro user). */
  async getMineById(userId: number, orderId: number) {
    const order = await this.prisma.customerOrder.findFirst({
      where: { id: orderId, userId },
      include: {
        items: orderItemsWithMenuSnapshot,
        establishment: {
          select: {
            id: true,
            name: true,
            address: true,
            addressNumber: true,
            city: true,
            state: true,
            zipCode: true,
            phone: true,
            profilePhoto: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }
    return this.mapOrderDetailRow(order);
  }

  async listForEstablishment(
    requestUserId: number,
    establishmentId: number,
    query: OrderListQueryDto,
  ) {
    const allowed = await this.establishmentAccess.isStaff(
      requestUserId,
      establishmentId,
    );
    if (!allowed) {
      throw new ForbiddenException(
        'Sem acesso a pedidos deste estabelecimento.',
      );
    }

    const { page: p, pageSize: size, skip } = resolveOrderListPagination(query);
    const where: {
      establishmentId: number;
      status?: OrderStatus;
    } = { establishmentId };
    if (query.status != null) {
      where.status = query.status;
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.customerOrder.count({ where }),
      this.prisma.customerOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: size,
        include: {
          items: orderItemsWithMenuSnapshot,
          user: { select: { id: true, name: true, phone: true } },
        },
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / size);
    return {
      items: rows.map((o) => this.mapOrderRow(o)),
      total,
      page: p,
      pageSize: size,
      totalPages,
    };
  }

  async updateStatus(
    requestUserId: number,
    establishmentId: number,
    orderId: number,
    status: OrderStatus,
  ) {
    const order = await this.prisma.customerOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    if (order.establishmentId !== establishmentId) {
      throw new BadRequestException(
        'Pedido não pertence a este estabelecimento',
      );
    }

    const allowed = await this.establishmentAccess.isStaff(
      requestUserId,
      establishmentId,
    );
    if (!allowed) {
      throw new ForbiddenException('Sem permissão para atualizar este pedido.');
    }

    const updated = await this.prisma.customerOrder.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: orderItemsWithMenuSnapshot,
        user: { select: { id: true, name: true, phone: true } },
        establishment: {
          select: { id: true, name: true, profilePhoto: true },
        },
      },
    });

    return this.mapOrderRow(updated);
  }
}
