import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DonationFrequency } from '../../../generated/prisma/client';

export class CreateDonationDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: DonationFrequency, required: false, default: DonationFrequency.ONE_TIME })
  @IsOptional()
  @IsEnum(DonationFrequency)
  frequency?: DonationFrequency;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty()
  @IsString()
  donorName!: string;

  @ApiProperty()
  @IsEmail()
  donorEmail!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  donorPhone?: string;
}
