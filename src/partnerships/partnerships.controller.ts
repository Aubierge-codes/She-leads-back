import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PartnershipsService } from './partnerships.service';
import { CreatePartnershipInquiryDto } from './dto/create-partnership-inquiry.dto';
import { UpdatePartnershipStatusDto } from './dto/update-partnership-status.dto';

@ApiTags('partnerships')
@Controller('partnerships')
export class PartnershipsController {
  constructor(private readonly partnershipsService: PartnershipsService) {}

  @Post()
  create(@Body() dto: CreatePartnershipInquiryDto) {
    return this.partnershipsService.create(dto);
  }

  @Get()
  findAll() {
    return this.partnershipsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partnershipsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePartnershipStatusDto) {
    return this.partnershipsService.updateStatus(id, dto);
  }
}
