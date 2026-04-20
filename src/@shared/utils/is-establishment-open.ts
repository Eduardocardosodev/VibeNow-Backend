import type { OpeningHoursMap } from 'src/establishment/domain/entities/establishment.entity';
import { resolveOperatingPeriodUtcContaining } from './resolve-operating-period-utc';

const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/**
 * Indica se o instante `now` cai dentro do intervalo open–close configurado.
 * Suporta horários que cruzam meia-noite (ex.: 19:00–02:00).
 * Sem `openingHours` (null/undefined/vazio) considera-se sempre aberto.
 * Com `timeZone` (IANA), usa relógio local do estabelecimento; sem isso, mantém o comportamento antigo (hora do servidor).
 */
export function isEstablishmentOpen(
  openingHours: OpeningHoursMap | null | undefined,
  now: Date,
  timeZone?: string | null,
): boolean {
  if (openingHours == null) return true;

  const tz = timeZone?.trim();
  if (tz) {
    const period = resolveOperatingPeriodUtcContaining(
      openingHours,
      now,
      tz,
    );
    if (!period) return false;
    const t = now.getTime();
    return t >= period.periodStartUtc.getTime() && t < period.periodEndUtc.getTime();
  }

  const hours = openingHours as Record<
    string,
    { open: string; close: string } | null
  >;

  const todayKey = DAY_KEYS[now.getDay()];
  const yesterdayKey = DAY_KEYS[(now.getDay() + 6) % 7];

  const todayHours = hours[todayKey];
  const yesterdayHours = hours[yesterdayKey];

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (todayHours) {
    const [openH, openM] = todayHours.open.split(':').map(Number);
    const [closeH, closeM] = todayHours.close.split(':').map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;

    if (closeMin > openMin) {
      if (currentMinutes >= openMin && currentMinutes < closeMin) return true;
    } else {
      if (currentMinutes >= openMin) return true;
    }
  }

  if (yesterdayHours) {
    const [openH, openM] = yesterdayHours.open.split(':').map(Number);
    const [closeH, closeM] = yesterdayHours.close.split(':').map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;

    if (closeMin <= openMin && currentMinutes < closeMin) return true;
  }

  return false;
}
