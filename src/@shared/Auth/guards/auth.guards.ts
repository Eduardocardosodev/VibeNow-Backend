import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ISPUBLIC_KEY } from 'src/@shared/decorators/ispublic.decorator';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { UserUsecase } from 'src/user/usecases/User.usecase';
import { toUserResponse } from 'src/user/dto/user-response.dto';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly userUsecase: UserUsecase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(ISPUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFormHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.SECRET_KEY,
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.userUsecase.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request['user'] = toUserResponse(user);
    request['isBackoffice'] = payload.isBackoffice ?? false;
    return true;
  }

  private extractTokenFormHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
