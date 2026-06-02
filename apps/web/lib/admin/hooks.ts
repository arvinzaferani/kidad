'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { PaginatedResponse } from '../api/pagination';
import { SafeUser } from '../auth/hooks';

export interface AdminStats {
  usersCount: number;
  adminsCount: number;
  bannedUsersCount: number;
  groupsCount: number;
  transactionCount: number;
  expensesCount: number;
  settlementsCount: number;
  signupsToday: number;
}

export interface AdminGroup {
  id: string;
  name: string;
  description?: string;
  currency: 'TOMAN' | 'RIAL';
  memberMode: 'STANDARD' | 'CREATOR_MANAGED';
  createdAt: string;
  membersCount: number;
  expensesCount: number;
}

export interface AdminGroupDetail {
  id: string;
  name: string;
  description?: string;
  currency: 'TOMAN' | 'RIAL';
  memberMode: 'STANDARD' | 'CREATOR_MANAGED';
  createdAt: string;
  members: Array<{
    id: string;
    userId?: string;
    isAdmin: boolean;
    isGuest: boolean;
    nickname: string;
    email?: string;
    phone?: string;
    isBanned: boolean;
  }>;
  expenses: Array<{
    id: string;
    description: string;
    amount: number;
    currency: 'TOMAN' | 'RIAL';
    splitType: 'EQUAL' | 'EXACT' | 'PERCENT' | 'SHARE';
    date: string;
    createdAt: string;
    payers: Array<{ memberId: string; nickname: string; amount: number }>;
    splits: Array<{ memberId: string; nickname: string; value: number }>;
  }>;
  settlements: Array<{
    id: string;
    amount: number;
    method: 'CASH' | 'CARD' | 'BANK' | 'MANUAL';
    status: 'PENDING' | 'SETTLED';
    createdAt: string;
    payer: string;
    receiver: string;
  }>;
}

export function useAdminStats(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminStats>('/admin/stats');
      return data;
    },
    enabled,
  });
}

export function useAdminUsers(search: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'users', search, page],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<SafeUser>>('/admin/users', {
        params: { search: search || undefined, page, limit: 10 },
      });
      return data;
    },
    enabled,
  });
}

export function useAdminGroups(search: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'groups', search, page],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<AdminGroup>>('/admin/groups', {
        params: { search: search || undefined, page, limit: 10 },
      });
      return data;
    },
    enabled,
  });
}

export function useAdminGroup(groupId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'groups', groupId],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminGroupDetail>(`/admin/groups/${groupId}`);
      return data;
    },
    enabled: enabled && Boolean(groupId),
  });
}

export function useSetAdminFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, value }: { userId: string; value: boolean }) => {
      const { data } = await apiClient.patch<SafeUser>(`/admin/users/${userId}/admin`, {
        value,
      });
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useSetBannedFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, value }: { userId: string; value: boolean }) => {
      const { data } = await apiClient.patch<SafeUser>(`/admin/users/${userId}/ban`, {
        value,
      });
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}
