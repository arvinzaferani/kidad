import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  Expense,
  Group,
  GroupMember,
  Settlement,
  User,
} from '../database/entities';
import { buildPaginated, toSkip } from '../common/pagination';
import { AdminListQueryDto } from './dto/admin-list-query.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMembersRepository: Repository<GroupMember>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(Settlement)
    private readonly settlementsRepository: Repository<Settlement>,
  ) {}

  async getStats(authorization?: string) {
    await this.requireAdmin(authorization);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      usersCount,
      adminsCount,
      bannedUsersCount,
      groupsCount,
      expensesCount,
      settlementsCount,
      signupsToday,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { isAdmin: true } }),
      this.usersRepository.count({ where: { isBanned: true } }),
      this.groupsRepository.count(),
      this.expensesRepository.count(),
      this.settlementsRepository.count(),
      this.usersRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :today', { today })
        .getCount(),
    ]);

    return {
      usersCount,
      adminsCount,
      bannedUsersCount,
      groupsCount,
      transactionCount: expensesCount + settlementsCount,
      expensesCount,
      settlementsCount,
      signupsToday,
    };
  }

  async getUsers(authorization: string | undefined, query: AdminListQueryDto) {
    await this.requireAdmin(authorization);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const builder = this.usersRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .skip(toSkip(page, limit))
      .take(limit);

    if (search) {
      builder.where(
        new Brackets((qb) => {
          qb.where('user.nickname ILIKE :search', { search: `%${search}%` })
            .orWhere('user.email ILIKE :search', { search: `%${search}%` })
            .orWhere('user.phone ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    const [users, total] = await builder.getManyAndCount();
    return buildPaginated(users.map((user) => this.toSafeUser(user)), total, page, limit);
  }

  async getGroups(authorization: string | undefined, query: AdminListQueryDto) {
    await this.requireAdmin(authorization);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const builder = this.groupsRepository
      .createQueryBuilder('appGroup')
      .leftJoin('appGroup.members', 'member')
      .leftJoin('appGroup.expenses', 'expense')
      .select('appGroup.id', 'id')
      .addSelect('appGroup.name', 'name')
      .addSelect('appGroup.description', 'description')
      .addSelect('appGroup.currency', 'currency')
      .addSelect('appGroup.memberMode', 'memberMode')
      .addSelect('appGroup.createdAt', 'createdAt')
      .addSelect('COUNT(DISTINCT member.id)', 'membersCount')
      .addSelect('COUNT(DISTINCT expense.id)', 'expensesCount')
      .groupBy('appGroup.id')
      .orderBy('appGroup.createdAt', 'DESC')
      .offset(toSkip(page, limit))
      .limit(limit);

    const countBuilder = this.groupsRepository.createQueryBuilder('appGroup');

    if (search) {
      const searchWhere = 'appGroup.name ILIKE :search OR appGroup.description ILIKE :search';
      builder.where(searchWhere, { search: `%${search}%` });
      countBuilder.where(searchWhere, { search: `%${search}%` });
    }

    const [rows, total] = await Promise.all([
      builder.getRawMany<{
        id: string;
        name: string;
        description?: string;
        currency: string;
        memberMode: string;
        createdAt: Date;
        membersCount: string;
        expensesCount: string;
      }>(),
      countBuilder.getCount(),
    ]);

    return buildPaginated(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        currency: row.currency,
        memberMode: row.memberMode,
        createdAt: row.createdAt,
        membersCount: Number(row.membersCount),
        expensesCount: Number(row.expensesCount),
      })),
      total,
      page,
      limit,
    );
  }

  async getGroup(authorization: string | undefined, groupId: string) {
    await this.requireAdmin(authorization);

    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
      relations: {
        members: { user: true },
        expenses: {
          payers: { groupMember: { user: true } },
          splits: { groupMember: { user: true } },
        },
        settlements: {
          payerMember: { user: true },
          receiverMember: { user: true },
        },
      },
      order: {
        expenses: { createdAt: 'DESC' },
        settlements: { createdAt: 'DESC' },
      },
    });

    if (!group) {
      throw new NotFoundException('گروه پیدا نشد.');
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      currency: group.currency,
      memberMode: group.memberMode,
      createdAt: group.createdAt,
      members: group.members.map((member) => ({
        id: member.id,
        userId: member.userId,
        isAdmin: member.isAdmin,
        isGuest: !member.userId,
        nickname: member.user?.nickname ?? member.guestName ?? 'عضو بدون نام',
        email: member.user?.email ?? member.guestEmail,
        phone: member.user?.phone ?? member.guestPhone,
        isBanned: member.user?.isBanned ?? false,
      })),
      expenses: group.expenses.map((expense) => ({
        id: expense.id,
        description: expense.description,
        amount: Number(expense.amount),
        currency: expense.currency,
        splitType: expense.splitType,
        date: expense.date,
        createdAt: expense.createdAt,
        payers: expense.payers.map((payer) => ({
          memberId: payer.groupMemberId,
          nickname: this.memberLabel(payer.groupMember),
          amount: Number(payer.amount),
        })),
        splits: expense.splits.map((split) => ({
          memberId: split.groupMemberId,
          nickname: this.memberLabel(split.groupMember),
          value: Number(split.value),
        })),
      })),
      settlements: group.settlements.map((settlement) => ({
        id: settlement.id,
        amount: Number(settlement.amount),
        method: settlement.method,
        status: settlement.status,
        createdAt: settlement.createdAt,
        payer: this.memberLabel(settlement.payerMember),
        receiver: this.memberLabel(settlement.receiverMember),
      })),
    };
  }

  async setAdmin(authorization: string | undefined, userId: string, value: boolean) {
    const actor = await this.requireAdmin(authorization);
    const target = await this.getTargetUser(userId);

    if (actor.id === target.id && !value) {
      throw new BadRequestException('نمی‌توانید دسترسی ادمین خودتان را حذف کنید.');
    }

    if (!value) {
      await this.assertAnotherAdminExists(target.id);
    }

    target.isAdmin = value;
    const saved = await this.usersRepository.save(target);
    return this.toSafeUser(saved);
  }

  async setBanned(authorization: string | undefined, userId: string, value: boolean) {
    const actor = await this.requireAdmin(authorization);
    const target = await this.getTargetUser(userId);

    if (actor.id === target.id && value) {
      throw new BadRequestException('نمی‌توانید حساب خودتان را مسدود کنید.');
    }

    if (target.isAdmin && value) {
      await this.assertAnotherAdminExists(target.id);
    }

    target.isBanned = value;
    const saved = await this.usersRepository.save(target);
    return this.toSafeUser(saved);
  }

  private async requireAdmin(authorization?: string) {
    const userId = this.parseUserId(authorization);
    if (!userId) {
      throw new UnauthorizedException('توکن نامعتبر است.');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || user.isBanned || !user.isAdmin) {
      throw new UnauthorizedException('دسترسی ادمین لازم است.');
    }
    return user;
  }

  private parseUserId(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    return token?.startsWith('dev-') ? token.slice(4) : null;
  }

  private async getTargetUser(userId: string) {
    const target = await this.usersRepository.findOne({ where: { id: userId } });
    if (!target) {
      throw new NotFoundException('کاربر پیدا نشد.');
    }
    return target;
  }

  private async assertAnotherAdminExists(userId: string) {
    const admins = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.isAdmin = true')
      .andWhere('user.id != :userId', { userId })
      .getCount();

    if (admins === 0) {
      throw new BadRequestException('حداقل یک ادمین باید باقی بماند.');
    }
  }

  private toSafeUser(user: User) {
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  private memberLabel(member?: GroupMember) {
    return member?.user?.nickname ?? member?.guestName ?? 'عضو بدون نام';
  }
}
