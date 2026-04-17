import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { EstablishmentStaffGuard } from 'src/@shared/guards/establishment-staff.guard';
import { RequireEstablishmentStaff } from 'src/@shared/decorators/require-establishment-staff.decorator';
import { FeedbackInsightsQueryDto } from './dto/feedback-insights-query.dto';
import { FeedbackUsecase } from './usecases/Feedback.usecase';

/**
 * Rotas sob `/establishments/...` ligadas a feedback, sem importar FeedbackModule
 * em EstablishmentModule (evita dependência circular com FeedbackUsecase).
 */
@Controller('establishments')
export class EstablishmentFeedbackInsightsController {
  constructor(private readonly feedbackUsecase: FeedbackUsecase) {}

  /**
   * Dashboard: agregações de feedback no intervalo (heatmap, totais, pico de elogios).
   * Dono ou funcionário. Buckets em UTC.
   */
  @Get(':establishmentId/feedback-insights')
  @UseGuards(EstablishmentStaffGuard)
  @RequireEstablishmentStaff('establishmentId')
  feedbackInsights(
    @Param('establishmentId') establishmentId: string,
    @Query() query: FeedbackInsightsQueryDto,
  ) {
    return this.feedbackUsecase.getInsights(+establishmentId, query);
  }
}
