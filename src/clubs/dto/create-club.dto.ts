import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { MeetingFrequency } from '../../../generated/prisma/client';

export class CreateClubDto {
  @ApiProperty()
  @IsUUID()
  schoolId!: string;

  @ApiProperty()
  @IsString()
  president!: string;

  @ApiProperty({ enum: MeetingFrequency, required: false, default: MeetingFrequency.MONTHLY })
  @IsOptional()
  @IsEnum(MeetingFrequency)
  meetingFrequency?: MeetingFrequency;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  memberCount?: number;
}
