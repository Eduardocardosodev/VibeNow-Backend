import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { EstablishmentUsecase } from './usecases/Establishment.usecase';
import { EstablishmentAccessService } from './services/establishment-access.service';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { CreateEstablishmentFormDto } from './dto/create-establishment-form.dto';
import { CreateEstablishmentEmployeeDto } from './dto/create-establishment-employee.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';
import { UpdateFeedbackRewardDto } from './dto/update-feedback-reward.dto';
import { UpdateEmployeeActiveDto } from './dto/update-employee-active.dto';
import { NearQueryDto } from './dto/near-query.dto';
import { MapBoundsQueryDto } from './dto/map-bounds-query.dto';
import { EstablishmentOwnerGuard } from '../@shared/guards/establishment-owner.guard';
import { RequireEstablishmentOwner } from '../@shared/decorators/require-establishment-owner.decorator';
import { establishmentProfileMulterOptions } from './config/establishment-profile-multer.config';
import { buildEstablishmentProfilePhotoPublicUrl } from './config/establishment-profile-photo-url';

@Controller('establishments')
export class EstablishmentController {
  constructor(
    private readonly establishmentUsecase: EstablishmentUsecase,
    private readonly establishmentAccess: EstablishmentAccessService,
  ) {}

  @Post()
  create(@Body() createEstablishmentDto: CreateEstablishmentDto) {
    return this.establishmentUsecase.execute(createEstablishmentDto);
  }

  /**
   * Multipart: campo `photo` (imagem de perfil) + restantes campos no form.
   * `openingHours` pode ser JSON string (ex.: {"friday":{"open":"18:00","close":"02:00"}}).
   * Sem ficheiro: opcional `profilePhoto` como URL (igual ao POST JSON).
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('photo', establishmentProfileMulterOptions))
  createUpload(
    @Req() req: Request,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Body() body: CreateEstablishmentFormDto,
  ) {
    const profilePhotoUrl = photo
      ? buildEstablishmentProfilePhotoPublicUrl(req, photo.filename)
      : (body.profilePhoto ?? null);
    const dto: CreateEstablishmentDto = {
      name: body.name,
      cnpj: body.cnpj,
      address: body.address,
      addressNumber: body.addressNumber,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      phone: body.phone,
      email: body.email,
      instagram: body.instagram,
      establishmentType: body.establishmentType,
      profilePhoto: profilePhotoUrl,
      latitude: body.latitude,
      longitude: body.longitude,
      openingHours: body.openingHours,
      operatingTimeZone: body.operatingTimeZone,
    };
    return this.establishmentUsecase.execute(dto);
  }

  @Get()
  findAll() {
    return this.establishmentUsecase.findAll();
  }

  @Get('near')
  findNear(@Query() query: NearQueryDto) {
    const radiusKm = query.radiusKm ?? 10;
    return this.establishmentUsecase.findNear(query.lat, query.lng, radiusKm);
  }

  /**
   * Mapa: só estabelecimentos dentro da área visível (bounding box).
   * Use `centerLat`/`centerLng` (ex.: GPS) para ordenar por distância e receber `distanceKm`.
   */
  @Get('map-bounds')
  findInMapBounds(@Query() query: MapBoundsQueryDto) {
    return this.establishmentUsecase.findInMapBounds(query);
  }

  /**
   * Dono cria utilizador funcionário (login no app com role EMPLOYEE_ESTABLISHMENT).
   */
  @Post(':establishmentId/employees')
  @UseGuards(EstablishmentOwnerGuard)
  @RequireEstablishmentOwner('establishmentId')
  async createEmployee(
    @Param('establishmentId') establishmentId: string,
    @Body() dto: CreateEstablishmentEmployeeDto,
    @Req() req: Request,
  ) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    const created = await this.establishmentAccess.createEmployee(
      userId,
      +establishmentId,
      dto,
    );
    return {
      id: created.id,
      name: created.name,
      phone: created.phone,
      email: created.email,
      role: created.role,
      createdAt: created.createdAt,
    };
  }

  @Get(':establishmentId/employees')
  @UseGuards(EstablishmentOwnerGuard)
  @RequireEstablishmentOwner('establishmentId')
  async listEmployees(
    @Param('establishmentId') establishmentId: string,
    @Req() req: Request,
  ) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    return this.establishmentAccess.listEmployees(userId, +establishmentId);
  }

  @Get(':establishmentId/employees/:userId')
  @UseGuards(EstablishmentOwnerGuard)
  @RequireEstablishmentOwner('establishmentId')
  async getEmployee(
    @Param('establishmentId') establishmentId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const ownerId = (req as Request & { user?: { id: number } }).user?.id;
    if (ownerId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    return this.establishmentAccess.getEmployee(
      ownerId,
      +establishmentId,
      +userId,
    );
  }

  @Patch(':establishmentId/employees/:userId/active')
  @UseGuards(EstablishmentOwnerGuard)
  @RequireEstablishmentOwner('establishmentId')
  async setEmployeeActive(
    @Param('establishmentId') establishmentId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateEmployeeActiveDto,
    @Req() req: Request,
  ) {
    const ownerId = (req as Request & { user?: { id: number } }).user?.id;
    if (ownerId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    return this.establishmentAccess.setEmployeeActive(
      ownerId,
      +establishmentId,
      +userId,
      dto.active,
    );
  }

  @Delete(':establishmentId/employees/:userId')
  @UseGuards(EstablishmentOwnerGuard)
  @RequireEstablishmentOwner('establishmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeEmployee(
    @Param('establishmentId') establishmentId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const ownerId = (req as Request & { user?: { id: number } }).user?.id;
    if (ownerId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    await this.establishmentAccess.removeEmployee(
      ownerId,
      +establishmentId,
      +userId,
    );
  }

  /**
   * Portal do dono: ler se a recompensa pós-feedback está ativa e o texto configurado.
   */
  @Get(':establishmentId/feedback-reward')
  @UseGuards(EstablishmentOwnerGuard)
  @RequireEstablishmentOwner('establishmentId')
  getFeedbackReward(@Param('establishmentId') establishmentId: string) {
    return this.establishmentUsecase.getFeedbackRewardSettings(
      +establishmentId,
    );
  }

  /**
   * Portal do dono: ligar/desligar recompensa e mensagem (desconto, bebida, etc.).
   */
  @Patch(':establishmentId/feedback-reward')
  @UseGuards(EstablishmentOwnerGuard)
  @RequireEstablishmentOwner('establishmentId')
  patchFeedbackReward(
    @Param('establishmentId') establishmentId: string,
    @Body() dto: UpdateFeedbackRewardDto,
  ) {
    return this.establishmentUsecase.updateFeedbackReward(
      +establishmentId,
      dto,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.establishmentUsecase.findById(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEstablishmentDto: UpdateEstablishmentDto,
  ) {
    return this.establishmentUsecase.update(+id, updateEstablishmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.establishmentUsecase.delete(+id);
  }
}
