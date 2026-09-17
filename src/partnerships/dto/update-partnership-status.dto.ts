import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PartnershipInquiryStatus } from '../../../generated/prisma/client';

export class UpdatePartnershipStatusDto {
  @ApiProperty({ enum: PartnershipInquiryStatus })
  @IsEnum(PartnershipInquiryStatus)
  status!: PartnershipInquiryStatus;
}
