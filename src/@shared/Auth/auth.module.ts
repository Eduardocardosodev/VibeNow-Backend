import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { EstablishmentModule } from 'src/establishment/establishment.module';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './controller/auth.controller';
import { AuthUsecase } from './auth.usecase';
import { AuthGuard } from './guards/auth.guards';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  imports: [
    UserModule,
    EstablishmentModule,
    JwtModule.register({
      global: true,
      secret: process.env.SECRET_KEY,
      signOptions: { expiresIn: parseInt(process.env.EXPIRES_IN ?? '3600') },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthUsecase,
    AuthGuard,
    RolesGuard,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [RolesGuard],
})
export class AuthModule {}
