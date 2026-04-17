import { Module } from '@nestjs/common';
import { EstablishmentModule } from 'src/establishment/establishment.module';
import { MenuModule, IREPOSITORY_MENU } from 'src/menu/menu.module';
import { IRepositoryMenu } from 'src/menu/infrastructure/repository/IRepository.repository';
import { EstablishmentAccessService } from 'src/establishment/services/establishment-access.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdersController } from './controllers/orders.controller';
import { EstablishmentOrdersPanelController } from './controllers/establishment-orders-panel.controller';
import { OrdersUsecase } from './usecases/orders.usecase';

@Module({
  imports: [EstablishmentModule, MenuModule],
  controllers: [OrdersController, EstablishmentOrdersPanelController],
  providers: [
    {
      provide: OrdersUsecase,
      useFactory: (
        prisma: PrismaService,
        menuRepo: IRepositoryMenu,
        access: EstablishmentAccessService,
      ) => new OrdersUsecase(prisma, menuRepo, access),
      inject: [PrismaService, IREPOSITORY_MENU, EstablishmentAccessService],
    },
  ],
})
export class OrdersModule {}
