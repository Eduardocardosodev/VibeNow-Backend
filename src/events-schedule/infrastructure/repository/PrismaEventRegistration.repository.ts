import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventRegistration } from '../../domain/entities/event-registration.entity';
import {
  EventListType,
  ScheduledEvent,
} from '../../domain/entities/scheduled-event.entity';
import {
  IRepositoryEventRegistration,
  RegistrationWithEvent,
} from './IEventRegistration.repository';

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

type PrismaRegRow = {
  id: number;
  userId: number;
  scheduledEventId: number;
  createdAt: Date;
};

type PrismaEventRow = {
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

function regToDomain(row: PrismaRegRow): EventRegistration {
  return new EventRegistration(
    row.id,
    row.userId,
    row.scheduledEventId,
    row.createdAt,
  );
}

function eventToDomain(row: PrismaEventRow): ScheduledEvent {
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

@Injectable()
export class PrismaEventRegistrationRepository implements IRepositoryEventRegistration {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: number,
    scheduledEventId: number,
  ): Promise<EventRegistration> {
    const row = await this.prisma.eventRegistration.create({
      data: { userId, scheduledEventId },
    });
    return regToDomain(row as PrismaRegRow);
  }

  async deleteByUserAndEvent(
    userId: number,
    scheduledEventId: number,
  ): Promise<void> {
    await this.prisma.eventRegistration.deleteMany({
      where: { userId, scheduledEventId },
    });
  }

  async findByUserAndEvent(
    userId: number,
    scheduledEventId: number,
  ): Promise<EventRegistration | null> {
    const row = await this.prisma.eventRegistration.findUnique({
      where: {
        userId_scheduledEventId: { userId, scheduledEventId },
      },
    });
    return row ? regToDomain(row as PrismaRegRow) : null;
  }

  async countByScheduledEventId(scheduledEventId: number): Promise<number> {
    return this.prisma.eventRegistration.count({
      where: { scheduledEventId },
    });
  }

  async findByUserIdWithEvents(
    userId: number,
  ): Promise<RegistrationWithEvent[]> {
    const rows = await this.prisma.eventRegistration.findMany({
      where: { userId },
      include: { scheduledEvent: true },
      orderBy: { scheduledEvent: { eventStartsAt: 'asc' } },
    });
    return rows.map((r) => ({
      registration: regToDomain(r as PrismaRegRow),
      event: eventToDomain(r.scheduledEvent as PrismaEventRow),
    }));
  }
}
