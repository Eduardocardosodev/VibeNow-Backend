import { ScheduledEvent } from '../../domain/entities/scheduled-event.entity';

export interface IRepositoryScheduledEvent {
  create(entity: ScheduledEvent): Promise<ScheduledEvent>;
  findById(id: number): Promise<ScheduledEvent | null>;
  findByEstablishmentId(establishmentId: number): Promise<ScheduledEvent[]>;
  findUpcomingByEstablishmentId(
    establishmentId: number,
    from: Date,
  ): Promise<ScheduledEvent[]>;
  findAllUpcoming(from: Date, limit: number): Promise<ScheduledEvent[]>;
  update(entity: ScheduledEvent): Promise<ScheduledEvent | null>;
  delete(id: number): Promise<void>;
}
