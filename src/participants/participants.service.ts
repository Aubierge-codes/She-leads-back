import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';

@Injectable()
export class ParticipantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateParticipantDto) {
    return this.prisma.participant.create({ data: dto });
  }

  findAll() {
    return this.prisma.participant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { school: true, community: true },
    });
  }

  async findOne(id: string) {
    const participant = await this.prisma.participant.findFirst({
      where: { id, deletedAt: null },
      include: { school: true, community: true },
    });
    if (!participant) {
      throw new NotFoundException(`Participant ${id} not found`);
    }
    return participant;
  }

  async update(id: string, dto: UpdateParticipantDto) {
    await this.ensureExists(id);
    return this.prisma.participant.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.participant.update({ where: { id }, data: { deletedAt: new Date() } });
    return { id };
  }

  async restore(id: string) {
    await this.ensureExists(id);
    await this.prisma.participant.update({ where: { id }, data: { deletedAt: null } });
    return { id };
  }

  private async ensureExists(id: string) {
    const participant = await this.prisma.participant.findUnique({ where: { id } });
    if (!participant) {
      throw new NotFoundException(`Participant ${id} not found`);
    }
  }
}
