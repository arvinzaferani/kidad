import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Expense,
  ExpensePayer,
  ExpenseSplit,
  GroupMember,
  SplitType,
} from '../database/entities';
import { Repository } from 'typeorm';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { buildPaginated, toSkip } from '../common/pagination';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(ExpensePayer)
    private readonly expensePayersRepository: Repository<ExpensePayer>,
    @InjectRepository(ExpenseSplit)
    private readonly expenseSplitsRepository: Repository<ExpenseSplit>,
    @InjectRepository(GroupMember)
    private readonly groupMembersRepository: Repository<GroupMember>,
  ) {}

  async create(groupId: string, payload: CreateExpenseDto) {
    const memberships = await this.groupMembersRepository.find({
      where: { groupId },
      select: { userId: true },
    });
    if (!memberships.length) {
      throw new NotFoundException('Group not found or has no members');
    }

    const memberIds = new Set(memberships.map((member) => member.userId));
    if (!payload.payers?.length) {
      throw new BadRequestException('At least one payer is required');
    }

    for (const payer of payload.payers) {
      if (!memberIds.has(payer.userId)) {
        throw new BadRequestException('Payer must be a group member');
      }
    }

    const amount = this.round2(Number(payload.amount));
    const payersTotal = this.round2(
      payload.payers.reduce((sum, payer) => sum + Number(payer.amount), 0),
    );
    if (Math.abs(amount - payersTotal) > 0.01) {
      throw new BadRequestException('Payers total must equal expense amount');
    }

    const splits = this.normalizeSplits(payload, amount, memberships.map((member) => member.userId));
    for (const split of splits) {
      if (!memberIds.has(split.userId)) {
        throw new BadRequestException('Split user must be a group member');
      }
    }

    const expense = await this.expensesRepository.save({
      groupId,
      description: payload.description,
      amount: String(amount),
      currency: payload.currency,
      splitType: payload.splitType,
      date: new Date(payload.date),
    });

    if (payload.payers?.length) {
      await this.expensePayersRepository.save(
        payload.payers.map((payer) => ({
          expenseId: expense.id,
          userId: payer.userId,
          amount: String(payer.amount),
        })),
      );
    }

    if (splits.length) {
      await this.expenseSplitsRepository.save(
        splits.map((split) => ({
          expenseId: expense.id,
          userId: split.userId,
          value: String(split.value),
        })),
      );
    }

    return this.findOne(expense.id);
  }

  async findByGroup(groupId: string, page = 1, limit = 10) {
    const [items, total] = await this.expensesRepository.findAndCount({
      where: { groupId },
      relations: { payers: true, splits: true },
      order: { date: 'DESC' },
      take: limit,
      skip: toSkip(page, limit),
    });
    return buildPaginated(items, total, page, limit);
  }

  findOne(id: string) {
    return this.expensesRepository.findOne({
      where: { id },
      relations: { payers: true, splits: true, group: true },
    });
  }

  update(id: string, data: UpdateExpenseDto) {
    const payload: Partial<Expense> = {};
    if (data.description !== undefined) payload.description = data.description;
    if (data.currency !== undefined) payload.currency = data.currency;
    if (data.splitType !== undefined) payload.splitType = data.splitType;
    if (data.amount !== undefined) payload.amount = String(data.amount);
    if (data.date !== undefined) payload.date = new Date(data.date);

    return this.expensesRepository.save({
      id,
      ...payload,
    });
  }

  async remove(id: string) {
    await this.expensesRepository.delete({ id });
    return { id, deleted: true };
  }

  private normalizeSplits(
    payload: CreateExpenseDto,
    amount: number,
    groupUserIds: string[],
  ): Array<{ userId: string; value: number }> {
    const requested = payload.splits ?? [];
    const uniqueUsers = [...new Set(requested.map((split) => split.userId))];

    if (payload.splitType === SplitType.EQUAL) {
      const splitUsers = uniqueUsers.length ? uniqueUsers : groupUserIds;
      if (!splitUsers.length) {
        throw new BadRequestException('No users to split expense');
      }
      return this.distributeEvenly(splitUsers, amount);
    }

    if (!requested.length) {
      throw new BadRequestException('Splits are required for selected split type');
    }

    if (payload.splitType === SplitType.EXACT) {
      const total = this.round2(requested.reduce((sum, split) => sum + Number(split.value), 0));
      if (Math.abs(total - amount) > 0.01) {
        throw new BadRequestException('Exact splits total must equal expense amount');
      }
      return requested.map((split) => ({
        userId: split.userId,
        value: this.round2(Number(split.value)),
      }));
    }

    if (payload.splitType === SplitType.PERCENT) {
      const percentTotal = this.round2(
        requested.reduce((sum, split) => sum + Number(split.value), 0),
      );
      if (Math.abs(percentTotal - 100) > 0.01) {
        throw new BadRequestException('Percent splits total must be 100');
      }

      const result = requested.map((split) => ({
        userId: split.userId,
        value: this.round2((amount * Number(split.value)) / 100),
      }));
      return this.fixRoundingDelta(result, amount);
    }

    // SHARE
    const shareTotal = requested.reduce((sum, split) => sum + Number(split.value), 0);
    if (shareTotal <= 0) {
      throw new BadRequestException('Share splits must be greater than zero');
    }

    const result = requested.map((split) => ({
      userId: split.userId,
      value: this.round2((amount * Number(split.value)) / shareTotal),
    }));
    return this.fixRoundingDelta(result, amount);
  }

  private distributeEvenly(userIds: string[], amount: number) {
    const base = this.round2(amount / userIds.length);
    const result = userIds.map((userId) => ({
      userId,
      value: base,
    }));
    return this.fixRoundingDelta(result, amount);
  }

  private fixRoundingDelta(
    items: Array<{ userId: string; value: number }>,
    amount: number,
  ) {
    if (!items.length) return [];
    const total = this.round2(items.reduce((sum, item) => sum + item.value, 0));
    const delta = this.round2(amount - total);
    if (Math.abs(delta) > 0.0001) {
      items[items.length - 1].value = this.round2(items[items.length - 1].value + delta);
    }
    return items;
  }

  private round2(value: number) {
    return Math.round(value * 100) / 100;
  }
}
