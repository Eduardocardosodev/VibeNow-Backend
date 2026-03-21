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
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FeedbackUsecase } from './usecases/Feedback.usecase';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackMineQueryDto } from './dto/feedback-mine-query.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackUsecase: FeedbackUsecase) {}

  @Post()
  async create(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @Req() req: Request,
  ) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.feedbackUsecase.execute(userId, createFeedbackDto);
  }

  @Get()
  findAll() {
    return this.feedbackUsecase.findAll();
  }

  @Get('establishment/:establishmentId')
  findByEstablishment(@Param('establishmentId') establishmentId: string) {
    return this.feedbackUsecase.findByEstablishmentId(+establishmentId);
  }

  /**
   * Feedbacks do usuário autenticado + establishment { id, name }.
   * Paginação: ?page=1&pageSize=20 (pageSize máx. 100).
   */
  @Get('me')
  findMine(@Req() req: Request, @Query() query: FeedbackMineQueryDto) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('User not authenticated');
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
