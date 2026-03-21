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
import { EventsScheduleUsecase } from './usecases/EventsSchedule.usecase';
import { EventRegistrationUsecase } from './usecases/EventRegistration.usecase';
import { CreateScheduledEventDto } from './dto/create-scheduled-event.dto';
import { UpdateScheduledEventDto } from './dto/update-scheduled-event.dto';

@Controller('events-schedule')
export class EventsScheduleController {
  constructor(
    private readonly eventsScheduleUsecase: EventsScheduleUsecase,
    private readonly eventRegistrationUsecase: EventRegistrationUsecase,
  ) {}

  @Post()
  create(@Body() createDto: CreateScheduledEventDto) {
    return this.eventsScheduleUsecase.create(createDto);
  }

  /** Próximos eventos (todos os estabelecimentos), ordenados por data. ?limit=50 */
  @Get('upcoming')
  findAllUpcoming(@Query('limit') limit?: string) {
    const n = limit != null ? parseInt(limit, 10) : undefined;
    return this.eventsScheduleUsecase.findAllUpcoming(
      Number.isFinite(n) ? n : undefined,
    );
  }

  /** Minhas inscrições em eventos (usuário logado). */
  @Get('registrations/me')
  listMyRegistrations(@Req() req: Request) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.eventRegistrationUsecase.listMyRegistrations(userId);
  }

  @Get('establishment/:establishmentId/upcoming')
  findUpcomingByEstablishment(
    @Param('establishmentId') establishmentId: string,
  ) {
    return this.eventsScheduleUsecase.findUpcomingByEstablishmentId(
      +establishmentId,
    );
  }

  @Get('establishment/:establishmentId')
  findByEstablishment(@Param('establishmentId') establishmentId: string) {
    return this.eventsScheduleUsecase.findByEstablishmentId(+establishmentId);
  }

  @Get(':id/registrations/count')
  countRegistrations(@Param('id') id: string) {
    return this.eventRegistrationUsecase.countRegistrations(+id);
  }

  @Get(':id/registrations/me')
  myRegistrationStatus(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.eventRegistrationUsecase.getMyStatus(userId, +id);
  }

  @Post(':id/register')
  register(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.eventRegistrationUsecase.register(userId, +id);
  }

  @Delete(':id/register')
  unregister(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.eventRegistrationUsecase.unregister(userId, +id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsScheduleUsecase.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateScheduledEventDto) {
    return this.eventsScheduleUsecase.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsScheduleUsecase.delete(+id);
  }
}
