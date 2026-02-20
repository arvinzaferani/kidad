import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FriendRequest,
  FriendRequestStatus,
  GroupInvitation,
  InboxMessage,
  InboxMessageType,
  InvitationStatus,
} from '../database/entities';
import { In, Repository } from 'typeorm';
import { buildPaginated, toSkip } from '../common/pagination';

@Injectable()
export class InboxService {
  constructor(
    @InjectRepository(InboxMessage)
    private readonly inboxRepository: Repository<InboxMessage>,
    @InjectRepository(GroupInvitation)
    private readonly invitationsRepository: Repository<GroupInvitation>,
    @InjectRepository(FriendRequest)
    private readonly friendRequestsRepository: Repository<FriendRequest>,
  ) {}

  async findByUser(userId: string, page = 1, limit = 10) {
    const [messages, total] = await this.inboxRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: toSkip(page, limit),
    });

    const invitationIds = messages
      .filter(
        (message) =>
          message.type === InboxMessageType.INVITE_CREATED &&
          message.meta?.invitationId,
      )
      .map((message) => message.meta!.invitationId);
    const friendRequestIds = messages
      .filter(
        (message) =>
          message.type === InboxMessageType.FRIEND_REQUEST_CREATED &&
          message.meta?.friendRequestId,
      )
      .map((message) => message.meta!.friendRequestId);

    if (!invitationIds.length && !friendRequestIds.length) {
      return buildPaginated(messages, total, page, limit);
    }

    const [invitations, friendRequests] = await Promise.all([
      invitationIds.length
        ? this.invitationsRepository.find({
            where: { id: In(invitationIds) },
            select: {
              id: true,
              status: true,
            },
          })
        : Promise.resolve([]),
      friendRequestIds.length
        ? this.friendRequestsRepository.find({
            where: { id: In(friendRequestIds) },
            select: {
              id: true,
              status: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const invitationStatusMap = new Map(
      invitations.map((invitation) => [invitation.id, invitation.status]),
    );
    const friendRequestStatusMap = new Map(
      friendRequests.map((request) => [request.id, request.status]),
    );

    const items = messages.filter((message) => {
      if (message.type === InboxMessageType.INVITE_CREATED) {
        const invitationId = message.meta?.invitationId;
        if (!invitationId) return true;
        const status = invitationStatusMap.get(invitationId);
        if (!status) return false;
        if (
          message.meta?.inviteeId === userId &&
          status !== InvitationStatus.PENDING
        ) {
          return false;
        }
      }

      if (message.type === InboxMessageType.FRIEND_REQUEST_CREATED) {
        const requestId = message.meta?.friendRequestId;
        if (!requestId) return true;
        const requestStatus = friendRequestStatusMap.get(requestId);
        if (!requestStatus) return false;
        if (requestStatus !== FriendRequestStatus.PENDING) {
          return false;
        }
      }

      return true;
    });
    return buildPaginated(items, total, page, limit);
  }
}
