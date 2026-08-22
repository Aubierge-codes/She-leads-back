import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateReportDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(53)
  weekNumber!: number;

  @ApiProperty()
  @IsInt()
  year!: number;

  @ApiProperty()
  @IsString()
  activities!: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  schoolId?: string;
}
