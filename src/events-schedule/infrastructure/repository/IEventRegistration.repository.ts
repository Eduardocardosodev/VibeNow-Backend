import { EventRegistration } from '../../domain/entities/event-registration.entity';
import { ScheduledEvent } from '../../domain/entities/scheduled-event.entity';

export type RegistrationWithEvent = {
  registration: EventRegistration;
  event: ScheduledEvent;
};

export interface IRepositoryEventRegistration {
  create(userId: number, scheduledEventId: number): Promise<EventRegistration>;
  deleteByUserAndEvent(userId: number, scheduledEventId: number): Promise<void>;
  findByUserAndEvent(
    userId: number,
    scheduledEventId: number,
  ): Promise<EventRegistration | null>;
  countByScheduledEventId(scheduledEventId: number): Promise<number>;
  findByUserIdWithEvents(userId: number): Promise<RegistrationWithEvent[]>;
}
