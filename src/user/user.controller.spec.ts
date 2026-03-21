import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserUsecase } from './usecases/User.usecase';

describe('UserController', () => {
  let controller: UserController;

  const mockUserUsecase = {
    execute: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserUsecase, useValue: mockUserUsecase }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
