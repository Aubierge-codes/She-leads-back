import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateClubDto) {
    return this.prisma.environmentalClub.create({ data: dto });
  }

  findAll() {
    return this.prisma.environmentalClub.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { school: true },
    });
  }

  async findOne(id: string) {
    const club = await this.prisma.environmentalClub.findFirst({
      where: { id, deletedAt: null },
      include: { school: true },
    });
    if (!club) {
      throw new NotFoundException(`Environmental club ${id} not found`);
    }
    return club;
  }

  async update(id: string, dto: UpdateClubDto) {
    await this.ensureExists(id);
    return this.prisma.environmentalClub.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.environmentalClub.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  private async ensureExists(id: string) {
    const club = await this.prisma.environmentalClub.findFirst({
      where: { id, deletedAt: null },
    });
    if (!club) {
      throw new NotFoundException(`Environmental club ${id} not found`);
    }
  }

  async restore(id: string) {
    await this.ensureExists(id);
    return this.prisma.environmentalClub.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
