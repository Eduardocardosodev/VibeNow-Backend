import { Test, TestingModule } from '@nestjs/testing';
import { QuotesController } from './quotes.controller';
import { QuoteUsecase } from './usecases/Quote.usecase';

describe('QuotesController', () => {
  let controller: QuotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuotesController],
      providers: [
        {
          provide: QuoteUsecase,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<QuotesController>(QuotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
