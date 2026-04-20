import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './@shared/Auth/auth.module';
import { EstablishmentModule } from './establishment/establishment.module';
import { FeedbackModule } from './feedback/feedback.module';
import { MenuModule } from './menu/menu.module';
import { QuotesModule } from './quotes/quotes.module';
import { EventsScheduleModule } from './events-schedule/events-schedule.module';
import { OrdersModule } from './orders/orders.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    UserModule,
    AuthModule,
    EstablishmentModule,
    FeedbackModule,
    MenuModule,
    QuotesModule,
    EventsScheduleModule,
    OrdersModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
