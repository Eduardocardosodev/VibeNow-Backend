import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** Subpasta dentro de `uploads/` (ex.: `menu-items`, `event-posters`). */
export function getDiskImageMulterOptions(subdirectory: string): MulterOptions {
  const dest = join(process.cwd(), 'uploads', subdirectory);
  mkdirSync(dest, { recursive: true });
  return {
    storage: diskStorage({
      destination: dest,
      filename(_req, file, cb) {
        const ext = extname(file.originalname).toLowerCase();
        const safeExt =
          ext && ext.length <= 8 && /^\.[a-z0-9.]+$/i.test(ext) ? ext : '';
        cb(null, `${randomUUID()}${safeExt}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(_req, file, cb) {
      if (!ALLOWED_MIMES.has(file.mimetype)) {
        return cb(
          new BadRequestException(
            'Tipo de ficheiro não permitido. Use JPEG, PNG, WebP ou GIF.',
          ) as unknown as Error,
          false,
        );
      }
      cb(null, true);
    },
  };
}
