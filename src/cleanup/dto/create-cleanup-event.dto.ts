import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CleanupEventStatus } from '../../../generated/prisma/client';

export class CreateCleanupEventDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsDateString()
  eventDate!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  eventTime?: string;

  @ApiProperty()
  @IsString()
  leader!: string;

  @ApiProperty({ enum: CleanupEventStatus, required: false, default: CleanupEventStatus.PLANNED })
  @IsOptional()
  @IsEnum(CleanupEventStatus)
  status?: CleanupEventStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  communityId?: string;
}
