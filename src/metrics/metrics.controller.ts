import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { IsPublic } from 'src/@shared/decorators/ispublic.decorator';
import {
  getMetricsContentType,
  getMetricsText,
} from './prometheus.registry';

@Controller()
export class MetricsController {
  /** Liveness — não consulta banco (ideal para balanceador). */
  @Get('health')
  @IsPublic()
  health() {
    return {
      status: 'ok',
      service: 'vibenow-backend',
      timestamp: new Date().toISOString(),
    };
  }

  /** Formato Prometheus; scrape com Prometheus/Grafana ou inspeção manual. */
  @Get('metrics')
  @IsPublic()
  async metrics(@Res({ passthrough: false }) res: Response) {
    const body = await getMetricsText();
    res.setHeader('Content-Type', getMetricsContentType());
    res.send(body);
  }
}
