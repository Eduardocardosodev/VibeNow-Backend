import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { LoginDto, LoginEmailDto, RefreshTokenDto } from '../dto/auth.dto';
import { AuthUsecase } from '../auth.usecase';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../../@shared/decorators/ispublic.decorator';
import { RegisterEstablishmentAndOwnerDto } from '../../../establishment/dto/register-establishment-and-owner.dto';
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
