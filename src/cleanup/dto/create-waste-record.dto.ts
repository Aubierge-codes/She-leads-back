import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, Min } from 'class-validator';
import { WasteType } from '../../../generated/prisma/client';

export class CreateWasteRecordDto {
  @ApiProperty({ enum: WasteType })
  @IsEnum(WasteType)
  type!: WasteType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  weightKg!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  bags!: number;
}
