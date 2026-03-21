import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginDto, RefreshTokenDto } from '../dto/auth.dto';
import { AuthUsecase } from '../auth.usecase';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from 'src/@shared/decorators/ispublic.decorator';

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

  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto) {
    return this.authUsecase.refresh(body.refreshToken);
  }
}
