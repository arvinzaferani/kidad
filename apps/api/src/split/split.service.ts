import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Currency,
  SplitExpense,
  SplitExpenseParticipant,
  SplitExpensePayer,
  SplitMember,
  SplitSession,
  SplitSessionStatus,
  SplitType,
  User,
  UserStatus,
} from '../database/entities';
import { buildPaginated, toSkip } from '../common/pagination';
import { SettlementEngine } from '../domain/settlement/settlement.service';
import {
  distributeEvenly,
  exactSplits,
  percentSplits,
  round2,
  shareSplits,
} from '../domain/split/split-shares';
import { CreateSplitSessionDto } from './dto/create-split-session.dto';
import {
  CreateSplitExpenseDto,
  SplitPayerDto,
} from './dto/create-split-expense.dto';
import { JoinSplitAsGuestDto } from './dto/join-split-as-guest.dto';

const INVALID_INVITE_MESSAGE =
  'این دعوتنامه نامعتبر است یا دیگر فعال نیست.';

@Injectable()
export class SplitService {
  constructor(
    @InjectRepository(SplitSession)
    private readonly sessionsRepository: Repository<SplitSession>,
    @InjectRepository(SplitMember)
    private readonly membersRepository: Repository<SplitMember>,
    @InjectRepository(SplitExpense)
    private readonly expensesRepository: Repository<SplitExpense>,
    @InjectRepository(SplitExpenseParticipant)
    private readonly participantsRepository: Repository<SplitExpenseParticipant>,
    @InjectRepository(SplitExpensePayer)
    private readonly payersRepository: Repository<SplitExpensePayer>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private async requireUser(userId: string): Promise<void> {
    if (!(await this.usersRepository.exists({ where: { id: userId } }))) {
      throw new UnauthorizedException('کاربر نامعتبر است.');
    }
  }

  private async generateUniqueInviteToken(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const token = randomBytes(18).toString('base64url');
      if (
        !(await this.sessionsRepository.exists({
          where: { inviteToken: token },
        }))
      ) {
        return token;
      }
    }
    throw new InternalServerErrorException(
      'امکان تولید توکن دعوت یکتا وجود ندارد.',
    );
  }

  private async ensureMember(
    sessionId: string,
    userId: string,
  ): Promise<SplitMember> {
    const existing = await this.membersRepository.findOne({
      where: { sessionId, userId },
    });
    if (existing) return existing;
    const member = this.membersRepository.create({ sessionId, userId });
    return this.membersRepository.save(member);
  }

  async create(hostId: string, dto: CreateSplitSessionDto) {
    await this.requireUser(hostId);
    const session = this.sessionsRepository.create({
      hostId,
      inviteToken: await this.generateUniqueInviteToken(),
      status: SplitSessionStatus.ACTIVE,
      title: dto.title ?? null,
    });
    await this.sessionsRepository.save(session);
    await this.ensureMember(session.id, hostId);
    return this.findView(session.id, hostId);
  }

