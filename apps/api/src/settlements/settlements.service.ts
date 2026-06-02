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
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
  ) {}

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
          userId: payer.groupMemberId,
          amount: Number(payer.amount),
        })),
        splits: expense.splits.map((split: ExpenseSplit) => ({
          userId: split.groupMemberId,
          value: Number(split.value),
        })),
      })),
    );
  }

  async create(data: CreateSettlementDto & { groupId: string }) {
    if (data.payerMemberId === data.receiverMemberId) {
      throw new BadRequestException('payerMemberId and receiverMemberId must be different');
    }

    const [group, memberships] = await Promise.all([
      this.groupsRepository.findOne({ where: { id: data.groupId } }),
      this.groupMembersRepository.find({
        where: { id: In([data.payerMemberId, data.receiverMemberId]), groupId: data.groupId },
        relations: { user: true },
      }),
    ]);

    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (memberships.length < 2) {
      throw new BadRequestException('Both members must belong to the group');
    }

    const payerMember = memberships.find((member) => member.id === data.payerMemberId)!;
    const receiverMember = memberships.find((member) => member.id === data.receiverMemberId)!;

    const settlement = await this.settlementsRepository.save({
      groupId: data.groupId,
      payerMemberId: payerMember.id,
      receiverMemberId: receiverMember.id,
      payerId: payerMember.userId,
      receiverId: receiverMember.userId,
      method: data.method,
      status: data.status ?? SettlementStatus.PENDING,
      amount: String(data.amount),
    });

    await this.publishSettlementInbox({
      groupId: data.groupId,
      payerMember,
      receiverMember,
      type: InboxMessageType.SETTLEMENT_CREATED,
      message: `تسویه ثبت شد: ${this.memberLabel(payerMember)} به ${this.memberLabel(receiverMember)} مبلغ ${Math.round(data.amount).toLocaleString('fa-IR')} پرداخت می‌کند.`,
      settlementId: settlement.id,
    });

    if (settlement.status === SettlementStatus.SETTLED) {
      await this.publishSettlementInbox({
        groupId: data.groupId,
        payerMember,
        receiverMember,
        type: InboxMessageType.PAYMENT_SETTLED,
        message: `پرداخت انجام شد: ${this.memberLabel(payerMember)} تسویه با ${this.memberLabel(receiverMember)} را پرداخت کرد.`,
        settlementId: settlement.id,
      });
    }

    return settlement;
  }

  async findByGroup(groupId: string, page = 1, limit = 10) {
    const [items, total] = await this.settlementsRepository.findAndCount({
      where: { groupId },
      relations: {
        payerMember: { user: true },
        receiverMember: { user: true },
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: toSkip(page, limit),
    });

    return buildPaginated(
      items.map((item) => ({
        ...item,
        payer: {
          id: item.payerMember.id,
          nickname: this.memberLabel(item.payerMember),
        },
        receiver: {
          id: item.receiverMember.id,
          nickname: this.memberLabel(item.receiverMember),
        },
      })),
      total,
      page,
      limit,
    );
  }

  async update(id: string, data: UpdateSettlementDto) {
    const existing = await this.settlementsRepository.findOne({
      where: { id },
      relations: {
        payerMember: { user: true },
        receiverMember: { user: true },
      },
    });
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
      await this.publishSettlementInbox({
        groupId: existing.groupId,
        payerMember: existing.payerMember,
        receiverMember: existing.receiverMember,
        type: InboxMessageType.PAYMENT_SETTLED,
        message: `پرداخت انجام شد: ${this.memberLabel(existing.payerMember)} تسویه با ${this.memberLabel(existing.receiverMember)} را پرداخت کرد.`,
        settlementId: existing.id,
      });
    }

    return updated;
  }

  private async publishSettlementInbox(params: {
    groupId: string;
    payerMember: GroupMember;
    receiverMember: GroupMember;
    type: InboxMessageType;
    message: string;
    settlementId: string;
  }) {
    const members = await this.groupMembersRepository.find({
      where: { groupId: params.groupId },
      select: { userId: true },
    });

    const recipients = new Set<string>([
      ...members.map((member) => member.userId).filter(Boolean) as string[],
      ...(params.payerMember.userId ? [params.payerMember.userId] : []),
      ...(params.receiverMember.userId ? [params.receiverMember.userId] : []),
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
            payerMemberId: params.payerMember.id,
            receiverMemberId: params.receiverMember.id,
          },
        }),
      ),
    );
  }

  private memberLabel(member: GroupMember) {
    return member.user?.nickname ?? member.guestName ?? 'عضو بدون نام';
  }
}
