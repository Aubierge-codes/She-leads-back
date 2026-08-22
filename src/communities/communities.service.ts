import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCommunityDto) {
    return this.prisma.community.create({ data: dto });
  }

  findAll() {
    return this.prisma.community.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { cleanupEvents: true, participants: true, schools: true } } },
    });
  }

  async findOne(id: string) {
    const community = await this.prisma.community.findFirst({ where: { id, deletedAt: null },
      include: { schools: true, participants: true },
    });
    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }
    return community;
  }

  async update(id: string, dto: UpdateCommunityDto) {
    await this.ensureExists(id);
    return this.prisma.community.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.community.update({ where: { id }, data: { deletedAt: new Date() } });
    return { id };
  }

  private async ensureExists(id: string) {
    const community = await this.prisma.community.findFirst({ where: { id, deletedAt: null } });
    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }
  }

  async restore(id: string) {
    await this.ensureExists(id);
    return this.prisma.community.update({ where: { id }, data: { deletedAt: null } });
  }
}