import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MetricsModule } from './metrics/metrics.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './@shared/Auth/auth.module';
import { EstablishmentModule } from './establishment/establishment.module';
import { FeedbackModule } from './feedback/feedback.module';
import { MenuModule } from './menu/menu.module';
import { QuotesModule } from './quotes/quotes.module';
import { EventsScheduleModule } from './events-schedule/events-schedule.module';

@Module({
  imports: [
    PrismaModule,
    MetricsModule,
    UserModule,
    AuthModule,
    EstablishmentModule,
    FeedbackModule,
    MenuModule,
    QuotesModule,
    EventsScheduleModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
