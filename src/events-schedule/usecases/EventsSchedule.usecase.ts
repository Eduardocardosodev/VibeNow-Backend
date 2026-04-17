import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ScheduledEvent } from '../domain/entities/scheduled-event.entity';
import { CreateScheduledEventDto } from '../dto/create-scheduled-event.dto';
import { UpdateScheduledEventDto } from '../dto/update-scheduled-event.dto';
import { IRepositoryScheduledEvent } from '../infrastructure/repository/IRepository.repository';
import { IRepositoryEstablishment } from 'src/establishment/infrastructure/repository/IRepository.repository';

const DEFAULT_UPCOMING_LIMIT = 100;

function assertReservationCapacities(e: {
  offersTableReservation: boolean;
  tablePeopleCapacity: number | null;
  tablesAvailable: number | null;
  tablePrice: number | null;
  offersBoothReservation: boolean;
  boothPeopleCapacity: number | null;
  boothsAvailable: number | null;
  boothPrice: number | null;
}): void {
  if (
    e.offersTableReservation &&
    (e.tablePeopleCapacity == null || e.tablePeopleCapacity < 1)
  ) {
    throw new BadRequestException(
      'tablePeopleCapacity é obrigatório e deve ser >= 1 quando offersTableReservation for true.',
    );
  }
  if (
    e.offersTableReservation &&
    (e.tablesAvailable == null || e.tablesAvailable < 1)
  ) {
    throw new BadRequestException(
      'tablesAvailable é obrigatório e deve ser >= 1 quando offersTableReservation for true.',
    );
  }
  if (
    e.offersTableReservation &&
    (e.tablePrice == null || e.tablePrice < 0.01)
  ) {
    throw new BadRequestException(
      'tablePrice é obrigatório e deve ser >= 0.01 quando offersTableReservation for true.',
    );
  }
  if (
    e.offersBoothReservation &&
    (e.boothPeopleCapacity == null || e.boothPeopleCapacity < 1)
  ) {
    throw new BadRequestException(
      'boothPeopleCapacity é obrigatório e deve ser >= 1 quando offersBoothReservation for true.',
    );
  }
  if (
    e.offersBoothReservation &&
    (e.boothsAvailable == null || e.boothsAvailable < 1)
  ) {
    throw new BadRequestException(
      'boothsAvailable é obrigatório e deve ser >= 1 quando offersBoothReservation for true.',
    );
  }
  if (
    e.offersBoothReservation &&
    (e.boothPrice == null || e.boothPrice < 0.01)
  ) {
    throw new BadRequestException(
      'boothPrice é obrigatório e deve ser >= 0.01 quando offersBoothReservation for true.',
    );
  }
}

export class EventsScheduleUsecase {
  constructor(
    private readonly eventRepository: IRepositoryScheduledEvent,
    private readonly establishmentRepository: IRepositoryEstablishment,
  ) {}

  async create(data: CreateScheduledEventDto): Promise<ScheduledEvent> {
    const establishment = await this.establishmentRepository.findById(
      data.establishmentId,
    );
    if (!establishment) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }

    const startsAt = new Date(data.eventStartsAt);
    const endsAt =
      data.eventEndsAt != null && data.eventEndsAt !== ''
        ? new Date(data.eventEndsAt)
        : null;

    const offersTable = data.offersTableReservation === true;
    const offersBooth = data.offersBoothReservation === true;
    const tableCap = offersTable ? (data.tablePeopleCapacity ?? null) : null;
    const tablesAvail = offersTable ? (data.tablesAvailable ?? null) : null;
    const boothCap = offersBooth ? (data.boothPeopleCapacity ?? null) : null;
    const boothsAvail = offersBooth ? (data.boothsAvailable ?? null) : null;
    const tablePriceVal = offersTable ? (data.tablePrice ?? null) : null;
    const boothPriceVal = offersBooth ? (data.boothPrice ?? null) : null;

    const now = new Date();
    const entity = new ScheduledEvent(
      0,
      data.establishmentId,
      data.name,
      data.description ?? null,
      data.attractions ?? null,
      data.dj ?? null,
      data.priceInfo ?? null,
      startsAt,
      endsAt,
      data.listType ?? 'GENERAL',
      data.posterImageUrl ?? null,
      offersTable,
      tableCap,
      tablesAvail,
      tablePriceVal,
      offersBooth,
      boothCap,
      boothsAvail,
      boothPriceVal,
      now,
      now,
    );

