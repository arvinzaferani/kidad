import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FriendRequest,
  FriendRequestStatus,
  InboxMessage,
  InboxMessageType,
  User,
} from '../database/entities';
import { Brackets, Repository } from 'typeorm';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { buildPaginated, toSkip } from '../common/pagination';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(FriendRequest)
    private readonly friendRequestsRepository: Repository<FriendRequest>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(InboxMessage)
    private readonly inboxRepository: Repository<InboxMessage>,
  ) {}

  async listFriends(userId: string, page = 1, limit = 10) {
    const qb = this.friendRequestsRepository
      .createQueryBuilder('fr')
      .leftJoinAndSelect('fr.requester', 'requester')
      .leftJoinAndSelect('fr.addressee', 'addressee')
      .where(
        new Brackets((query) => {
          query
            .where('fr.requesterId = :userId', { userId })
            .orWhere('fr.addresseeId = :userId', { userId });
        }),
      )
      .andWhere('fr.status = :status', { status: FriendRequestStatus.ACCEPTED })
      .orderBy('fr.createdAt', 'DESC')
      .skip(toSkip(page, limit))
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();

    const items = rows.map((row) => {
      const friend =
        row.requesterId === userId ? row.addressee : row.requester;
      return {
        friendshipId: row.id,
        user: this.safeUser(friend),
      };
    });

    return buildPaginated(items, total, page, limit);
  }

  async listPendingIncoming(userId: string, page = 1, limit = 10) {
    const [rows, total] = await this.friendRequestsRepository.findAndCount({
      where: {
        addresseeId: userId,
        status: FriendRequestStatus.PENDING,
      },
      relations: { requester: true },
      order: { createdAt: 'DESC' },
      skip: toSkip(page, limit),
      take: limit,
    });

    const items = rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      requester: this.safeUser(row.requester),
    }));

    return buildPaginated(items, total, page, limit);
  }

  async createRequest(payload: CreateFriendRequestDto) {
    const requester = await this.usersRepository.findOne({
      where: { id: payload.requesterId },
    });
    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    const target = await this.findUserByIdentifier(payload.identifier);
    if (!target) {
      throw new NotFoundException('User does not exist');
    }
    if (target.id === requester.id) {
      throw new BadRequestException('Cannot add yourself as friend');
    }

    const [one, two] = [requester.id, target.id].sort();
    const existing = await this.friendRequestsRepository.findOne({
      where: [
        { requesterId: one, addresseeId: two },
        { requesterId: two, addresseeId: one },
      ],
    });

    if (existing?.status === FriendRequestStatus.ACCEPTED) {
      throw new BadRequestException('Already friends');
    }
    if (existing?.status === FriendRequestStatus.PENDING) {
      throw new BadRequestException('Pending friend request already exists');
    }

    if (existing) {
      existing.requesterId = requester.id;
      existing.addresseeId = target.id;
      existing.status = FriendRequestStatus.PENDING;
      const saved = await this.friendRequestsRepository.save(existing);
      await this.publishFriendInbox(
        target.id,
        InboxMessageType.FRIEND_REQUEST_CREATED,
        `${requester.nickname} برای شما درخواست دوستی فرستاد.`,
        saved.id,
      );
      return saved;
    }

    const request = await this.friendRequestsRepository.save(
      this.friendRequestsRepository.create({
        requesterId: requester.id,
        addresseeId: target.id,
        status: FriendRequestStatus.PENDING,
      }),
    );

    await this.publishFriendInbox(
      target.id,
      InboxMessageType.FRIEND_REQUEST_CREATED,
      `${requester.nickname} برای شما درخواست دوستی فرستاد.`,
      request.id,
    );

    return request;
  }

  async acceptRequest(requestId: string, userId: string) {
    const request = await this.friendRequestsRepository.findOne({
      where: {
        id: requestId,
        addresseeId: userId,
        status: FriendRequestStatus.PENDING,
      },
      relations: { requester: true, addressee: true },
    });
    if (!request) {
      throw new NotFoundException('Pending friend request not found');
    }

    request.status = FriendRequestStatus.ACCEPTED;
    await this.friendRequestsRepository.save(request);

    await this.publishFriendInbox(
      request.requesterId,
      InboxMessageType.FRIEND_REQUEST_ACCEPTED,
      `${request.addressee.nickname} درخواست دوستی را پذیرفت.`,
      request.id,
    );
    return { id: requestId, accepted: true };
  }

  async declineRequest(requestId: string, userId: string) {
    const request = await this.friendRequestsRepository.findOne({
      where: {
        id: requestId,
        addresseeId: userId,
        status: FriendRequestStatus.PENDING,
      },
      relations: { addressee: true },
    });
    if (!request) {
      throw new NotFoundException('Pending friend request not found');
    }

    request.status = FriendRequestStatus.DECLINED;
    await this.friendRequestsRepository.save(request);

    await this.publishFriendInbox(
      request.requesterId,
      InboxMessageType.FRIEND_REQUEST_DECLINED,
      `${request.addressee.nickname} درخواست دوستی را رد کرد.`,
      request.id,
    );
    return { id: requestId, declined: true };
  }

  async removeFriend(friendshipId: string, userId: string) {
    const request = await this.friendRequestsRepository.findOne({
      where: { id: friendshipId, status: FriendRequestStatus.ACCEPTED },
    });
    if (!request) {
      throw new NotFoundException('Friendship not found');
    }
    if (request.requesterId !== userId && request.addresseeId !== userId) {
      throw new BadRequestException('Not allowed to remove this friend');
    }

    await this.friendRequestsRepository.delete({ id: friendshipId });
    return { id: friendshipId, removed: true };
  }

  async areFriends(userA: string, userB: string) {
    const row = await this.friendRequestsRepository.findOne({
      where: [
        {
          requesterId: userA,
          addresseeId: userB,
          status: FriendRequestStatus.ACCEPTED,
        },
        {
          requesterId: userB,
          addresseeId: userA,
          status: FriendRequestStatus.ACCEPTED,
        },
      ],
    });
    return Boolean(row);
  }

  private async findUserByIdentifier(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    if (normalized.includes('@')) {
      return this.usersRepository.findOne({ where: { email: normalized } });
    }
    return this.usersRepository.findOne({ where: { phone: identifier.trim() } });
  }

  private safeUser(user: User) {
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  private async publishFriendInbox(
    userId: string,
    type: InboxMessageType,
    message: string,
    friendRequestId: string,
  ) {
    await this.inboxRepository.save(
      this.inboxRepository.create({
        userId,
        type,
        message,
        meta: { friendRequestId },
      }),
    );
  }
}
