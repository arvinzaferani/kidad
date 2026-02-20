import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ExpenseWithPayersAndSplits,
  SettlementSuggestion,
} from '../domain/settlement/settlement.types';
import { SettlementEngine } from '../domain/settlement/settlement.service';
import {
  Expense,
  ExpensePayer,
  ExpenseSplit,
  Group,
  GroupMember,
  InboxMessage,
  InboxMessageType,
  Settlement,
  SettlementStatus,
  User,
} from '../database/entities';
import { In, Repository } from 'typeorm';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateSettlementDto } from './dto/update-settlement.dto';
import { buildPaginated, toSkip } from '../common/pagination';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(Settlement)
    private readonly settlementsRepository: Repository<Settlement>,
    @InjectRepository(InboxMessage)
    private readonly inboxRepository: Repository<InboxMessage>,
    @InjectRepository(GroupMember)
    private readonly groupMembersRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
  ) {}

  /**
   * Given a list of expenses, compute minimal settlement suggestions
   * (who should pay whom and how much).
   */
  suggestSettlements(
    expenses: ExpenseWithPayersAndSplits[],
  ): SettlementSuggestion[] {
    const balances = SettlementEngine.calculateBalances(expenses);
    const { debtors, creditors } =
      SettlementEngine.splitDebtorsCreditors(balances);
    return SettlementEngine.generateSettlements(debtors, creditors);
  }

  async suggestSettlementsForGroup(
    groupId: string,
  ): Promise<SettlementSuggestion[]> {
    const expenses = await this.expensesRepository.find({
      where: { groupId },
      relations: { payers: true, splits: true },
    });

    return this.suggestSettlements(
      expenses.map((expense: Expense) => ({
        id: expense.id,
        groupId: expense.groupId,
        payers: expense.payers.map((payer: ExpensePayer) => ({
          userId: payer.userId,
          amount: Number(payer.amount),
        })),
        splits: expense.splits.map((split: ExpenseSplit) => ({
          userId: split.userId,
          value: Number(split.value),
        })),
      })),
    );
  }

  async create(data: CreateSettlementDto & { groupId: string }) {
    if (data.payerId === data.receiverId) {
      throw new BadRequestException('payerId and receiverId must be different');
    }

    const [group, users, memberships] = await Promise.all([
      this.groupsRepository.findOne({ where: { id: data.groupId } }),
      this.usersRepository.find({
        where: { id: In([data.payerId, data.receiverId]) },
      }),
      this.groupMembersRepository.find({
        where: { groupId: data.groupId, userId: In([data.payerId, data.receiverId]) },
      }),
    ]);

    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (users.length < 2) {
      throw new NotFoundException('Payer or receiver user not found');
    }
    if (memberships.length < 2) {
      throw new BadRequestException('Both users must be group members');
    }

    const payer = users.find((user) => user.id === data.payerId)!;
    const receiver = users.find((user) => user.id === data.receiverId)!;

    const settlement = await this.settlementsRepository.save({
      ...data,
      status: data.status ?? SettlementStatus.PENDING,
      amount: String(data.amount),
    });

    await this.publishSettlementInbox({
      groupId: data.groupId,
      payerId: data.payerId,
      receiverId: data.receiverId,
      type: InboxMessageType.SETTLEMENT_CREATED,
      message: `تسویه ثبت شد: ${payer.nickname} به ${receiver.nickname} مبلغ ${Math.round(data.amount).toLocaleString('fa-IR')} پرداخت می‌کند.`,
      settlementId: settlement.id,
    });

    if (settlement.status === SettlementStatus.SETTLED) {
      await this.publishSettlementInbox({
        groupId: data.groupId,
        payerId: data.payerId,
        receiverId: data.receiverId,
        type: InboxMessageType.PAYMENT_SETTLED,
        message: `پرداخت انجام شد: ${payer.nickname} تسویه با ${receiver.nickname} را پرداخت کرد.`,
        settlementId: settlement.id,
      });
    }

    return settlement;
  }

  async findByGroup(groupId: string, page = 1, limit = 10) {
    const [items, total] = await this.settlementsRepository.findAndCount({
      where: { groupId },
      relations: { payer: true, receiver: true },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: toSkip(page, limit),
    });
    return buildPaginated(items, total, page, limit);
  }

  async update(id: string, data: UpdateSettlementDto) {
    const existing = await this.settlementsRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Settlement not found');
    }

    const payload: Partial<Settlement> = {};
    if (data.amount !== undefined) payload.amount = String(data.amount);
    if (data.method !== undefined) payload.method = data.method;
    if (data.status !== undefined) payload.status = data.status;

    const updated = await this.settlementsRepository.save({
      id,
      ...payload,
    });

    if (
      data.status === SettlementStatus.SETTLED &&
      existing.status !== SettlementStatus.SETTLED
    ) {
      const users = await this.usersRepository.find({
        where: { id: In([existing.payerId, existing.receiverId]) },
      });
      const payer = users.find((user) => user.id === existing.payerId);
      const receiver = users.find((user) => user.id === existing.receiverId);
      if (payer && receiver) {
        await this.publishSettlementInbox({
          groupId: existing.groupId,
          payerId: existing.payerId,
          receiverId: existing.receiverId,
          type: InboxMessageType.PAYMENT_SETTLED,
          message: `پرداخت انجام شد: ${payer.nickname} تسویه با ${receiver.nickname} را پرداخت کرد.`,
          settlementId: existing.id,
        });
      }
    }

    return updated;
  }

  private async publishSettlementInbox(params: {
    groupId: string;
    payerId: string;
    receiverId: string;
    type: InboxMessageType;
    message: string;
    settlementId: string;
  }) {
    const members = await this.groupMembersRepository.find({
      where: { groupId: params.groupId },
      select: { userId: true },
    });

    const recipients = new Set<string>([
      ...members.map((member) => member.userId),
      params.payerId,
      params.receiverId,
    ]);

    if (!recipients.size) return;

    await this.inboxRepository.save(
      [...recipients].map((userId) =>
        this.inboxRepository.create({
          userId,
          groupId: params.groupId,
          type: params.type,
          message: params.message,
          meta: {
            settlementId: params.settlementId,
            payerId: params.payerId,
            receiverId: params.receiverId,
          },
        }),
      ),
    );
  }
}
