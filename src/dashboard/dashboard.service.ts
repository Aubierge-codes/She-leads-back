import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DonationStatus } from '../../generated/prisma/client';

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
      donationsAggregate,
    ] = await Promise.all([
      this.prisma.participant.count({ where: { deletedAt: null } }),
      this.prisma.school.count({ where: { deletedAt: null } }),
      this.prisma.community.count({ where: { deletedAt: null } }),
      this.prisma.cleanupEvent.count({ where: { deletedAt: null } }),
      this.prisma.cleanupEvent.count({
        where: {
          deletedAt: null,
          status: { in: ['PLANNED', 'ONGOING'] },
          eventDate: { gte: new Date() },
        },
      }),
      this.prisma.environmentalClub.count({ where: { deletedAt: null } }),
      this.prisma.weeklyReport.count({
        where: { deletedAt: null, status: 'SUBMITTED' },
      }),
      this.prisma.wasteRecord.aggregate({
        where: { deletedAt: null },
        _sum: { weightKg: true, bags: true },
      }),
      this.prisma.inventoryItem.findMany({ where: { deletedAt: null } }),
      this.prisma.donation.aggregate({
        _sum: { amount: true },
        where: { status: DonationStatus.COMPLETED },
      }),
    ]);

    const lowStockCount = inventoryItems.filter(
      (item) => item.quantity <= item.minimumStock,
    ).length;

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
      donationsRaised: donationsAggregate._sum.amount ?? 0,
    };
  }

  async recentActivity() {
    const [schools, participants, events, reports] = await Promise.all([
      this.prisma.school.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.participant.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.cleanupEvent.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.weeklyReport.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
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
        title:
          e.status === 'COMPLETED'
            ? 'Cleanup Event Completed'
            : 'Cleanup Event Scheduled',
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
