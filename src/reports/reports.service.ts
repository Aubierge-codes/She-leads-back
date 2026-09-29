import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportStatus } from '../../generated/prisma/client';

const SUBMITTER_FIELDS = { select: { id: true, name: true, email: true } };

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateReportDto, submittedById?: string) {
    return this.prisma.weeklyReport.create({
      data: { ...dto, submittedById, status: ReportStatus.SUBMITTED },
    });
  }

  findAll() {
    return this.prisma.weeklyReport.findMany({
      where: { deletedAt: null },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
      include: { school: true, submittedBy: SUBMITTER_FIELDS },
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.weeklyReport.findFirst({
      where: { id, deletedAt: null },
      include: { school: true, submittedBy: SUBMITTER_FIELDS },
    });
    if (!report) {
      throw new NotFoundException(`Weekly report ${id} not found`);
    }
    return report;
  }

  async update(id: string, dto: UpdateReportDto) {
    await this.ensureExists(id);
    return this.prisma.weeklyReport.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, dto: UpdateReportStatusDto) {
    await this.ensureExists(id);
    return this.prisma.weeklyReport.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.weeklyReport.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  private async ensureExists(id: string) {
    const report = await this.prisma.weeklyReport.findFirst({
      where: { id, deletedAt: null },
    });
    if (!report) {
      throw new NotFoundException(`Weekly report ${id} not found`);
    }
  }

  async restore(id: string) {
    await this.ensureExists(id);
    return this.prisma.weeklyReport.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
