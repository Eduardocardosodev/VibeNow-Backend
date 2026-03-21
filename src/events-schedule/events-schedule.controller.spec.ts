import { Test, TestingModule } from '@nestjs/testing';
import { EventsScheduleController } from './events-schedule.controller';
import { EventsScheduleUsecase } from './usecases/EventsSchedule.usecase';
import { EventRegistrationUsecase } from './usecases/EventRegistration.usecase';

describe('EventsScheduleController', () => {
  let controller: EventsScheduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsScheduleController],
      providers: [
        { provide: EventsScheduleUsecase, useValue: {} },
        { provide: EventRegistrationUsecase, useValue: {} },
      ],
    }).compile();

    controller = module.get<EventsScheduleController>(EventsScheduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
