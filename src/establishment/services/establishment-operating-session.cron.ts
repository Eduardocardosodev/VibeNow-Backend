import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EstablishmentOperatingSessionService } from './establishment-operating-session.service';

const BATCH = 200;

@Injectable()
export class EstablishmentOperatingSessionCron {
  private readonly logger = new Logger(
    EstablishmentOperatingSessionCron.name,
  );

  constructor(
    private readonly operatingSessions: EstablishmentOperatingSessionService,
  ) {}

  /**
   * A cada 5 minutos:
   * 1. Abre sessões para períodos que começam nos próximos ~6 min (proactivo).
   * 2. Fecha sessões cujo `periodEndUtc` já passou (materializa em `score_periods`).
   *
   * Ordem: abre primeiro → fecha depois (evita janela sem sessão se abrir e fechar no mesmo tick).
   */
  @Cron('0 */5 * * * *')
  async tick(): Promise<void> {
    const opened = await this.operatingSessions.openDueSessions(BATCH);
    if (opened > 0) {
      this.logger.log(`Sessões abertas proactivamente: ${opened}`);
    }

    const closed = await this.operatingSessions.finalizeDueSessions(BATCH);
    if (closed > 0) {
      this.logger.log(`Sessões finalizadas: ${closed}`);
    }
  }
}
