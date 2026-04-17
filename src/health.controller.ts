import { Controller, Get } from '@nestjs/common';
import { IsPublic } from './@shared/decorators/ispublic.decorator';

@Controller()
export class HealthController {
  @Get('health')
  @IsPublic()
  health() {
    return {
      status: 'ok',
      service: 'vibenow-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
