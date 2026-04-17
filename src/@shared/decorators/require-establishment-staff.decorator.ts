import { SetMetadata } from '@nestjs/common';

/** Dono OU funcionário do estabelecimento (param = id na rota). */
export const ESTABLISHMENT_STAFF_PARAM_KEY = 'establishmentStaffParam';

export const RequireEstablishmentStaff = (paramName = 'establishmentId') =>
  SetMetadata(ESTABLISHMENT_STAFF_PARAM_KEY, paramName);
