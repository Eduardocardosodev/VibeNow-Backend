import { Module } from '@nestjs/common';
import { EstablishmentController } from './establishment.controller';
import { EstablishmentUsecase } from './usecases/Establishment.usecase';
import { EstablishmentAccessService } from './services/establishment-access.service';
import { IRepositoryEstablishment } from './infrastructure/repository/IRepository.repository';
import { PrismaEstablishmentRepository } from './infrastructure/repository/PrismaEstablishment.repository';
import { EstablishmentOwnerGuard } from 'src/@shared/guards/establishment-owner.guard';
import { EstablishmentStaffGuard } from 'src/@shared/guards/establishment-staff.guard';

export const IREPOSITORY_ESTABLISHMENT = Symbol('IRepositoryEstablishment');

@Module({
  controllers: [EstablishmentController],
  providers: [
    PrismaEstablishmentRepository,
    EstablishmentAccessService,
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
    EstablishmentOwnerGuard,
    EstablishmentStaffGuard,
  ],
})
export class EstablishmentModule {}
