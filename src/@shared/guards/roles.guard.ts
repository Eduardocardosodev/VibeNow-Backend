import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/userrole.enum';
import { ALLOWEDROLES_KEY } from '../decorators/allowedRoles.decoratos';
import { Request } from 'express';
import { UserResponse } from 'src/user/dto/user-response.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<UserRole[]>(
      ALLOWEDROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowed == null || allowed.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as UserResponse | undefined;
    if (user == null) {
      throw new ForbiddenException('Usuário não autenticado.');
    }

    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Permissão insuficiente.');
    }
    return true;
  }
}
