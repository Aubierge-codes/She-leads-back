import {  Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CleanupService } from './cleanup.service';
import { CreateCleanupEventDto } from './dto/create-cleanup-event.dto';
import { UpdateCleanupEventDto } from './dto/update-cleanup-event.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { CreateWasteRecordDto } from './dto/create-waste-record.dto';

@ApiTags('cleanup')
@ApiBearerAuth()
@Controller('cleanup/events')
export class CleanupController {
  constructor(private readonly cleanupService: CleanupService) {}

  @Post()
  create(@Body() dto: CreateCleanupEventDto) {
    return this.cleanupService.create(dto);
  }

  @Get()
  findAll() {
    return this.cleanupService.findAll();
  }

  @Get('recent-waste-records')
  recentWasteRecords() {
    return this.cleanupService.recentWasteRecords();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cleanupService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCleanupEventDto) {
    return this.cleanupService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cleanupService.remove(id);
  }

  @Post(':id/attendance')
  markAttendance(@Param('id') id: string, @Body() dto: MarkAttendanceDto) {
    return this.cleanupService.markAttendance(id, dto);
  }

  @Post(':id/waste-records')
  addWasteRecord(@Param('id') id: string, @Body() dto: CreateWasteRecordDto) {
    return this.cleanupService.addWasteRecord(id, dto);
  }

  @Get(':id/waste-records')
  listWasteRecords(@Param('id') id: string) {
    return this.cleanupService.listWasteRecords(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.cleanupService.restore(id);
  }
}