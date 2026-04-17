import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/userrole.enum';

export const ALLOWEDROLES_KEY = 'allowedRoles';
export const AllowedRoles = (...userRoles: UserRole[]) =>
  SetMetadata(ALLOWEDROLES_KEY, userRoles);