  async joinAsGuest(inviteToken: string, dto: JoinSplitAsGuestDto) {
    const session = await this.sessionsRepository.findOne({
      where: { inviteToken },
    });
    if (!session) {
      throw new NotFoundException(INVALID_INVITE_MESSAGE);
    }
    if (session.status !== SplitSessionStatus.ACTIVE) {
      throw new BadRequestException('این اسپلیت دیگر اعضای جدید نمی‌پذیرد.');
    }

    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      return { requiresMagicLink: true, email };
    }

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email,
        nickname: dto.nickname.trim(),
        isEmailVerified: true,
        status: UserStatus.ONBOARDING,
      }),
    );

    const token = `dev-${user.id}`;
    await this.ensureMember(session.id, user.id);

    return {
      requiresMagicLink: false,
      token,
      session: await this.findView(session.id, user.id),
    };
  }

  async inviteInfo(inviteToken: string) {
    const session = await this.sessionsRepository.findOne({
      where: { inviteToken },
      relations: { host: true },
    });
    if (!session) {
      throw new NotFoundException(INVALID_INVITE_MESSAGE);
    }
    const memberCount = await this.membersRepository.count({
      where: { sessionId: session.id },
    });
    return {
      sessionId: session.id,
      title: session.title ?? null,
      status: session.status,
      host: {
        userId: session.hostId,
        nickname: session.host?.nickname ?? 'بدون نام',
      },
      memberCount,
    };
  }

  async list(userId: string, page = 1, limit = 10) {
    await this.requireUser(userId);
    const [sessions, total] = await this.sessionsRepository
      .createQueryBuilder('s')
      .innerJoin(SplitMember, 'm', 'm.sessionId = s.id')
      .where('m.userId = :userId', { userId })
      .orderBy('s.createdAt', 'DESC')
      .skip(toSkip(page, limit))
      .take(limit)
      .getManyAndCount();

    const sessionIds = sessions.map((session) => session.id);
    if (!sessionIds.length) {
      return buildPaginated([], total, page, limit);
    }

    const memberRows = await this.membersRepository.find({
      where: { sessionId: In(sessionIds) },
    });
    const memberCountBySession = new Map<string, number>();
    for (const member of memberRows) {
      memberCountBySession.set(
        member.sessionId,
        (memberCountBySession.get(member.sessionId) ?? 0) + 1,
      );
    }

    const expenseRows = await this.expensesRepository.find({
      where: { sessionId: In(sessionIds) },
      relations: {
        participants: { member: true },
        payers: { member: true },
      },
    });
    const expensesBySession = new Map<string, SplitExpense[]>();
    for (const expense of expenseRows) {
      const list = expensesBySession.get(expense.sessionId) ?? [];
      list.push(expense);
      expensesBySession.set(expense.sessionId, list);
    }

    const items = sessions.map((session) => {
      const expenses = expensesBySession.get(session.id) ?? [];
      const totalAmount = round2(
        expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
      );
      const balances = this.computeBalances(expenses);
      return {
        id: session.id,
        title: session.title ?? null,
        status: session.status,
        isHost: session.hostId === userId,
        inviteToken: session.inviteToken,
        createdAt: session.createdAt,
        memberCount: memberCountBySession.get(session.id) ?? 0,
        expenseCount: expenses.length,
        totalAmount,
        currency: expenses[0]?.currency ?? Currency.TOMAN,
        myBalance: round2(balances[userId] ?? 0),
      };
    });

    return buildPaginated(items, total, page, limit);
  }

  async join(inviteToken: string, userId: string) {
    await this.requireUser(userId);
    const session = await this.sessionsRepository.findOne({
      where: { inviteToken },
    });
    if (!session) {
      throw new NotFoundException(INVALID_INVITE_MESSAGE);
    }
    if (session.status !== SplitSessionStatus.ACTIVE) {
      throw new BadRequestException('این اسپلیت دیگر اعضای جدید نمی‌پذیرد.');
    }
    await this.ensureMember(session.id, userId);
    return this.findView(session.id, userId);
  }

  async findOne(sessionId: string, requesterId: string) {
    await this.requireUser(requesterId);
    return this.findView(sessionId, requesterId);
  }

  async close(sessionId: string, requesterId: string) {
    await this.requireUser(requesterId);
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('جلسه اسپلیت پیدا نشد.');
    }
    if (session.hostId !== requesterId) {
      throw new ForbiddenException('فقط میزبان می‌تواند جلسه را ببندد.');
    }
    session.status = SplitSessionStatus.CLOSED;
    await this.sessionsRepository.save(session);
    return this.findView(sessionId, requesterId);
  }

  async addExpense(
    sessionId: string,
    requesterId: string,
    dto: CreateSplitExpenseDto,
  ) {
    await this.requireUser(requesterId);
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('جلسه اسپلیت پیدا نشد.');
    }
    if (session.status !== SplitSessionStatus.ACTIVE) {
      throw new BadRequestException('جلسه بسته شده است.');
    }
    if (session.hostId !== requesterId) {
      throw new ForbiddenException('فقط میزبان می‌تواند خرج ثبت کند.');
    }
    const requesterMember = await this.membersRepository.findOne({
      where: { sessionId, userId: requesterId },
    });
    if (!requesterMember) {
      throw new ForbiddenException('شما عضو این جلسه نیستید.');
    }

    const amount = round2(Number(dto.amount));
    const splitType = dto.splitType ?? SplitType.EQUAL;

    const shares = await this.validateAndComputeShares(
      sessionId,
      amount,
      splitType,
      dto,
    );

    const payers = await this.validateAndNormalizePayers(
      sessionId,
      amount,
      dto.payers ?? [{ memberId: requesterMember.id, amount }],
    );

    const expense = this.expensesRepository.create({
      sessionId,
      description: dto.description,
      amount: String(amount),
      currency: dto.currency,
      splitType,
      addedByMemberId: requesterMember.id,
    });
    await this.expensesRepository.save(expense);

    await this.payersRepository.save(
      payers.map((payer) =>
        this.payersRepository.create({
          expenseId: expense.id,
          memberId: payer.memberId,
          amount: String(payer.amount),
        }),
      ),
    );

    await this.participantsRepository.save(
      shares.map((share) =>
        this.participantsRepository.create({
          expenseId: expense.id,
          memberId: share.memberId,
          value: String(share.value),
        }),
      ),
    );

    return this.findView(sessionId, requesterId);
  }

  private async validateAndComputeShares(
    sessionId: string,
    amount: number,
    splitType: SplitType,
    dto: CreateSplitExpenseDto,
  ) {
    const splits = dto.splits ?? [];
    const splitsUniqueMemberIds = [...new Set(splits.map((s) => s.memberId))];
    const participantIds =
      splitType === SplitType.EQUAL && splitsUniqueMemberIds.length === 0
        ? (dto.participantIds ?? [])
        : splitsUniqueMemberIds;

    if (!participantIds.length) {
      throw new BadRequestException(
        'حداقل یک نفر برای تقسیم هزینه انتخاب کنید.',
      );
    }

    await this.requireMembers(sessionId, participantIds);
    if (splits.length) {
      await this.requireMembers(
        sessionId,
        splits.map((s) => s.memberId),
      );
    }

    if (splitType === SplitType.EQUAL) {
      return distributeEvenly(participantIds, amount);
    }

    if (!splits.length) {
      throw new BadRequestException(
        'برای روش تقسیم انتخابی، مقدار همهٔ شرکت‌کننده‌ها را وارد کنید.',
      );
    }

    if (splitType === SplitType.EXACT) {
      const total = round2(splits.reduce((sum, s) => sum + Number(s.value), 0));
      if (Math.abs(total - amount) > 0.01) {
        throw new BadRequestException('مجموع مبالغ دقیق باید برابر مبلغ هزینه باشد.');
      }
      return exactSplits(splits);
    }

    if (splitType === SplitType.PERCENT) {
      const percentTotal = round2(
        splits.reduce((sum, s) => sum + Number(s.value), 0),
      );
      if (Math.abs(percentTotal - 100) > 0.01) {
        throw new BadRequestException('مجموع درصدها باید برابر صد باشد.');
      }
      return percentSplits(splits, amount);
    }

    // SHARE
    const shareTotal = splits.reduce((sum, s) => sum + Number(s.value), 0);
    if (shareTotal <= 0) {
      throw new BadRequestException('سهم‌ها باید بزرگ‌تر از صفر باشند.');
    }
    return shareSplits(splits, amount);
  }

  private async validateAndNormalizePayers(
    sessionId: string,
    amount: number,
    payers: SplitPayerDto[],
  ): Promise<Array<{ memberId: string; amount: number }>> {
    const unique = [...new Map(payers.map((p) => [p.memberId, p])).values()];
    await this.requireMembers(
      sessionId,
      unique.map((p) => p.memberId),
    );
    const payersTotal = round2(
      unique.reduce((sum, p) => sum + Number(p.amount), 0),
    );
    if (Math.abs(payersTotal - amount) > 0.01) {
      throw new BadRequestException(
        'مجموع مبالغ پرداخت‌کننده‌ها باید برابر مبلغ هزینه باشد.',
      );
    }
    return unique.map((payer) => ({
      memberId: payer.memberId,
      amount: round2(Number(payer.amount)),
    }));
  }

  private async requireMembers(sessionId: string, memberIds: string[]) {
    const uniqueIds = [...new Set(memberIds)];
    const members = await this.membersRepository.find({
      where: { sessionId, id: In(uniqueIds) },
    });
    const memberIdsFound = new Set(members.map((member) => member.id));
    const missing = uniqueIds.filter((id) => !memberIdsFound.has(id));
    if (missing.length) {
      throw new BadRequestException(
        'برخی شرکت‌کننده‌ها عضو جلسه نیستند.',
      );
    }
  }

  private computeBalances(
    expenses: SplitExpense[],
  ): Record<string, number> {
    const payload = expenses
      .map((expense) => {
        const payers = (expense.payers ?? [])
          .map((payer) => ({
            userId: payer.member?.userId ?? '',
            amount: Number(payer.amount),
          }))
          .filter((payer) => payer.userId);
        const splits = (expense.participants ?? [])
          .map((participant) => ({
            userId: participant.member?.userId ?? '',
            value: Number(participant.value),
          }))
          .filter((split) => split.userId);
        if (!payers.length || !splits.length) return null;
        return {
          id: expense.id,
          groupId: expense.sessionId,
          payers,
          splits,
        };
      })
      .filter((expense) => expense !== null);
    return SettlementEngine.calculateBalances(payload ?? []);
  }

  private async findView(sessionId: string, requesterId: string) {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
      relations: { members: { user: true }, host: true },
    });
    if (!session) {
      throw new NotFoundException('جلسه اسپلیت پیدا نشد.');
    }
    if (!session.members?.some((member) => member.userId === requesterId)) {
      throw new ForbiddenException('شما عضو این جلسه نیستید.');
    }

    const expenses = await this.expensesRepository.find({
      where: { sessionId },
      relations: {
        participants: { member: { user: true } },
        payers: { member: { user: true } },
        addedBy: { user: true },
      },
      order: { createdAt: 'DESC' },
    });

    const nicknameOf = (member?: SplitMember) =>
      member?.user?.nickname ?? 'بدون نام';

    const balances = this.computeBalances(expenses);

    return {
      id: session.id,
      hostId: session.hostId,
      isHost: session.hostId === requesterId,
      title: session.title ?? null,
      status: session.status,
      inviteToken: session.inviteToken,
      createdAt: session.createdAt,
      members: (session.members ?? []).map((member) => ({
        id: member.id,
        userId: member.userId,
        nickname: nicknameOf(member),
        phone: member.user?.phone ?? null,
        avatarUrl: member.user?.avatarUrl ?? null,
        isHost: member.userId === session.hostId,
        isYou: member.userId === requesterId,
        joinedAt: member.joinedAt,
      })),
      expenses: expenses.map((expense) => ({
        id: expense.id,
        description: expense.description,
        amount: Number(expense.amount),
        currency: expense.currency,
        splitType: expense.splitType,
        createdAt: expense.createdAt,
        addedBy: {
          memberId: expense.addedByMemberId,
          userId: expense.addedBy?.userId ?? null,
          nickname: nicknameOf(expense.addedBy),
        },
        payers: (expense.payers ?? []).map((payer) => ({
          memberId: payer.memberId,
          userId: payer.member?.userId ?? null,
          nickname: payer.member ? nicknameOf(payer.member) : null,
          amount: Number(payer.amount),
        })),
        participants: (expense.participants ?? []).map((participant) => ({
          memberId: participant.memberId,
          userId: participant.member?.userId ?? null,
          nickname: participant.member ? nicknameOf(participant.member) : null,
          value: Number(participant.value),
        })),
      })),
      balances: (session.members ?? []).map((member) => ({
        memberId: member.id,
        userId: member.userId,
        nickname: nicknameOf(member),
        amount: balances[member.userId] ?? 0,
      })),
    };
  }
}