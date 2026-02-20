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
  FriendRequest,
  FriendRequestStatus,
  Group,
  GroupInvitation,
  GroupMember,
  InboxMessage,
  InboxMessageType,
  InvitationStatus,
  Settlement,
  SettlementStatus,
  User,
} from '../database/entities';
import { In, Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { SettlementEngine } from '../domain/settlement/settlement.service';
import { buildPaginated, toSkip } from '../common/pagination';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMembersRepository: Repository<GroupMember>,
    @InjectRepository(GroupInvitation)
    private readonly invitationsRepository: Repository<GroupInvitation>,
    @InjectRepository(InboxMessage)
    private readonly inboxRepository: Repository<InboxMessage>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(Settlement)
    private readonly settlementsRepository: Repository<Settlement>,
    @InjectRepository(FriendRequest)
    private readonly friendRequestsRepository: Repository<FriendRequest>,
  ) {}

  async findAll(userId?: string, page = 1, limit = 10) {
    let groupIds: string[] | null = null;

    if (userId) {
      const memberships = await this.groupMembersRepository.find({
        where: { userId },
        select: { groupId: true },
      });
      groupIds = memberships.map((membership) => membership.groupId);
      if (!groupIds.length) {
        return buildPaginated([], 0, page, limit);
      }
    }

    const where = groupIds ? { id: In(groupIds) } : undefined;

    const [groups, total] = await this.groupsRepository.findAndCount({
      where,
      relations: { members: { user: true } },
      order: { createdAt: 'DESC' },
      skip: toSkip(page, limit),
      take: limit,
    });

    const balancesByGroup = await this.getBalancesByGroup(groups.map((group) => group.id));

    const items = groups.map((group) => {
      const balances = balancesByGroup.get(group.id) ?? {};
      const net = userId ? this.round2(balances[userId] ?? 0) : 0;
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        currency: group.currency,
        createdAt: group.createdAt,
        membersCount: group.members.length,
        settlement: userId
          ? {
              amount: Math.abs(net),
              status: this.balanceStatus(net),
            }
          : undefined,
      };
    });
    return buildPaginated(items, total, page, limit);
  }

  async create(data: CreateGroupDto) {
    const { creatorId, ...rest } = data;

    if (creatorId) {
      const creator = await this.usersRepository.findOne({ where: { id: creatorId } });
      if (!creator) {
        throw new NotFoundException('Creator user not found');
      }
    }

    const group = await this.groupsRepository.save(this.groupsRepository.create(rest));

    if (creatorId) {
      await this.groupMembersRepository.save(
        this.groupMembersRepository.create({
          groupId: group.id,
          userId: creatorId,
          isAdmin: true,
        }),
      );
    }

    return group;
  }

  async findOne(id: string, userId?: string) {
    const group = await this.groupsRepository.findOne({
      where: { id },
      relations: {
        members: { user: true },
        expenses: { payers: true, splits: true },
        settlements: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const balanceMap = SettlementEngine.calculateBalances(
      group.expenses.map((expense) => ({
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
    this.applySettledSettlements(balanceMap, group.settlements);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      currency: group.currency,
      createdAt: group.createdAt,
      mySettlement: userId
        ? {
            amount: Math.abs(this.round2(balanceMap[userId] ?? 0)),
            status: this.balanceStatus(this.round2(balanceMap[userId] ?? 0)),
          }
        : undefined,
      members: group.members.map((member) => {
        const balance = this.round2(balanceMap[member.userId] ?? 0);
        return {
          id: member.id,
          userId: member.userId,
          isAdmin: member.isAdmin,
          nickname: member.user.nickname,
          email: member.user.email,
          phone: member.user.phone,
          avatarUrl: member.user.avatarUrl,
          settlement: {
            amount: Math.abs(balance),
            status: this.balanceStatus(balance),
          },
        };
      }),
      expenses: group.expenses,
    };
  }

  update(id: string, data: UpdateGroupDto) {
    return this.groupsRepository.save({
      id,
      ...data,
    });
  }

  async invite(groupId: string, data: CreateInvitationDto) {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const inviter = await this.usersRepository.findOne({ where: { id: data.inviterId } });
    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    const invitee = await this.findUserByIdentifier(data.identifier);
    if (!invitee) {
      throw new NotFoundException('User does not exist');
    }

    const alreadyMember = await this.groupMembersRepository.findOne({
      where: { groupId, userId: invitee.id },
    });

    if (alreadyMember) {
      throw new BadRequestException('User is already in this group');
    }

    const existingPending = await this.invitationsRepository.findOne({
      where: {
        groupId,
        inviteeId: invitee.id,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new BadRequestException('Pending invitation already exists');
    }

    const invitation = await this.invitationsRepository.save(
      this.invitationsRepository.create({
        groupId,
        inviterId: inviter.id,
        inviteeId: invitee.id,
        status: InvitationStatus.PENDING,
      }),
    );

    await this.publishGroupEvent({
      groupId,
      type: InboxMessageType.INVITE_CREATED,
      message: `${inviter.nickname} ${data.identifier} را به گروه دعوت کرد.`,
      extraRecipients: [invitee.id],
      meta: {
        invitationId: invitation.id,
        inviterId: inviter.id,
        inviteeId: invitee.id,
      },
    });

    return invitation;
  }

  async acceptInvitation(
    groupId: string,
    invitationId: string,
    userId: string,
  ) {
    const invitation = await this.invitationsRepository.findOne({
      where: {
        id: invitationId,
        groupId,
        inviteeId: userId,
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Pending invitation not found');
    }

    const invitee = await this.usersRepository.findOne({ where: { id: userId } });
    if (!invitee) {
      throw new NotFoundException('Invitee not found');
    }

    await this.groupMembersRepository.save({
      groupId,
      userId,
      isAdmin: false,
    });

    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationsRepository.save(invitation);

    await this.publishGroupEvent({
      groupId,
      type: InboxMessageType.INVITE_ACCEPTED,
      message: `${invitee.nickname} دعوت گروه را پذیرفت.`,
      extraRecipients: [invitation.inviterId, invitation.inviteeId],
      meta: {
        invitationId: invitation.id,
        inviteeId: userId,
      },
    });

    return { invitationId, accepted: true, groupId, userId };
  }

  async declineInvitation(
    groupId: string,
    invitationId: string,
    userId: string,
  ) {
    const invitation = await this.invitationsRepository.findOne({
      where: {
        id: invitationId,
        groupId,
        inviteeId: userId,
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Pending invitation not found');
    }

    const invitee = await this.usersRepository.findOne({ where: { id: userId } });
    if (!invitee) {
      throw new NotFoundException('Invitee not found');
    }

    invitation.status = InvitationStatus.DECLINED;
    await this.invitationsRepository.save(invitation);

    await this.publishGroupEvent({
      groupId,
      type: InboxMessageType.INVITE_DECLINED,
      message: `${invitee.nickname} دعوت گروه را رد کرد.`,
      extraRecipients: [invitation.inviterId, invitation.inviteeId],
      meta: {
        invitationId: invitation.id,
        inviteeId: userId,
      },
    });

    return { invitationId, declined: true, groupId, userId };
  }

  async join(id: string, userId: string) {
    await this.groupMembersRepository.save({
      groupId: id,
      userId,
      isAdmin: false,
    });

    return { groupId: id, joined: true };
  }

  async leave(id: string, userId: string) {
    await this.groupMembersRepository.delete({ groupId: id, userId });
    return { groupId: id, left: true };
  }

  async addFriendToGroup(groupId: string, actorId: string, friendId: string) {
    if (actorId === friendId) {
      throw new BadRequestException('Cannot add yourself as friend');
    }

    const [group, actor, friend, actorMembership, friendship] = await Promise.all([
      this.groupsRepository.findOne({ where: { id: groupId } }),
      this.usersRepository.findOne({ where: { id: actorId } }),
      this.usersRepository.findOne({ where: { id: friendId } }),
      this.groupMembersRepository.findOne({ where: { groupId, userId: actorId } }),
      this.friendRequestsRepository.findOne({
        where: [
          {
            requesterId: actorId,
            addresseeId: friendId,
            status: FriendRequestStatus.ACCEPTED,
          },
          {
            requesterId: friendId,
            addresseeId: actorId,
            status: FriendRequestStatus.ACCEPTED,
          },
        ],
      }),
    ]);

    if (!group) throw new NotFoundException('Group not found');
    if (!actor) throw new NotFoundException('Actor not found');
    if (!friend) throw new NotFoundException('Friend not found');
    if (!actorMembership) {
      throw new BadRequestException('Actor must be a group member');
    }
    if (!friendship) {
      throw new BadRequestException('Users are not friends');
    }

    const existingMember = await this.groupMembersRepository.findOne({
      where: { groupId, userId: friendId },
    });
    if (existingMember) {
      throw new BadRequestException('Friend is already in this group');
    }

    await this.groupMembersRepository.save({
      groupId,
      userId: friendId,
      isAdmin: false,
    });

    await this.publishGroupEvent({
      groupId,
      type: InboxMessageType.FRIEND_ADDED_TO_GROUP,
      message: `${actor.nickname} دوست خود ${friend.nickname} را به گروه اضافه کرد.`,
      extraRecipients: [actorId, friendId],
      meta: {
        actorId,
        friendId,
      },
    });

    return { groupId, added: true, userId: friendId };
  }

  private async findUserByIdentifier(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    if (normalized.includes('@')) {
      return this.usersRepository.findOne({ where: { email: normalized } });
    }

    return this.usersRepository.findOne({ where: { phone: identifier.trim() } });
  }

  private async publishGroupEvent(params: {
    groupId: string;
    type: InboxMessageType;
    message: string;
    extraRecipients?: string[];
    meta?: Record<string, string>;
  }) {
    const members = await this.groupMembersRepository.find({
      where: { groupId: params.groupId },
    });

    const recipients = new Set<string>([
      ...members.map((member) => member.userId),
      ...(params.extraRecipients ?? []),
    ]);

    if (!recipients.size) return;

    await this.inboxRepository.save(
      [...recipients].map((userId) =>
        this.inboxRepository.create({
          userId,
          groupId: params.groupId,
          type: params.type,
          message: params.message,
          meta: params.meta,
        }),
      ),
    );
  }

  private async getBalancesByGroup(groupIds: string[]) {
    const balancesByGroup = new Map<string, Record<string, number>>();
    if (!groupIds.length) {
      return balancesByGroup;
    }

    const expenses = await this.expensesRepository.find({
      where: { groupId: In(groupIds) },
      relations: { payers: true, splits: true },
    });
    const settlements = await this.settlementsRepository.find({
      where: { groupId: In(groupIds), status: SettlementStatus.SETTLED },
    });

    const expensesByGroup = new Map<string, Expense[]>();
    const settlementsByGroup = new Map<string, Settlement[]>();
    for (const expense of expenses) {
      const current = expensesByGroup.get(expense.groupId) ?? [];
      current.push(expense);
      expensesByGroup.set(expense.groupId, current);
    }
    for (const settlement of settlements) {
      const current = settlementsByGroup.get(settlement.groupId) ?? [];
      current.push(settlement);
      settlementsByGroup.set(settlement.groupId, current);
    }

    for (const groupId of groupIds) {
      const groupExpenses = expensesByGroup.get(groupId) ?? [];
      const balances = SettlementEngine.calculateBalances(
        groupExpenses.map((expense) => ({
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
      this.applySettledSettlements(balances, settlementsByGroup.get(groupId) ?? []);
      balancesByGroup.set(groupId, balances);
    }

    return balancesByGroup;
  }

  private balanceStatus(value: number): 'DEBIT' | 'CREDIT' | 'CLEAR' {
    if (value > 0) return 'CREDIT';
    if (value < 0) return 'DEBIT';
    return 'CLEAR';
  }

  private round2(value: number) {
    return Math.round(value * 100) / 100;
  }

  private applySettledSettlements(
    balanceMap: Record<string, number>,
    settlements: Settlement[],
  ) {
    for (const settlement of settlements) {
      if (settlement.status !== SettlementStatus.SETTLED) continue;
      const amount = Number(settlement.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      // payer sends money, so debt decreases (balance moves up);
      // receiver gets money, so credit decreases (balance moves down).
      balanceMap[settlement.payerId] =
        (balanceMap[settlement.payerId] ?? 0) + amount;
      balanceMap[settlement.receiverId] =
        (balanceMap[settlement.receiverId] ?? 0) - amount;
    }
  }
}
