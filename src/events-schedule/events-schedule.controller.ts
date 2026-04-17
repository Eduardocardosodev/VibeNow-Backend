import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { Request } from 'express';
import { buildUploadsPublicFileUrl } from '../@shared/upload/build-uploads-public-url';
import { getDiskImageMulterOptions } from '../@shared/upload/disk-image-multer.config';
import { CreateScheduledEventDto } from './dto/create-scheduled-event.dto';
import { CreateScheduledEventFormDto } from './dto/create-scheduled-event-form.dto';
import { UpdateScheduledEventDto } from './dto/update-scheduled-event.dto';
import { UpdateScheduledEventFormDto } from './dto/update-scheduled-event-form.dto';
import { EventRegistrationUsecase } from './usecases/EventRegistration.usecase';
import { EventsScheduleUsecase } from './usecases/EventsSchedule.usecase';

@Controller('events-schedule')
export class EventsScheduleController {
  constructor(
    private readonly eventsScheduleUsecase: EventsScheduleUsecase,
    private readonly eventRegistrationUsecase: EventRegistrationUsecase,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('photo', getDiskImageMulterOptions('event-posters')),
  )
  createUpload(
    @Req() req: Request,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Body() body: CreateScheduledEventFormDto,
  ) {
    const posterImageUrl = photo
      ? buildUploadsPublicFileUrl(req, 'event-posters', photo.filename)
      : (body.posterImageUrl ?? null);
    const dto: CreateScheduledEventDto = {
      establishmentId: body.establishmentId,
      name: body.name,
      description: body.description ?? null,
      attractions: body.attractions ?? null,
      dj: body.dj ?? null,
      priceInfo: body.priceInfo ?? null,
      eventStartsAt: body.eventStartsAt,
      eventEndsAt: body.eventEndsAt,
      listType: body.listType ?? 'GENERAL',
      posterImageUrl,
      offersTableReservation: body.offersTableReservation,
      offersBoothReservation: body.offersBoothReservation,
      tablePeopleCapacity: body.offersTableReservation
        ? body.tablePeopleCapacity
        : undefined,
      tablesAvailable: body.offersTableReservation
        ? body.tablesAvailable
        : undefined,
      tablePrice: body.offersTableReservation ? body.tablePrice : undefined,
      boothPeopleCapacity: body.offersBoothReservation
        ? body.boothPeopleCapacity
        : undefined,
      boothsAvailable: body.offersBoothReservation
        ? body.boothsAvailable
        : undefined,
      boothPrice: body.offersBoothReservation ? body.boothPrice : undefined,
    };
    return this.eventsScheduleUsecase.create(dto);
  }

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
      throw new UnauthorizedException('Usuário não autenticado.');
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
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    return this.eventRegistrationUsecase.getMyStatus(userId, +id);
  }

  @Post(':id/register')
  register(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    return this.eventRegistrationUsecase.register(userId, +id);
  }

  @Delete(':id/register')
  unregister(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    return this.eventRegistrationUsecase.unregister(userId, +id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsScheduleUsecase.findById(+id);
  }

  @Patch(':id/upload')
  @UseInterceptors(
    FileInterceptor('photo', getDiskImageMulterOptions('event-posters')),
  )
  updateUpload(
    @Req() req: Request,
    @Param('id') id: string,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Body() body: UpdateScheduledEventFormDto,
  ) {
    const dto: UpdateScheduledEventDto = {};
    if (body.establishmentId !== undefined)
      dto.establishmentId = body.establishmentId;
    if (body.name !== undefined) dto.name = body.name;
    if (body.description !== undefined)
      dto.description = body.description ?? null;
    if (body.attractions !== undefined)
      dto.attractions = body.attractions ?? null;
    if (body.dj !== undefined) dto.dj = body.dj ?? null;
    if (body.priceInfo !== undefined) dto.priceInfo = body.priceInfo ?? null;
    if (body.eventStartsAt !== undefined)
      dto.eventStartsAt = body.eventStartsAt;
    if (body.eventEndsAt !== undefined)
      dto.eventEndsAt = body.eventEndsAt ?? null;
    if (body.listType !== undefined) dto.listType = body.listType;
    if (photo) {
      dto.posterImageUrl = buildUploadsPublicFileUrl(
        req,
        'event-posters',
        photo.filename,
      );
    } else if (body.posterImageUrl !== undefined) {
      dto.posterImageUrl = body.posterImageUrl;
    }
    if (body.offersTableReservation !== undefined)
      dto.offersTableReservation = body.offersTableReservation;
    if (body.tablePeopleCapacity !== undefined)
      dto.tablePeopleCapacity = body.tablePeopleCapacity;
    if (body.tablesAvailable !== undefined)
      dto.tablesAvailable = body.tablesAvailable;
    if (body.tablePrice !== undefined) dto.tablePrice = body.tablePrice;
    if (body.offersBoothReservation !== undefined)
      dto.offersBoothReservation = body.offersBoothReservation;
    if (body.boothPeopleCapacity !== undefined)
      dto.boothPeopleCapacity = body.boothPeopleCapacity;
    if (body.boothsAvailable !== undefined)
      dto.boothsAvailable = body.boothsAvailable;
    if (body.boothPrice !== undefined) dto.boothPrice = body.boothPrice;
    return this.eventsScheduleUsecase.update(+id, dto);
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
