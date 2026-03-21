import { Module } from '@nestjs/common';
import {
  EstablishmentModule,
  IREPOSITORY_ESTABLISHMENT,
} from 'src/establishment/establishment.module';
import { IRepositoryEstablishment } from 'src/establishment/infrastructure/repository/IRepository.repository';
import { EventsScheduleController } from './events-schedule.controller';
import { EventsScheduleUsecase } from './usecases/EventsSchedule.usecase';
import { EventRegistrationUsecase } from './usecases/EventRegistration.usecase';
import { IRepositoryScheduledEvent } from './infrastructure/repository/IRepository.repository';
import { PrismaScheduledEventRepository } from './infrastructure/repository/PrismaScheduledEvent.repository';
import { IRepositoryEventRegistration } from './infrastructure/repository/IEventRegistration.repository';
import { PrismaEventRegistrationRepository } from './infrastructure/repository/PrismaEventRegistration.repository';

export const IREPOSITORY_SCHEDULED_EVENT = Symbol('IRepositoryScheduledEvent');
export const IREPOSITORY_EVENT_REGISTRATION = Symbol(
  'IRepositoryEventRegistration',
);

@Module({
  imports: [EstablishmentModule],
  controllers: [EventsScheduleController],
  providers: [
    PrismaScheduledEventRepository,
    PrismaEventRegistrationRepository,
    {
      provide: IREPOSITORY_SCHEDULED_EVENT,
      useExisting: PrismaScheduledEventRepository,
    },
    {
      provide: IREPOSITORY_EVENT_REGISTRATION,
      useExisting: PrismaEventRegistrationRepository,
    },
    {
      provide: EventsScheduleUsecase,
      useFactory: (
        eventRepo: IRepositoryScheduledEvent,
        establishmentRepo: IRepositoryEstablishment,
      ) => new EventsScheduleUsecase(eventRepo, establishmentRepo),
      inject: [IREPOSITORY_SCHEDULED_EVENT, IREPOSITORY_ESTABLISHMENT],
    },
    {
      provide: EventRegistrationUsecase,
      useFactory: (
        eventRepo: IRepositoryScheduledEvent,
        registrationRepo: IRepositoryEventRegistration,
      ) => new EventRegistrationUsecase(eventRepo, registrationRepo),
      inject: [IREPOSITORY_SCHEDULED_EVENT, IREPOSITORY_EVENT_REGISTRATION],
    },
  ],
})
export class EventsScheduleModule {}
