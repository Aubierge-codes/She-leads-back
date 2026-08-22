import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async wasteByType() {
    const grouped = await this.prisma.wasteRecord.groupBy({
      by: ['type'],
      _sum: { weightKg: true, bags: true },
    });
    return grouped.map((g) => ({
      type: g.type,
      totalWeightKg: g._sum.weightKg ?? 0,
      totalBags: g._sum.bags ?? 0,
    }));
  }

  async participantsByStatus() {
    const grouped = await this.prisma.participant.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return grouped.map((g) => ({ status: g.status, count: g._count._all }));
  }

  async cleanupEventsByStatus() {
    const grouped = await this.prisma.cleanupEvent.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return grouped.map((g) => ({ status: g.status, count: g._count._all }));
  }

  async inventoryTransactionsByType() {
    const grouped = await this.prisma.inventoryTransaction.groupBy({
      by: ['type'],
      _sum: { quantity: true },
    });
    return grouped.map((g) => ({ type: g.type, totalQuantity: g._sum.quantity ?? 0 }));
  }

  async reportsByStatus() {
    const grouped = await this.prisma.weeklyReport.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return grouped.map((g) => ({ status: g.status, count: g._count._all }));
  }
}
