import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationStatusDto } from './dto/update-donation-status.dto';
import { DonationStatus } from '../../generated/prisma/client';

@Injectable()
export class DonationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDonationDto) {
    const donor = await this.prisma.donor.upsert({
      where: { email: dto.donorEmail },
      update: { name: dto.donorName, phone: dto.donorPhone },
      create: { name: dto.donorName, email: dto.donorEmail, phone: dto.donorPhone },
    });

    return this.prisma.donation.create({
      data: {
        amount: dto.amount,
        currency: dto.currency,
        frequency: dto.frequency,
        message: dto.message,
        donorId: donor.id,
      },
      include: { donor: true },
    });
  }

  findAll() {
    return this.prisma.donation.findMany({
      include: { donor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const donation = await this.prisma.donation.findFirst({ where: { id }, include: { donor: true } });
    if (!donation) {
      throw new NotFoundException(`Donation ${id} not found`);
    }
    return donation;
  }

  async updateStatus(id: string, dto: UpdateDonationStatusDto) {
    await this.findOne(id);
    return this.prisma.donation.update({
      where: { id },
      data: { status: dto.status },
      include: { donor: true },
    });
  }

  async stats() {
    const [totalRaised, supportersCount, pendingCount, completedCount, failedCount, refundedCount] =
      await Promise.all([
        this.prisma.donation.aggregate({
          _sum: { amount: true },
          where: { status: DonationStatus.COMPLETED },
        }),
        this.prisma.donor.count({ where: { deletedAt: null } }),
        this.prisma.donation.count({ where: { status: DonationStatus.PENDING } }),
        this.prisma.donation.count({ where: { status: DonationStatus.COMPLETED } }),
        this.prisma.donation.count({ where: { status: DonationStatus.FAILED } }),
        this.prisma.donation.count({ where: { status: DonationStatus.REFUNDED } }),
      ]);

    return {
      totalRaised: totalRaised._sum.amount ?? 0,
      supportersCount,
      pendingCount,
      completedCount,
      failedCount,
      refundedCount,
    };
  }
}
