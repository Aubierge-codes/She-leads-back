import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DonationStatus } from '../../../generated/prisma/client';

export class UpdateDonationStatusDto {
  @ApiProperty({ enum: DonationStatus })
  @IsEnum(DonationStatus)
  status!: DonationStatus;
}
