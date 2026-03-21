import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller';
import { FeedbackUsecase } from './usecases/Feedback.usecase';

describe('FeedbackController', () => {
  let controller: FeedbackController;

  const mockFeedbackUsecase = {
    execute: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEstablishmentId: jest.fn(),
    findMine: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [{ provide: FeedbackUsecase, useValue: mockFeedbackUsecase }],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
