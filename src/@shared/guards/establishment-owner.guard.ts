import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserResponse } from 'src/user/dto/user-response.dto';
import { EstablishmentAccessService } from 'src/establishment/services/establishment-access.service';
import { ESTABLISHMENT_OWNER_PARAM_KEY } from '../decorators/require-establishment-owner.decorator';

@Injectable()
export class EstablishmentOwnerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: EstablishmentAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const paramName =
      this.reflector.getAllAndOverride<string>(ESTABLISHMENT_OWNER_PARAM_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'establishmentId';

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as UserResponse | undefined;
    if (user == null) {
      throw new ForbiddenException('Usuário não autenticado.');
    }

    const raw = request.params[paramName];
    const idStr = Array.isArray(raw) ? raw[0] : raw;
    const establishmentId = parseInt(idStr, 10);
    if (!Number.isFinite(establishmentId)) {
      throw new ForbiddenException('ID do estabelecimento inválido.');
    }

    const ok = await this.access.isOwner(user.id, establishmentId);
    if (!ok) {
      throw new ForbiddenException(
        'Apenas o dono do estabelecimento pode acessar este recurso.',
      );
    }
    return true;
  }
}
