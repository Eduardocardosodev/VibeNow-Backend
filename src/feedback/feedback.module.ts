import { Module } from '@nestjs/common';
import {
  EstablishmentModule,
  IREPOSITORY_ESTABLISHMENT,
} from 'src/establishment/establishment.module';
import { IRepositoryEstablishment } from 'src/establishment/infrastructure/repository/IRepository.repository';
import { FeedbackController } from './feedback.controller';
import { EstablishmentFeedbackInsightsController } from './establishment-feedback-insights.controller';
import { FeedbackUsecase } from './usecases/Feedback.usecase';
import { IRepositoryFeedback } from './infrastructure/repository/IRepository.repository';
import { PrismaFeedbackRepository } from './infrastructure/repository/PrismaFeedback.repository';
import { EstablishmentOperatingSessionService } from 'src/establishment/services/establishment-operating-session.service';

export const IREPOSITORY_FEEDBACK = Symbol('IRepositoryFeedback');

@Module({
  imports: [EstablishmentModule],
  controllers: [FeedbackController, EstablishmentFeedbackInsightsController],
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
        operatingSessions: EstablishmentOperatingSessionService,
      ) => new FeedbackUsecase(repo, establishmentRepo, operatingSessions),
      inject: [
        IREPOSITORY_FEEDBACK,
        IREPOSITORY_ESTABLISHMENT,
        EstablishmentOperatingSessionService,
      ],
    },
  ],
})
export class FeedbackModule {}
