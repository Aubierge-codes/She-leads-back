import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnershipInquiryDto } from './dto/create-partnership-inquiry.dto';
import { UpdatePartnershipStatusDto } from './dto/update-partnership-status.dto';

@Injectable()
export class PartnershipsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePartnershipInquiryDto) {
    return this.prisma.partnershipInquiry.create({ data: dto });
  }

  findAll() {
    return this.prisma.partnershipInquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const inquiry = await this.prisma.partnershipInquiry.findFirst({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException(`Partnership inquiry ${id} not found`);
    }
    return inquiry;
  }

  async updateStatus(id: string, dto: UpdatePartnershipStatusDto) {
    await this.findOne(id);
    return this.prisma.partnershipInquiry.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
