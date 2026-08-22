import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [
      participantsCount,
      schoolsCount,
      communitiesCount,
      cleanupEventsCount,
      upcomingEventsCount,
      clubsCount,
      pendingReportsCount,
      wasteAggregate,
      inventoryItems,
    ] = await Promise.all([
      this.prisma.participant.count(),
      this.prisma.school.count(),
      this.prisma.community.count(),
      this.prisma.cleanupEvent.count(),
      this.prisma.cleanupEvent.count({
        where: { status: { in: ['PLANNED', 'ONGOING'] }, eventDate: { gte: new Date() } },
      }),
      this.prisma.environmentalClub.count(),
      this.prisma.weeklyReport.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.wasteRecord.aggregate({ _sum: { weightKg: true, bags: true } }),
      this.prisma.inventoryItem.findMany(),
    ]);

    const lowStockCount = inventoryItems.filter((item) => item.quantity <= item.minimumStock).length;

    return {
      participantsCount,
      schoolsCount,
      communitiesCount,
      cleanupEventsCount,
      upcomingEventsCount,
      clubsCount,
      pendingReportsCount,
      totalWasteWeightKg: wasteAggregate._sum.weightKg ?? 0,
      totalWasteBags: wasteAggregate._sum.bags ?? 0,
      lowStockItemsCount: lowStockCount,
    };
  }

  async recentActivity() {
    const [schools, participants, events, reports] = await Promise.all([
      this.prisma.school.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      this.prisma.participant.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      this.prisma.cleanupEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      this.prisma.weeklyReport.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    const activity = [
      ...schools.map((s) => ({
        type: 'school' as const,
        title: 'New School Registered',
        description: `${s.name} joined the program`,
        timestamp: s.createdAt,
      })),
      ...participants.map((p) => ({
        type: 'participant' as const,
        title: 'New Participant',
        description: `${p.name} registered`,
        timestamp: p.createdAt,
      })),
      ...events.map((e) => ({
        type: 'event' as const,
        title: e.status === 'COMPLETED' ? 'Cleanup Event Completed' : 'Cleanup Event Scheduled',
        description: e.title,
        timestamp: e.createdAt,
      })),
      ...reports.map((r) => ({
        type: 'report' as const,
        title: 'Report Submitted',
        description: `Week ${r.weekNumber}, ${r.year}`,
        timestamp: r.createdAt,
      })),
    ];

    return activity
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8);
  }
}
