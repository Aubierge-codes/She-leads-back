import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreatePartnershipInquiryDto {
  @ApiProperty()
  @IsString()
  organizationName!: string;

  @ApiProperty()
  @IsString()
  contactName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;
}
