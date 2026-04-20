import { Controller, Get, Param, Query } from '@nestjs/common';
import { ScorePeriodsQueryDto } from './dto/score-periods-query.dto';
import { EstablishmentOperatingSessionService } from './services/establishment-operating-session.service';

/**
 * Histórico de médias por período operacional (noites/turnos já fechados).
 * Qualquer utilizador autenticado (qualquer role) pode ler; não exige ser dono/funcionário deste estabelecimento.
 */
@Controller('establishments')
export class EstablishmentScorePeriodsController {
  constructor(
    private readonly operatingSessions: EstablishmentOperatingSessionService,
  ) {}

  /**
   * Lista períodos encerrados + resumo da sessão corrente (se existir).
   * Requer `Authorization: Bearer` (guard global); não restringe a dono/funcionário do `:establishmentId`.
   */
  @Get(':establishmentId/score-periods')
  scorePeriods(
    @Param('establishmentId') establishmentId: string,
    @Query() query: ScorePeriodsQueryDto,
  ) {
    return this.operatingSessions.listScorePeriodsForPanel(
      +establishmentId,
      query,
    );
  }
}
