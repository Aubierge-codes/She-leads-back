import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCleanupEventDto } from './dto/create-cleanup-event.dto';
import { UpdateCleanupEventDto } from './dto/update-cleanup-event.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { CreateWasteRecordDto } from './dto/create-waste-record.dto';

@Injectable()
export class CleanupService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCleanupEventDto) {
    return this.prisma.cleanupEvent.create({
      data: { ...dto, eventDate: new Date(dto.eventDate) },
    });
  }

  findAll() {
    return this.prisma.cleanupEvent.findMany({
      where: { deletedAt: null },
      orderBy: { eventDate: 'desc' },
      include: {
        community: true,
        _count: {
          select: {
            attendances: true,
            wasteRecords: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.cleanupEvent.findFirst({
      where: { id, deletedAt: null },
      include: {
        community: true,
        wasteRecords: true,
        attendances: { include: { participant: true } },
      },
    });
    if (!event) {
      throw new NotFoundException(`Cleanup event ${id} not found`);
    }
    return event;
  }

  async update(id: string, dto: UpdateCleanupEventDto) {
    await this.ensureExists(id);
    const { eventDate, ...rest } = dto;
    return this.prisma.cleanupEvent.update({
      where: { id },
      data: {
        ...rest,
        ...(eventDate ? { eventDate: new Date(eventDate) } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.cleanupEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  async markAttendance(eventId: string, dto: MarkAttendanceDto) {
    await this.ensureExists(eventId);
    const attended = dto.attended ?? true;

    await this.prisma.$transaction(
      dto.participantIds.map((participantId) =>
        this.prisma.cleanupAttendance.upsert({
          where: { participantId_eventId: { participantId, eventId } },
          create: { participantId, eventId, attended },
          update: { attended },
        }),
      ),
    );

    return this.prisma.cleanupAttendance.findMany({
      where: { eventId },
      include: { participant: true },
    });
  }

  async addWasteRecord(eventId: string, dto: CreateWasteRecordDto) {
    await this.ensureExists(eventId);
    return this.prisma.wasteRecord.create({ data: { ...dto, eventId } });
  }

  listWasteRecords(eventId: string) {
    return this.prisma.wasteRecord.findMany({ where: { eventId } });
  }

  recentWasteRecords(limit = 10) {
    return this.prisma.wasteRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { event: true },
    });
  }

  private async ensureExists(id: string) {
    const event = await this.prisma.cleanupEvent.findFirst({
      where: { id, deletedAt: null },
    });
    if (!event) {
      throw new NotFoundException(`Cleanup event ${id} not found`);
    }
  }

  async restore(id: string) {
    await this.ensureExists(id);
    return this.prisma.cleanupEvent.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
