import type { Request } from 'express';
import { buildUploadsPublicFileUrl } from 'src/@shared/upload/build-uploads-public-url';

export function buildMenuItemPhotoPublicUrl(
  req: Request,
  filename: string,
): string {
  return buildUploadsPublicFileUrl(req, 'menu-items', filename);
}
