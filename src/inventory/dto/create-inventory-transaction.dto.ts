import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { InventoryTransactionType } from '../../../generated/prisma/client';

export class CreateInventoryTransactionDto {
  @ApiProperty({ enum: InventoryTransactionType })
  @IsEnum(InventoryTransactionType)
  type!: InventoryTransactionType;

  @ApiProperty({ description: 'For RESTOCK/USAGE: amount to add/subtract. For ADJUSTMENT: new absolute quantity.' })
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
