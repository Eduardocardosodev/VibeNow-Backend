import { Module } from '@nestjs/common';
import { EstablishmentController } from './establishment.controller';
import { EstablishmentUsecase } from './usecases/Establishment.usecase';
import { IRepositoryEstablishment } from './infrastructure/repository/IRepository.repository';
import { PrismaEstablishmentRepository } from './infrastructure/repository/PrismaEstablishment.repository';

export const IREPOSITORY_ESTABLISHMENT = Symbol('IRepositoryEstablishment');

@Module({
  controllers: [EstablishmentController],
  providers: [
    PrismaEstablishmentRepository,
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
  exports: [IREPOSITORY_ESTABLISHMENT],
})
export class EstablishmentModule {}
