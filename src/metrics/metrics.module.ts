import { Global, Module, OnModuleInit } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsController } from './metrics.controller';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { startDefaultNodeMetrics } from './prometheus.registry';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
})
export class MetricsModule implements OnModuleInit {
  onModuleInit(): void {
    startDefaultNodeMetrics();
  }
}
