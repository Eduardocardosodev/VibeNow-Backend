import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  EventListType,
  ScheduledEvent,
} from '../../domain/entities/scheduled-event.entity';
import { IRepositoryScheduledEvent } from './IRepository.repository';

function decimalToNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: () => number }).toNumber === 'function'
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type PrismaScheduledEventRow = {
  id: number;
  establishmentId: number;
  name: string;
  description: string | null;
  attractions: string | null;
  dj: string | null;
  priceInfo: string | null;
  eventStartsAt: Date;
  eventEndsAt: Date | null;
  listType: string;
  posterImageUrl: string | null;
  offersTableReservation: boolean;
  tablePeopleCapacity: number | null;
  tablesAvailable: number | null;
  tablePrice: unknown;
  offersBoothReservation: boolean;
  boothPeopleCapacity: number | null;
  boothsAvailable: number | null;
  boothPrice: unknown;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaScheduledEventRepository implements IRepositoryScheduledEvent {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: PrismaScheduledEventRow): ScheduledEvent {
    return new ScheduledEvent(
      row.id,
      row.establishmentId,
      row.name,
      row.description,
      row.attractions,
      row.dj,
      row.priceInfo,
      row.eventStartsAt,
      row.eventEndsAt,
      row.listType as EventListType,
      row.posterImageUrl,
      row.offersTableReservation,
      row.tablePeopleCapacity,
      row.tablesAvailable,
      decimalToNumber(row.tablePrice),
      row.offersBoothReservation,
      row.boothPeopleCapacity,
      row.boothsAvailable,
      decimalToNumber(row.boothPrice),
      row.createdAt,
      row.updatedAt,
    );
  }

  async create(entity: ScheduledEvent): Promise<ScheduledEvent> {
    const row = await this.prisma.scheduledEvent.create({
      data: {
        establishmentId: entity.establishmentId,
        name: entity.name,
        description: entity.description ?? undefined,
        attractions: entity.attractions ?? undefined,
        dj: entity.dj ?? undefined,
        priceInfo: entity.priceInfo ?? undefined,
        eventStartsAt: entity.eventStartsAt,
        eventEndsAt: entity.eventEndsAt ?? undefined,
        listType: entity.listType,
        posterImageUrl: entity.posterImageUrl ?? undefined,
        offersTableReservation: entity.offersTableReservation,
        tablePeopleCapacity: entity.tablePeopleCapacity ?? undefined,
        tablesAvailable: entity.tablesAvailable ?? undefined,
        tablePrice: entity.tablePrice ?? undefined,
        offersBoothReservation: entity.offersBoothReservation,
        boothPeopleCapacity: entity.boothPeopleCapacity ?? undefined,
        boothsAvailable: entity.boothsAvailable ?? undefined,
        boothPrice: entity.boothPrice ?? undefined,
      },
    });
    return this.toDomain(row as PrismaScheduledEventRow);
  }

  async findById(id: number): Promise<ScheduledEvent | null> {
    const row = await this.prisma.scheduledEvent.findUnique({
      where: { id },
    });
    return row ? this.toDomain(row as PrismaScheduledEventRow) : null;
  }

  async findByEstablishmentId(
    establishmentId: number,
  ): Promise<ScheduledEvent[]> {
    const rows = await this.prisma.scheduledEvent.findMany({
      where: { establishmentId },
      orderBy: { eventStartsAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r as PrismaScheduledEventRow));
  }

  async findUpcomingByEstablishmentId(
    establishmentId: number,
    from: Date,
  ): Promise<ScheduledEvent[]> {
    const rows = await this.prisma.scheduledEvent.findMany({
      where: { establishmentId, eventStartsAt: { gte: from } },
      orderBy: { eventStartsAt: 'asc' },
    });
    return rows.map((r) => this.toDomain(r as PrismaScheduledEventRow));
  }

  async findAllUpcoming(from: Date, limit: number): Promise<ScheduledEvent[]> {
    const rows = await this.prisma.scheduledEvent.findMany({
      where: { eventStartsAt: { gte: from } },
      orderBy: { eventStartsAt: 'asc' },
      take: limit,
    });
    return rows.map((r) => this.toDomain(r as PrismaScheduledEventRow));
  }

  async update(entity: ScheduledEvent): Promise<ScheduledEvent | null> {
    const row = await this.prisma.scheduledEvent.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        description: entity.description ?? undefined,
        attractions: entity.attractions ?? undefined,
        dj: entity.dj ?? undefined,
        priceInfo: entity.priceInfo ?? undefined,
        eventStartsAt: entity.eventStartsAt,
        eventEndsAt: entity.eventEndsAt ?? undefined,
        listType: entity.listType,
        posterImageUrl: entity.posterImageUrl ?? undefined,
        offersTableReservation: entity.offersTableReservation,
        tablePeopleCapacity: entity.tablePeopleCapacity ?? undefined,
        tablesAvailable: entity.tablesAvailable ?? undefined,
        tablePrice: entity.tablePrice ?? undefined,
        offersBoothReservation: entity.offersBoothReservation,
        boothPeopleCapacity: entity.boothPeopleCapacity ?? undefined,
        boothsAvailable: entity.boothsAvailable ?? undefined,
        boothPrice: entity.boothPrice ?? undefined,
        updatedAt: entity.updatedAt,
      },
    });
    return row ? this.toDomain(row as PrismaScheduledEventRow) : null;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.scheduledEvent.delete({ where: { id } });
  }
}
