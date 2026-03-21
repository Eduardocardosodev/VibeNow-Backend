import { SetMetadata } from '@nestjs/common';

export const ISPUBLIC_KEY = 'isPublic';
export const IsPublic = () => SetMetadata(ISPUBLIC_KEY, true);
