import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post()
  subscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.newsletterService.subscribe(dto);
  }

  @Get()
  findAll() {
    return this.newsletterService.findAll();
  }
}
