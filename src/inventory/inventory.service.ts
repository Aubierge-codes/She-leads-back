import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { InventoryTransactionType } from '../../generated/prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateInventoryItemDto) {
    return this.prisma.inventoryItem.create({ data: dto });
  }

  findAll() {
    return this.prisma.inventoryItem.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, deletedAt: null },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!item) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }
    return item;
  }

  async update(id: string, dto: UpdateInventoryItemDto) {
    await this.getItemOrThrow(id);
    return this.prisma.inventoryItem.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.getItemOrThrow(id);
    await this.prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  async recordTransaction(
    itemId: string,
    dto: CreateInventoryTransactionDto,
    performedById?: string,
  ) {
    const item = await this.getItemOrThrow(itemId);

    let newQuantity: number;
    if (dto.type === InventoryTransactionType.RESTOCK) {
      newQuantity = item.quantity + dto.quantity;
    } else if (dto.type === InventoryTransactionType.USAGE) {
      newQuantity = item.quantity - dto.quantity;
      if (newQuantity < 0) {
        throw new BadRequestException(
          'Insufficient stock for this usage transaction',
        );
      }
    } else {
      newQuantity = dto.quantity;
    }

    const [, transaction] = await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity },
      }),
      this.prisma.inventoryTransaction.create({
        data: { ...dto, itemId, performedById },
      }),
    ]);

    return transaction;
  }

  async listLowStock() {
    const items = await this.findAll();
    return items.filter((item) => item.quantity <= item.minimumStock);
  }

  private async getItemOrThrow(id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, deletedAt: null },
    });
    if (!item) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }
    return item;
  }

  async restore(id: string) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
