import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  subscribe(dto: SubscribeNewsletterDto) {
    return this.prisma.newsletterSubscriber.upsert({
      where: { email: dto.email },
      update: {},
      create: { email: dto.email },
    });
  }

  findAll() {
    return this.prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
