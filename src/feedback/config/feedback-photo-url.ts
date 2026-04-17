import type { Request } from 'express';
import { buildUploadsPublicFileUrl } from 'src/@shared/upload/build-uploads-public-url';

export function buildFeedbackPhotoPublicUrl(
  req: Request,
  filename: string,
): string {
  return buildUploadsPublicFileUrl(req, 'feedback-photos', filename);
}
