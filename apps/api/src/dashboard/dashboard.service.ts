import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Expense,
  GroupMember,
  InboxMessage,
  Settlement,
} from '../database/entities';
import { In, Repository } from 'typeorm';

type DashboardActivitySource = 'INBOX' | 'EXPENSE' | 'SETTLEMENT';

export interface DashboardActivityItem {
  id: string;
  source: DashboardActivitySource;
  createdAt: Date;
  message: string;
  groupId?: string;
  groupName?: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(GroupMember)
    private readonly groupMembersRepository: Repository<GroupMember>,
    @InjectRepository(InboxMessage)
    private readonly inboxRepository: Repository<InboxMessage>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(Settlement)
    private readonly settlementsRepository: Repository<Settlement>,
  ) {}

  async getRecentActivity(userId: string, limit = 5) {
    const safeLimit = Math.max(1, Math.min(limit, 20));
    const fetchLimit = Math.max(10, safeLimit * 4);

    const memberships = await this.groupMembersRepository.find({
      where: { userId },
      select: { groupId: true },
    });

    const groupIds = [...new Set(memberships.map((membership) => membership.groupId))];

    const [inboxItems, expenses, settlements] = await Promise.all([
      this.inboxRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: fetchLimit,
      }),
      groupIds.length
        ? this.expensesRepository.find({
            where: { groupId: In(groupIds) },
            relations: { group: true },
            order: { createdAt: 'DESC' },
            take: fetchLimit,
          })
        : Promise.resolve([]),
      groupIds.length
        ? this.settlementsRepository.find({
            where: { groupId: In(groupIds) },
            relations: { group: true, payer: true, receiver: true },
            order: { createdAt: 'DESC' },
            take: fetchLimit,
          })
        : Promise.resolve([]),
    ]);

    const activity: DashboardActivityItem[] = [
      ...inboxItems.map((item) => ({
        id: item.id,
        source: 'INBOX' as const,
        createdAt: item.createdAt,
        message: item.message,
        groupId: item.groupId,
      })),
      ...expenses.map((expense) => ({
        id: expense.id,
        source: 'EXPENSE' as const,
        createdAt: expense.createdAt,
        message: `هزینه جدید: ${expense.description}`,
        groupId: expense.groupId,
        groupName: expense.group?.name,
      })),
      ...settlements.map((settlement) => ({
        id: settlement.id,
        source: 'SETTLEMENT' as const,
        createdAt: settlement.createdAt,
        message: `تسویه: ${settlement.payer?.nickname ?? 'کاربر'} به ${settlement.receiver?.nickname ?? 'کاربر'} مبلغ ${Math.round(Number(settlement.amount)).toLocaleString('fa-IR')} پرداخت می‌کند.`,
        groupId: settlement.groupId,
        groupName: settlement.group?.name,
      })),
    ];

    const items = activity
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, safeLimit);

    return {
      items,
      limit: safeLimit,
    };
  }
}
