import { Module } from '@nestjs/common';
import { EstablishmentController } from './establishment.controller';
import { EstablishmentScorePeriodsController } from './establishment-score-periods.controller';
import { EstablishmentUsecase } from './usecases/Establishment.usecase';
import { EstablishmentAccessService } from './services/establishment-access.service';
import { EstablishmentOperatingSessionService } from './services/establishment-operating-session.service';
import { EstablishmentOperatingSessionCron } from './services/establishment-operating-session.cron';
import { IRepositoryEstablishment } from './infrastructure/repository/IRepository.repository';
import { PrismaEstablishmentRepository } from './infrastructure/repository/PrismaEstablishment.repository';
import { EstablishmentOwnerGuard } from 'src/@shared/guards/establishment-owner.guard';
import { EstablishmentStaffGuard } from 'src/@shared/guards/establishment-staff.guard';

export const IREPOSITORY_ESTABLISHMENT = Symbol('IRepositoryEstablishment');

@Module({
  controllers: [EstablishmentController, EstablishmentScorePeriodsController],
  providers: [
    PrismaEstablishmentRepository,
    EstablishmentAccessService,
    EstablishmentOperatingSessionService,
    EstablishmentOperatingSessionCron,
    EstablishmentOwnerGuard,
    EstablishmentStaffGuard,
    {
      provide: IREPOSITORY_ESTABLISHMENT,
      useExisting: PrismaEstablishmentRepository,
    },
    {
      provide: EstablishmentUsecase,
      useFactory: (repo: IRepositoryEstablishment) =>
        new EstablishmentUsecase(repo),
      inject: [IREPOSITORY_ESTABLISHMENT],
    },
  ],
  exports: [
    IREPOSITORY_ESTABLISHMENT,
    EstablishmentAccessService,
    EstablishmentOperatingSessionService,
    EstablishmentOwnerGuard,
    EstablishmentStaffGuard,
  ],
})
export class EstablishmentModule {}
