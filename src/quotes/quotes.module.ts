import { Module } from '@nestjs/common';
import {
  EstablishmentModule,
  IREPOSITORY_ESTABLISHMENT,
} from 'src/establishment/establishment.module';
import { IRepositoryEstablishment } from 'src/establishment/infrastructure/repository/IRepository.repository';
import { QuotesController } from './quotes.controller';
import { QuoteUsecase } from './usecases/Quote.usecase';
import { IRepositoryQuote } from './infrastructure/repository/IRepository.repository';
import { PrismaQuoteRepository } from './infrastructure/repository/PrismaQuote.repository';

export const IREPOSITORY_QUOTE = Symbol('IRepositoryQuote');

@Module({
  imports: [EstablishmentModule],
  controllers: [QuotesController],
  providers: [
    PrismaQuoteRepository,
    {
      provide: IREPOSITORY_QUOTE,
      useExisting: PrismaQuoteRepository,
    },
    {
      provide: QuoteUsecase,
      useFactory: (
        quoteRepo: IRepositoryQuote,
        establishmentRepo: IRepositoryEstablishment,
      ) => new QuoteUsecase(quoteRepo, establishmentRepo),
      inject: [IREPOSITORY_QUOTE, IREPOSITORY_ESTABLISHMENT],
    },
  ],
})
export class QuotesModule {}