    assertReservationCapacities(entity);
    return this.eventRepository.create(entity);
  }

  async findById(id: number): Promise<ScheduledEvent> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }
    return event;
  }

  /** Todos os eventos do estabelecimento (passados e futuros), mais recentes primeiro. */
  async findByEstablishmentId(
    establishmentId: number,
  ): Promise<ScheduledEvent[]> {
    return this.eventRepository.findByEstablishmentId(establishmentId);
  }

  /** Próximos eventos do estabelecimento (a partir de agora), ordem cronológica. */
  async findUpcomingByEstablishmentId(
    establishmentId: number,
  ): Promise<ScheduledEvent[]> {
    return this.eventRepository.findUpcomingByEstablishmentId(
      establishmentId,
      new Date(),
    );
  }

  /** Feed: próximos eventos de todos os estabelecimentos. */
  async findAllUpcoming(limit?: number): Promise<ScheduledEvent[]> {
    const take = Math.min(Math.max(1, limit ?? DEFAULT_UPCOMING_LIMIT), 200);
    return this.eventRepository.findAllUpcoming(new Date(), take);
  }

  async update(
    id: number,
    data: UpdateScheduledEventDto,
  ): Promise<ScheduledEvent> {
    const existing = await this.eventRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Evento não encontrado.');
    }

    if (data.establishmentId != null) {
      const establishment = await this.establishmentRepository.findById(
        data.establishmentId,
      );
      if (!establishment) {
        throw new NotFoundException('Estabelecimento não encontrado.');
      }
    }

    const startsAt =
      data.eventStartsAt != null
        ? new Date(data.eventStartsAt)
        : existing.eventStartsAt;
    const endsAt =
      data.eventEndsAt !== undefined
        ? data.eventEndsAt != null && data.eventEndsAt !== ''
          ? new Date(data.eventEndsAt)
          : null
        : existing.eventEndsAt;

    const offersTable =
      data.offersTableReservation !== undefined
        ? data.offersTableReservation === true
        : existing.offersTableReservation;
    const offersBooth =
      data.offersBoothReservation !== undefined
        ? data.offersBoothReservation === true
        : existing.offersBoothReservation;

    let tableCap: number | null;
    if (data.offersTableReservation === false) {
      tableCap = null;
    } else if (offersTable) {
      tableCap =
        data.tablePeopleCapacity !== undefined
          ? data.tablePeopleCapacity
          : existing.tablePeopleCapacity;
    } else {
      tableCap = null;
    }

    let tablesAvail: number | null;
    if (data.offersTableReservation === false) {
      tablesAvail = null;
    } else if (offersTable) {
      tablesAvail =
        data.tablesAvailable !== undefined
          ? data.tablesAvailable
          : existing.tablesAvailable;
    } else {
      tablesAvail = null;
    }

    let tablePriceVal: number | null;
    if (data.offersTableReservation === false) {
      tablePriceVal = null;
    } else if (offersTable) {
      tablePriceVal =
        data.tablePrice !== undefined ? data.tablePrice : existing.tablePrice;
    } else {
      tablePriceVal = null;
    }

    let boothCap: number | null;
    if (data.offersBoothReservation === false) {
      boothCap = null;
    } else if (offersBooth) {
      boothCap =
        data.boothPeopleCapacity !== undefined
          ? data.boothPeopleCapacity
          : existing.boothPeopleCapacity;
    } else {
      boothCap = null;
    }

    let boothsAvail: number | null;
    if (data.offersBoothReservation === false) {
      boothsAvail = null;
    } else if (offersBooth) {
      boothsAvail =
        data.boothsAvailable !== undefined
          ? data.boothsAvailable
          : existing.boothsAvailable;
    } else {
      boothsAvail = null;
    }

    let boothPriceVal: number | null;
    if (data.offersBoothReservation === false) {
      boothPriceVal = null;
    } else if (offersBooth) {
      boothPriceVal =
        data.boothPrice !== undefined ? data.boothPrice : existing.boothPrice;
    } else {
      boothPriceVal = null;
    }

    const now = new Date();
    const updated = new ScheduledEvent(
      existing.id,
      data.establishmentId ?? existing.establishmentId,
      data.name ?? existing.name,
      data.description !== undefined ? data.description : existing.description,
      data.attractions !== undefined ? data.attractions : existing.attractions,
      data.dj !== undefined ? data.dj : existing.dj,
      data.priceInfo !== undefined ? data.priceInfo : existing.priceInfo,
      startsAt,
      endsAt,
      data.listType ?? existing.listType,
      data.posterImageUrl !== undefined
        ? data.posterImageUrl
        : existing.posterImageUrl,
      offersTable,
      tableCap,
      tablesAvail,
      tablePriceVal,
      offersBooth,
      boothCap,
      boothsAvail,
      boothPriceVal,
      existing.createdAt,
      now,
    );

    assertReservationCapacities(updated);
    const result = await this.eventRepository.update(updated);
    if (!result) throw new NotFoundException('Evento não encontrado.');
    return result;
  }

  async delete(id: number): Promise<void> {
    const existing = await this.eventRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Evento não encontrado.');
    }
    await this.eventRepository.delete(id);
  }
}
