import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('public')
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('summary')
  summary() {
    return this.publicService.summary();
  }

  @Get('reach')
  reach() {
    return this.publicService.reach();
  }

  @Get('impact')
  impact() {
    return this.publicService.impact();
  }
}
