import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  Res,
  Headers,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { FeedbackUsecase } from './usecases/Feedback.usecase';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreateFeedbackFormDto } from './dto/create-feedback-form.dto';
import { FeedbackMineQueryDto } from './dto/feedback-mine-query.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackEstablishmentPanelQueryDto } from './dto/feedback-establishment-panel-query.dto';
import { parseIdempotencyKey } from './utils/parse-idempotency-key';
import { Feedback } from './domain/entities/feedback.entity';
import { feedbackPhotoMulterOptions } from './config/feedback-photo-multer.config';
import { buildFeedbackPhotoPublicUrl } from './config/feedback-photo-url';
import { EstablishmentStaffGuard } from '../@shared/guards/establishment-staff.guard';
import { RequireEstablishmentStaff } from '../@shared/decorators/require-establishment-staff.decorator';

function feedbackToJson(f: Feedback) {
  return {
    id: f.id,
    userId: f.userId,
    establishmentId: f.establishmentId,
    rating: f.rating,
    ratingCrowding: f.ratingCrowding,
    ratingAnimation: f.ratingAnimation,
    ratingOrganization: f.ratingOrganization,
    ratingHygiene: f.ratingHygiene,
    ratingAmbience: f.ratingAmbience,
    comment: f.comment,
    photoUrl: f.photoUrl,
    idempotencyKey: f.idempotencyKey,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}

function sentimentOf(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 3.5) return 'positive';
  if (rating >= 2.5) return 'neutral';
  return 'negative';
}

/** Painel: inclui `sentiment` para UI (humor). */
function feedbackToPanelJson(f: Feedback) {
  return {
    ...feedbackToJson(f),
    sentiment: sentimentOf(f.rating),
  };
}

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackUsecase: FeedbackUsecase) {}

  /**
   * Obrigatório: header `Idempotency-Key` (ex.: UUID v4), reutilizado em retries.
   * 201 = criado; 200 = mesmo envio (replay seguro).
   */
  @Post()
  async create(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('idempotency-key') idempotencyKeyHeader?: string | string[],
  ) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    const idempotencyKey = parseIdempotencyKey(idempotencyKeyHeader);
    const result = await this.feedbackUsecase.execute(
      userId,
      createFeedbackDto,
      idempotencyKey,
    );
    res.status(result.replay ? 200 : 201);
    return {
      ...feedbackToJson(result.feedback),
      reward: result.reward,
    };
  }

  /**
   * Multipart: campo `photo` (imagem) + campos do form (establishmentId, rating, comment).
   * Header `Idempotency-Key` obrigatório.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('photo', feedbackPhotoMulterOptions))
  async createWithPhoto(
    @Body() dto: CreateFeedbackFormDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('idempotency-key') idempotencyKeyHeader?: string | string[],
  ) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    const idempotencyKey = parseIdempotencyKey(idempotencyKeyHeader);
    const photoUrl = file
      ? buildFeedbackPhotoPublicUrl(req, file.filename)
      : null;
    const createDto: CreateFeedbackDto = {
      establishmentId: dto.establishmentId,
      ratingCrowding: dto.ratingCrowding,
      ratingAnimation: dto.ratingAnimation,
      ratingOrganization: dto.ratingOrganization,
      ratingHygiene: dto.ratingHygiene,
      ratingAmbience: dto.ratingAmbience,
      comment: dto.comment,
      photoUrl,
    };
    const result = await this.feedbackUsecase.execute(
      userId,
      createDto,
      idempotencyKey,
    );
    res.status(result.replay ? 200 : 201);
    return {
      ...feedbackToJson(result.feedback),
      reward: result.reward,
    };
  }

  @Get()
  findAll() {
    return this.feedbackUsecase.findAll();
  }

  /**
   * Lista paginada de feedbacks de um estabelecimento com filtros opcionais.
   * Acessível por qualquer usuário autenticado (app e portal).
   */
  @Get('establishment/:establishmentId')
  async findByEstablishmentForPanel(
    @Param('establishmentId') establishmentId: string,
    @Query() query: FeedbackEstablishmentPanelQueryDto,
  ) {
    const result = await this.feedbackUsecase.findByEstablishmentForPanel(
      +establishmentId,
      query,
    );
    return {
      ...result,
      items: result.items.map((f) => feedbackToPanelJson(f)),
    };
  }

  /**
   * Feedbacks do usuário autenticado + establishment { id, name }.
   * Paginação: ?page=1&pageSize=20 (pageSize máx. 100).
   */
  @Get('me')
  findMine(@Req() req: Request, @Query() query: FeedbackMineQueryDto) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    return this.feedbackUsecase.findMine(userId, query.page, query.pageSize);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feedbackUsecase.findById(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
  ) {
    return this.feedbackUsecase.update(+id, updateFeedbackDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feedbackUsecase.delete(+id);
  }
}
