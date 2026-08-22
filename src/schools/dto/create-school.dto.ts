import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSchoolDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  location!: string;

  @ApiProperty()
  @IsString()
  teacherCoordinator!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  communityId?: string;
}
