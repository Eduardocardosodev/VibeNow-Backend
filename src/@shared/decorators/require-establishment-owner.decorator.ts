import { SetMetadata } from '@nestjs/common';

/** Nome do parâmetro de rota com o id do estabelecimento (ex.: `establishmentId`). */
export const ESTABLISHMENT_OWNER_PARAM_KEY = 'establishmentOwnerParam';

export const RequireEstablishmentOwner = (paramName = 'establishmentId') =>
  SetMetadata(ESTABLISHMENT_OWNER_PARAM_KEY, paramName);
