import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

// Read-only data for the public marketing site. Only non-sensitive fields are
// returned here; the full records live behind login on their own endpoints.
@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async summary() {
    const [participantsCount, schoolsCount, communitiesCount, waste] =
      await Promise.all([
        this.prisma.participant.count({ where: { deletedAt: null } }),
        this.prisma.school.count({ where: { deletedAt: null } }),
        this.prisma.community.count({ where: { deletedAt: null } }),
        this.prisma.wasteRecord.aggregate({
          where: { deletedAt: null },
          _sum: { weightKg: true },
        }),
      ]);

    return {
      participantsCount,
      schoolsCount,
      communitiesCount,
      totalWasteWeightKg: waste._sum.weightKg ?? 0,
    };
  }

  async reach() {
    const [communities, schools] = await Promise.all([
      this.prisma.community.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, state: true },
      }),
      this.prisma.school.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ]);
    return { communities, schools };
  }

  async impact() {
    const [wasteByType, participantsByStatus] = await Promise.all([
      this.analyticsService.wasteByType(),
      this.analyticsService.participantsByStatus(),
    ]);
    return { wasteByType, participantsByStatus };
  }
}
