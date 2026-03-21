import { Test, TestingModule } from '@nestjs/testing';
import { EstablishmentController } from './establishment.controller';
import { EstablishmentUsecase } from './usecases/Establishment.usecase';

describe('EstablishmentController', () => {
  let controller: EstablishmentController;

  const mockEstablishmentUsecase = {
    execute: jest.fn(),
    findAll: jest.fn(),
    findNear: jest.fn(),
    findInMapBounds: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstablishmentController],
      providers: [
        { provide: EstablishmentUsecase, useValue: mockEstablishmentUsecase },
      ],
    }).compile();

    controller = module.get<EstablishmentController>(EstablishmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
