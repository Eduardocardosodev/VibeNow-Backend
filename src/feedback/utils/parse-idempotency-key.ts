import { BadRequestException } from '@nestjs/common';

const MAX_LEN = 128;

/**
 * Valida o header `Idempotency-Key` (Task 2).
 * Express normaliza headers em minúsculas: usar `idempotency-key`.
 */
export function parseIdempotencyKey(
  header: string | string[] | undefined,
): string {
  const raw = Array.isArray(header) ? header[0] : header;
  if (raw == null || typeof raw !== 'string') {
    throw new BadRequestException(
      'Header Idempotency-Key é obrigatório (ex.: UUID v4).',
    );
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new BadRequestException('Idempotency-Key não pode ser vazio.');
  }
  if (trimmed.length > MAX_LEN) {
    throw new BadRequestException(
      `Idempotency-Key deve ter no máximo ${MAX_LEN} caracteres.`,
    );
  }
  return trimmed;
}
