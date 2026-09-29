import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSchoolDto) {
    return this.prisma.school.create({ data: dto });
  }

  findAll() {
    return this.prisma.school.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        community: true,
        _count: {
          select: {
            participants: { where: { deletedAt: null } },
            environmentalClubs: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findFirst({
      where: { id, deletedAt: null },
      include: {
        community: true,
        participants: true,
        environmentalClubs: true,
      },
    });
    if (!school) {
      throw new NotFoundException(`School ${id} not found`);
    }
    return school;
  }

  async update(id: string, dto: UpdateSchoolDto) {
    await this.ensureExists(id);
    return this.prisma.school.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.school.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  private async ensureExists(id: string) {
    const school = await this.prisma.school.findFirst({
      where: { id, deletedAt: null },
    });
    if (!school) {
      throw new NotFoundException(`School ${id} not found`);
    }
  }

  async restore(id: string) {
    await this.ensureExists(id);
    return this.prisma.school.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
