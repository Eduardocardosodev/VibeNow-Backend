import { Module } from '@nestjs/common';
import {
  EstablishmentModule,
  IREPOSITORY_ESTABLISHMENT,
} from 'src/establishment/establishment.module';
import { IRepositoryEstablishment } from 'src/establishment/infrastructure/repository/IRepository.repository';
import { MenuController } from './menu.controller';
import { MenuUsecase } from './usecases/Menu.usecase';
import { IRepositoryMenu } from './infrastructure/repository/IRepository.repository';
import { PrismaMenuRepository } from './infrastructure/repository/PrismaMenu.repository';

export const IREPOSITORY_MENU = Symbol('IRepositoryMenu');

@Module({
  imports: [EstablishmentModule],
  controllers: [MenuController],
  providers: [
    PrismaMenuRepository,
    {
      provide: IREPOSITORY_MENU,
      useExisting: PrismaMenuRepository,
    },
    {
      provide: MenuUsecase,
      useFactory: (
        menuRepo: IRepositoryMenu,
        establishmentRepo: IRepositoryEstablishment,
      ) => new MenuUsecase(menuRepo, establishmentRepo),
      inject: [IREPOSITORY_MENU, IREPOSITORY_ESTABLISHMENT],
    },
  ],
  exports: [IREPOSITORY_MENU],
})
export class MenuModule {}
