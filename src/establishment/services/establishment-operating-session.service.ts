import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import type { ScorePeriodsQueryDto } from '../dto/score-periods-query.dto';
import {
  DEFAULT_OPERATING_TIME_ZONE,
  resolveOperatingPeriodUtcContaining,
  resolveUpcomingPeriodsUtc,
} from 'src/@shared/utils/resolve-operating-period-utc';
import type { OpeningHoursMap } from '../domain/entities/establishment.entity';

function roundScore1dp(value: number): number {
  return Math.round(value * 10) / 10;
}

const OPEN_LOOK_AHEAD_MINUTES = 6;

@Injectable()
export class EstablishmentOperatingSessionService {
  private readonly logger = new Logger(
    EstablishmentOperatingSessionService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  // ─── Abertura proactiva (cron) ────────────────────────────────────────

  /**
   * Cria sessões para todos os períodos que abrem nos próximos `lookAheadMinutes`.
   *
   * Eficiente: só busca estabelecimentos **com horário** e **sem sessão activa**;
   * para cada um calcula se há período a abrir na janela (O(7) por estabelecimento).
   * Não faz full scan desnecessário.
   */
  async openDueSessions(limit: number): Promise<number> {
    const now = new Date();

    const candidates = await this.prisma.establishment.findMany({
      where: {
        openingHours: { not: Prisma.JsonNullValueFilter.DbNull },
        operatingSession: null,
      },
      select: {
        id: true,
        openingHours: true,
        operatingTimeZone: true,
      },
      take: limit,
    });

    let created = 0;

    for (const est of candidates) {
      const tz = (
        est.operatingTimeZone ?? DEFAULT_OPERATING_TIME_ZONE
      ).trim();
      const upcoming = resolveUpcomingPeriodsUtc(
        est.openingHours as OpeningHoursMap,
        now,
        tz,
        OPEN_LOOK_AHEAD_MINUTES,
      );
      if (upcoming.length === 0) {
        const current = resolveOperatingPeriodUtcContaining(
          est.openingHours as OpeningHoursMap,
          now,
          tz,
        );
        if (!current) continue;

        try {
          await this.prisma.establishmentOperatingSession.create({
            data: {
              establishmentId: est.id,
              periodStartUtc: current.periodStartUtc,
              periodEndUtc: current.periodEndUtc,
              sumRating: 0,
              feedbackCount: 0,
            },
          });
          created++;
        } catch {
          /* unique constraint — sessão já existe, seguro */
        }
        continue;
      }

      const period = upcoming[0];
      try {
        await this.prisma.establishmentOperatingSession.create({
          data: {
            establishmentId: est.id,
            periodStartUtc: period.periodStartUtc,
            periodEndUtc: period.periodEndUtc,
            sumRating: 0,
            feedbackCount: 0,
          },
        });
        created++;
      } catch {
        /* unique constraint — sessão já existe, seguro */
      }
    }

    return created;
  }

  // ─── Feedback: só incrementa sessão existente ─────────────────────────

  /**
   * Incrementa a sessão activa e actualiza `establishments.score`.
   * Se não houver sessão (ex.: o cron ainda não rodou), cria uma como fallback
   * para não perder dados.
   */
  async onFeedbackCreated(
    establishmentId: number,
    newRating: number,
    at: Date,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const session = await tx.establishmentOperatingSession.findUnique({
        where: { establishmentId },
      });

      if (session) {
        const sumRating = session.sumRating + newRating;
        const feedbackCount = session.feedbackCount + 1;
        const score = roundScore1dp(sumRating / feedbackCount);

        await tx.establishmentOperatingSession.update({
          where: { establishmentId },
          data: { sumRating, feedbackCount },
        });
        await tx.establishment.update({
          where: { id: establishmentId },
          data: { score },
        });
        return;
      }

      const est = await tx.establishment.findUnique({
        where: { id: establishmentId },
        select: { openingHours: true, operatingTimeZone: true },
      });
      if (!est?.openingHours) return;

      const tz = (
        est.operatingTimeZone ?? DEFAULT_OPERATING_TIME_ZONE
      ).trim();
      const period = resolveOperatingPeriodUtcContaining(
        est.openingHours as OpeningHoursMap,
        at,
        tz,
      );
      if (!period) return;

      const score = roundScore1dp(newRating);
      await tx.establishmentOperatingSession.create({
        data: {
          establishmentId,
          periodStartUtc: period.periodStartUtc,
          periodEndUtc: period.periodEndUtc,
          sumRating: newRating,
          feedbackCount: 1,
        },
      });
      await tx.establishment.update({
        where: { id: establishmentId },
        data: { score },
      });
    });
  }

  // ─── Reconciliação (update/delete de feedback) ────────────────────────

  async refreshOperatingSessionScore(establishmentId: number): Promise<void> {
    const session =
      await this.prisma.establishmentOperatingSession.findUnique({
        where: { establishmentId },
      });

    if (!session) {
      await this.prisma.establishment.update({
        where: { id: establishmentId },
        data: { score: 0 },
      });
      return;
    }

    const agg = await this.prisma.feedback.aggregate({
      where: {
        establishmentId,
        createdAt: {
          gte: session.periodStartUtc,
          lt: session.periodEndUtc,
        },
      },
      _sum: { rating: true },
      _count: { id: true },
    });

    const feedbackCount = agg._count.id;
    const sumRating = agg._sum.rating ?? 0;
    const score =
      feedbackCount > 0 ? roundScore1dp(sumRating / feedbackCount) : 0;

    await this.prisma.$transaction([
      this.prisma.establishmentOperatingSession.update({
        where: { establishmentId },
        data: { sumRating, feedbackCount },
      }),
      this.prisma.establishment.update({
        where: { id: establishmentId },
        data: { score },
      }),
    ]);
  }

  // ─── Fecho de sessões (cron) ──────────────────────────────────────────

  /**
   * Materializa sessões cujo `periodEndUtc` já passou.
   * Usa índice em `period_end_utc` → batch eficiente.
   */
  async finalizeDueSessions(limit: number): Promise<number> {
    const now = new Date();
    const due = await this.prisma.establishmentOperatingSession.findMany({
      where: { periodEndUtc: { lte: now } },
      orderBy: { periodEndUtc: 'asc' },
      take: limit,
    });

    for (const row of due) {
      try {
        await this.prisma.$transaction((tx) =>
          this.finalizeSessionTx(tx, row),
        );
      } catch (err) {
        this.logger.warn(
          `Falha ao finalizar sessão establishmentId=${row.establishmentId}: ${String(err)}`,
        );
      }
    }
    return due.length;
  }

  private async finalizeSessionTx(
    tx: Prisma.TransactionClient,
    session: {
      establishmentId: number;
      periodStartUtc: Date;
      periodEndUtc: Date;
      sumRating: number;
      feedbackCount: number;
    },
  ): Promise<void> {
    const agg = await tx.feedback.aggregate({
      where: {
        establishmentId: session.establishmentId,
        createdAt: {
          gte: session.periodStartUtc,
          lt: session.periodEndUtc,
        },
      },
      _sum: { rating: true },
      _count: { id: true },
    });

    const feedbackCount = agg._count.id;
    const sumRating = agg._sum.rating ?? 0;
    const averageRating =
      feedbackCount > 0 ? roundScore1dp(sumRating / feedbackCount) : 0;

    await tx.establishmentScorePeriod.create({
      data: {
        establishmentId: session.establishmentId,
        periodStartUtc: session.periodStartUtc,
        periodEndUtc: session.periodEndUtc,
        sumRating,
        feedbackCount,
        averageRating,
      },
    });

    await tx.establishmentOperatingSession.delete({
      where: { establishmentId: session.establishmentId },
    });

    await tx.establishment.update({
      where: { id: session.establishmentId },
      data: { score: 0 },
    });
  }

  // ─── Leitura (API /score-periods) ─────────────────────────────────────

  async listScorePeriodsForPanel(
    establishmentId: number,
    query: ScorePeriodsQueryDto,
  ): Promise<{
    items: Array<{
      id: number;
      periodStartUtc: Date;
      periodEndUtc: Date;
      sumRating: number;
      feedbackCount: number;
      averageRating: number;
      closedAt: Date;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    currentSession: null | {
      periodStartUtc: Date;
      periodEndUtc: Date;
      sumRating: number;
      feedbackCount: number;
      averageRating: number;
    };
  }> {
    const page = query.getPage();
    const pageSize = query.getPageSize();
    const skip = (page - 1) * pageSize;

    const [items, total, currentRow] = await Promise.all([
      this.prisma.establishmentScorePeriod.findMany({
        where: { establishmentId },
        orderBy: { periodEndUtc: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          periodStartUtc: true,
          periodEndUtc: true,
          sumRating: true,
          feedbackCount: true,
          averageRating: true,
          closedAt: true,
        },
      }),
      this.prisma.establishmentScorePeriod.count({
        where: { establishmentId },
      }),
      this.prisma.establishmentOperatingSession.findUnique({
        where: { establishmentId },
        select: {
          periodStartUtc: true,
          periodEndUtc: true,
          sumRating: true,
          feedbackCount: true,
        },
      }),
    ]);

    let currentSession: null | {
      periodStartUtc: Date;
      periodEndUtc: Date;
      sumRating: number;
      feedbackCount: number;
      averageRating: number;
    } = null;

    if (currentRow) {
      const { feedbackCount, sumRating } = currentRow;
      const averageRating =
        feedbackCount > 0 ? roundScore1dp(sumRating / feedbackCount) : 0;
      currentSession = {
        periodStartUtc: currentRow.periodStartUtc,
        periodEndUtc: currentRow.periodEndUtc,
        sumRating,
        feedbackCount,
        averageRating,
      };
    }

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      items: items.map((row) => ({
        id: row.id,
        periodStartUtc: row.periodStartUtc,
        periodEndUtc: row.periodEndUtc,
        sumRating: row.sumRating,
        feedbackCount: row.feedbackCount,
        averageRating: row.averageRating,
        closedAt: row.closedAt,
      })),
      total,
      page,
      pageSize,
      totalPages,
      currentSession,
    };
  }
}
