import { Module } from '@nestjs/common';
import {
  EstablishmentModule,
  IREPOSITORY_ESTABLISHMENT,
} from 'src/establishment/establishment.module';
import { IRepositoryEstablishment } from 'src/establishment/infrastructure/repository/IRepository.repository';
import { FeedbackController } from './feedback.controller';
import { FeedbackUsecase } from './usecases/Feedback.usecase';
import { IRepositoryFeedback } from './infrastructure/repository/IRepository.repository';
import { PrismaFeedbackRepository } from './infrastructure/repository/PrismaFeedback.repository';

export const IREPOSITORY_FEEDBACK = Symbol('IRepositoryFeedback');

@Module({
  imports: [EstablishmentModule],
  controllers: [FeedbackController],
  providers: [
    PrismaFeedbackRepository,
    {
      provide: IREPOSITORY_FEEDBACK,
      useExisting: PrismaFeedbackRepository,
    },
    {
      provide: FeedbackUsecase,
      useFactory: (
        repo: IRepositoryFeedback,
        establishmentRepo: IRepositoryEstablishment,
      ) => new FeedbackUsecase(repo, establishmentRepo),
      inject: [IREPOSITORY_FEEDBACK, IREPOSITORY_ESTABLISHMENT],
    },
  ],
})
export class FeedbackModule {}
