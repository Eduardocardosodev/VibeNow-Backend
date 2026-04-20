import { DateTime } from 'luxon';
import type {
  DayKey,
  OpeningHoursMap,
} from 'src/establishment/domain/entities/establishment.entity';

export const DEFAULT_OPERATING_TIME_ZONE = 'America/Sao_Paulo';

const DAY_KEYS: readonly DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/** Luxon: 1=Mon … 7=Sun — alinha com `Date.getDay()` (0=Dom … 6=Sáb). */
function luxonWeekdayToJsDay(weekday: number): number {
  return weekday === 7 ? 0 : weekday;
}

function parseOpenCloseMinutes(h: { open: string; close: string }): {
  openMin: number;
  closeMin: number;
} {
  const [openH, openM] = h.open.split(':').map(Number);
  const [closeH, closeM] = h.close.split(':').map(Number);
  return {
    openMin: openH * 60 + openM,
    closeMin: closeH * 60 + closeM,
  };
}

/**
 * Se o instante `instant` (interpretado em `timeZone`) estiver aberto segundo `openingHours`,
 * devolve o intervalo UTC [start, end) desse “dia operacional”.
 */
export function resolveOperatingPeriodUtcContaining(
  openingHours: OpeningHoursMap | null | undefined,
  instant: Date,
  timeZone: string,
): { periodStartUtc: Date; periodEndUtc: Date } | null {
  if (openingHours == null) return null;

  const zone = timeZone?.trim();
  if (!zone) return null;

  const dt = DateTime.fromJSDate(instant, { zone });
  if (!dt.isValid) return null;

  const hours = openingHours as Record<
    string,
    { open: string; close: string } | null | undefined
  >;

  const jsDay = luxonWeekdayToJsDay(dt.weekday);
  const todayKey = DAY_KEYS[jsDay];
  const yesterdayKey = DAY_KEYS[(jsDay + 6) % 7];

  const todayHours = hours[todayKey];
  const yesterdayHours = hours[yesterdayKey];

  const currentMinutes = dt.hour * 60 + dt.minute;

  if (todayHours) {
    const { openMin, closeMin } = parseOpenCloseMinutes(todayHours);
    if (closeMin > openMin) {
      if (currentMinutes >= openMin && currentMinutes < closeMin) {
        const start = dt.startOf('day').plus({ minutes: openMin });
        const end = dt.startOf('day').plus({ minutes: closeMin });
        return {
          periodStartUtc: start.toUTC().toJSDate(),
          periodEndUtc: end.toUTC().toJSDate(),
        };
      }
    } else {
      if (currentMinutes >= openMin) {
        const start = dt.startOf('day').plus({ minutes: openMin });
        const end = dt
          .plus({ days: 1 })
          .startOf('day')
          .plus({ minutes: closeMin });
        return {
          periodStartUtc: start.toUTC().toJSDate(),
          periodEndUtc: end.toUTC().toJSDate(),
        };
      }
    }
  }

  if (yesterdayHours) {
    const { openMin, closeMin } = parseOpenCloseMinutes(yesterdayHours);
    if (closeMin <= openMin && currentMinutes < closeMin) {
      const yesterdayDt = dt.minus({ days: 1 });
      const start = yesterdayDt.startOf('day').plus({ minutes: openMin });
      const end = dt.startOf('day').plus({ minutes: closeMin });
      return {
        periodStartUtc: start.toUTC().toJSDate(),
        periodEndUtc: end.toUTC().toJSDate(),
      };
    }
  }

  return null;
}

/**
 * Dado um instante e `openingHours`, devolve **todos** os períodos operacionais
 * cujo `periodStartUtc` cai nos próximos `lookAheadMinutes` a partir de `instant`.
 *
 * Usado pelo cron de abertura: a cada tick, calcula quais turnos vão abrir
 * nos próximos N minutos e cria sessões proactivamente.
 *
 * Complexidade: O(7) — um check por dia da semana dentro da janela.
 */
export function resolveUpcomingPeriodsUtc(
  openingHours: OpeningHoursMap | null | undefined,
  instant: Date,
  timeZone: string,
  lookAheadMinutes: number,
): Array<{ periodStartUtc: Date; periodEndUtc: Date }> {
  if (openingHours == null) return [];

  const zone = timeZone?.trim();
  if (!zone) return [];

  const dt = DateTime.fromJSDate(instant, { zone });
  if (!dt.isValid) return [];

  const hours = openingHours as Record<
    string,
    { open: string; close: string } | null | undefined
  >;

  const results: Array<{ periodStartUtc: Date; periodEndUtc: Date }> = [];
  const windowEnd = dt.plus({ minutes: lookAheadMinutes });

  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    const checkDay = dt.plus({ days: dayOffset });
    const jsDay = luxonWeekdayToJsDay(checkDay.weekday);
    const dayKey = DAY_KEYS[jsDay];
    const dayHours = hours[dayKey];
    if (!dayHours) continue;

    const { openMin, closeMin } = parseOpenCloseMinutes(dayHours);
    const start = checkDay.startOf('day').plus({ minutes: openMin });
    const end =
      closeMin > openMin
        ? checkDay.startOf('day').plus({ minutes: closeMin })
        : checkDay.plus({ days: 1 }).startOf('day').plus({ minutes: closeMin });

    if (start >= dt && start < windowEnd) {
      results.push({
        periodStartUtc: start.toUTC().toJSDate(),
        periodEndUtc: end.toUTC().toJSDate(),
      });
    }
  }

  return results;
}
