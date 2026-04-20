import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { LoginDto, LoginEmailDto, RefreshTokenDto } from '../dto/auth.dto';
import { AuthUsecase } from '../auth.usecase';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../../@shared/decorators/ispublic.decorator';
import { RegisterEstablishmentAndOwnerDto } from '../../../establishment/dto/register-establishment-and-owner.dto';
import { RegisterEstablishmentAndOwnerFormDto } from '../../../establishment/dto/register-establishment-and-owner-form.dto';
import { establishmentProfileMulterOptions } from '../../../establishment/config/establishment-profile-multer.config';
import { buildEstablishmentProfilePhotoPublicUrl } from '../../../establishment/config/establishment-profile-photo-url';
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authUsecase: AuthUsecase) {}

  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authUsecase.login(loginDto);
  }

  /** Portal web do estabelecimento (dono / equipe com e-mail). */
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @Post('login-email')
  loginWithEmail(@Body() dto: LoginEmailDto) {
    return this.authUsecase.loginWithEmail(dto);
  }

  /**
   * Fluxo principal (portal): dados do estabelecimento + senha; cria User dono com o mesmo e-mail/telefone do estabelecimento.
   */
  @IsPublic()
  @HttpCode(HttpStatus.CREATED)
  @Post('register-establishment-and-owner')
  registerEstablishmentAndOwner(@Body() dto: RegisterEstablishmentAndOwnerDto) {
    return this.authUsecase.registerEstablishmentAndOwner(dto);
  }

  /**
   * Igual a `register-establishment-and-owner`, com `multipart/form-data`:
   * campo `photo` (opcional) + restantes campos no form; `openingHours` como JSON string.
   */
  @IsPublic()
  @HttpCode(HttpStatus.CREATED)
  @Post('register-establishment-and-owner/upload')
  @UseInterceptors(FileInterceptor('photo', establishmentProfileMulterOptions))
  registerEstablishmentAndOwnerUpload(
    @Req() req: Request,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Body() body: RegisterEstablishmentAndOwnerFormDto,
  ) {
    const profilePhotoUrl = photo
      ? buildEstablishmentProfilePhotoPublicUrl(req, photo.filename)
      : (body.profilePhoto ?? null);
    const dto: RegisterEstablishmentAndOwnerDto = {
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
      password: body.password,
      ownerName: body.ownerName,
    };
    return this.authUsecase.registerEstablishmentAndOwner(dto);
  }

  /** Utilizador autenticado + estabelecimentos como dono / funcionário. */
  @Get('me')
  me(@Req() req: Request) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    return this.authUsecase.getMeWithAccess(userId);
  }

  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto) {
    return this.authUsecase.refresh(body.refreshToken);
  }
}
