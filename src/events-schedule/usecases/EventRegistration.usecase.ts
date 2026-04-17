import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ScheduledEvent } from '../domain/entities/scheduled-event.entity';
import { IRepositoryScheduledEvent } from '../infrastructure/repository/IRepository.repository';
import { IRepositoryEventRegistration } from '../infrastructure/repository/IEventRegistration.repository';

function toSerializableEvent(event: ScheduledEvent) {
  return {
    id: event.id,
    establishmentId: event.establishmentId,
    name: event.name,
    description: event.description,
    attractions: event.attractions,
    dj: event.dj,
    priceInfo: event.priceInfo,
    eventStartsAt: event.eventStartsAt,
    eventEndsAt: event.eventEndsAt,
    listType: event.listType,
    posterImageUrl: event.posterImageUrl,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

export class EventRegistrationUsecase {
  constructor(
    private readonly eventRepository: IRepositoryScheduledEvent,
    private readonly registrationRepository: IRepositoryEventRegistration,
  ) {}

  async register(userId: number, scheduledEventId: number) {
    const event = await this.eventRepository.findById(scheduledEventId);
    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    const now = new Date();
    if (event.eventStartsAt.getTime() < now.getTime()) {
      throw new BadRequestException(
        'Não é possível se inscrever em eventos que já começaram.',
      );
    }

    const existing = await this.registrationRepository.findByUserAndEvent(
      userId,
      scheduledEventId,
    );
    if (existing) {
      throw new ConflictException('Você já está inscrito neste evento.');
    }

    try {
      const registration = await this.registrationRepository.create(
        userId,
        scheduledEventId,
      );
      return {
        registrationId: registration.id,
        scheduledEventId: registration.scheduledEventId,
        registeredAt: registration.createdAt,
        message: 'Inscrição confirmada.',
      };
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('Você já está inscrito neste evento.');
      }
      throw e;
    }
  }

  async unregister(userId: number, scheduledEventId: number) {
    const event = await this.eventRepository.findById(scheduledEventId);
    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    const existing = await this.registrationRepository.findByUserAndEvent(
      userId,
      scheduledEventId,
    );
    if (!existing) {
      throw new NotFoundException('Você não está inscrito neste evento.');
    }

    await this.registrationRepository.deleteByUserAndEvent(
      userId,
      scheduledEventId,
    );
    return { message: 'Inscrição cancelada.' };
  }

  async getMyStatus(userId: number, scheduledEventId: number) {
    const event = await this.eventRepository.findById(scheduledEventId);
    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    const reg = await this.registrationRepository.findByUserAndEvent(
      userId,
      scheduledEventId,
    );
    return {
      registered: reg != null,
      registeredAt: reg?.createdAt ?? null,
    };
  }

  async countRegistrations(scheduledEventId: number) {
    const event = await this.eventRepository.findById(scheduledEventId);
    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    const count =
      await this.registrationRepository.countByScheduledEventId(
        scheduledEventId,
      );
    return { count };
  }

  async listMyRegistrations(userId: number) {
    const rows =
      await this.registrationRepository.findByUserIdWithEvents(userId);
    return rows.map((r) => ({
      registrationId: r.registration.id,
      registeredAt: r.registration.createdAt,
      event: toSerializableEvent(r.event),
    }));
  }
}
