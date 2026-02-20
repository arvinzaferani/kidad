'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { PaginatedResponse } from '../api/pagination';

export interface InboxMessage {
  id: string;
  userId: string;
  groupId?: string;
  type:
    | 'INVITE_CREATED'
    | 'INVITE_ACCEPTED'
    | 'INVITE_DECLINED'
    | 'SETTLEMENT_CREATED'
    | 'PAYMENT_SETTLED'
    | 'FRIEND_REQUEST_CREATED'
    | 'FRIEND_REQUEST_ACCEPTED'
    | 'FRIEND_REQUEST_DECLINED'
    | 'FRIEND_ADDED_TO_GROUP';
  message: string;
  meta?: Record<string, string>;
  createdAt: string;
}

export function useInbox(userId?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['inbox', userId, page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<InboxMessage>>('/inbox', {
        params: { userId, page, limit },
      });
      return data;
    },
    enabled: Boolean(userId),
  });
}

export function useRespondInvitation(action: 'accept' | 'decline') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      groupId: string;
      invitationId: string;
      userId: string;
    }) => {
      const { data } = await apiClient.post(
        `/groups/${payload.groupId}/invitations/${payload.invitationId}/${action}`,
        { userId: payload.userId },
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
