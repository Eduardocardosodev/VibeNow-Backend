import { Test, TestingModule } from '@nestjs/testing';
import { EstablishmentController } from './establishment.controller';
import { EstablishmentUsecase } from './usecases/Establishment.usecase';
import { EstablishmentAccessService } from './services/establishment-access.service';

describe('EstablishmentController', () => {
  let controller: EstablishmentController;

  const mockEstablishmentUsecase = {
    execute: jest.fn(),
    findAll: jest.fn(),
    findNear: jest.fn(),
    findInMapBounds: jest.fn(),
    getFeedbackRewardSettings: jest.fn(),
    updateFeedbackReward: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockEstablishmentAccess = {
    createEmployee: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstablishmentController],
      providers: [
        { provide: EstablishmentUsecase, useValue: mockEstablishmentUsecase },
        {
          provide: EstablishmentAccessService,
          useValue: mockEstablishmentAccess,
        },
      ],
    }).compile();

    controller = module.get<EstablishmentController>(EstablishmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
