import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ParticipantStatus } from '../../../generated/prisma/client';

export class CreateParticipantDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  age!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  communityId?: string;

  @ApiProperty({ enum: ParticipantStatus, required: false, default: ParticipantStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ParticipantStatus)
  status?: ParticipantStatus;
}
