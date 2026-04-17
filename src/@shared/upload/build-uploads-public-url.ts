import { InternalServerErrorException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * URL absoluta de um ficheiro servido em `/uploads/{subdirectory}/{filename}`,
 * alinhado com `useStaticAssets(..., { prefix: '/uploads/' })`.
 */
export function buildUploadsPublicFileUrl(
  req: Request,
  subdirectory: string,
  filename: string,
): string {
  const host = req.get('host');
  if (!host) {
    throw new InternalServerErrorException(
      'Não foi possível determinar o host do pedido para montar a URL do ficheiro.',
    );
  }
  const forwarded = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = (forwarded || req.protocol || 'http').replace(/:+$/, '');
  const segment = subdirectory.replace(/^\/+|\/+$/g, '');
  return `${protocol}://${host}/uploads/${segment}/${filename}`;
}
