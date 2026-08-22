import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class MarkAttendanceDto {
  @ApiProperty({ type: [String] })
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  participantIds!: string[];

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  attended?: boolean;
}
