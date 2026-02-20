'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { PaginatedResponse } from '../api/pagination';

export interface FriendUser {
  id: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface FriendListItem {
  friendshipId: string;
  user: FriendUser;
}

export interface IncomingFriendRequest {
  id: string;
  createdAt: string;
  requester: FriendUser;
}

export function useFriends(userId?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['friends', userId, page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<FriendListItem>>('/friends', {
        params: { userId, page, limit },
      });
      return data;
    },
    enabled: Boolean(userId),
  });
}

export function useIncomingFriendRequests(userId?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['friend-requests', userId, page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<IncomingFriendRequest>>(
        '/friends/requests/incoming',
        {
          params: { userId, page, limit },
        },
      );
      return data;
    },
    enabled: Boolean(userId),
  });
}

export function useCreateFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { requesterId: string; identifier: string }) => {
      const { data } = await apiClient.post('/friends/requests', payload);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['friends'] });
      await queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useRespondFriendRequest(action: 'accept' | 'decline') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { requestId: string; userId: string }) => {
      const { data } = await apiClient.post(
        `/friends/requests/${payload.requestId}/${action}`,
        { userId: payload.userId },
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['friends'] });
      await queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { friendshipId: string; userId: string }) => {
      const { data } = await apiClient.delete(`/friends/${payload.friendshipId}`, {
        data: { userId: payload.userId },
      });
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['friends'] });
      await queryClient.invalidateQueries({ queryKey: ['group'] });
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
