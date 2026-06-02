'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { PaginatedResponse } from '../api/pagination';

export type Currency = 'TOMAN' | 'RIAL';
export type SettlementStatus = 'DEBIT' | 'CREDIT' | 'CLEAR';
export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENT' | 'SHARE';
export type GroupMemberMode = 'STANDARD' | 'CREATOR_MANAGED';

export interface GroupSummary {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  memberMode: GroupMemberMode;
  currency: Currency;
  createdAt: string;
  membersCount: number;
  settlement?: {
    amount: number;
    status: SettlementStatus;
  };
}

export interface GroupMemberSummary {
  id: string;
  userId?: string;
  isAdmin: boolean;
  isGuest: boolean;
  nickname: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  settlement: {
    amount: number;
    status: SettlementStatus;
  };
}

export interface GroupExpense {
  id: string;
  description: string;
  amount: string;
  currency: Currency;
  splitType: SplitType;
  date: string;
  payers: Array<{ id: string; groupMemberId: string; amount: string }>;
  splits: Array<{ id: string; groupMemberId: string; value: string }>;
}

export interface GroupDetail {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  memberMode: GroupMemberMode;
  currency: Currency;
  createdAt: string;
  mySettlement?: {
    amount: number;
    status: SettlementStatus;
  };
  members: GroupMemberSummary[];
}

export interface SettlementItem {
  id: string;
  groupId: string;
  payerMemberId: string;
  receiverMemberId: string;
  amount: string;
  method: 'CASH' | 'CARD' | 'BANK' | 'MANUAL';
  status: 'PENDING' | 'SETTLED';
  createdAt: string;
  payer?: { id: string; nickname: string };
  receiver?: { id: string; nickname: string };
}

interface CreateGroupPayload {
  name: string;
  description?: string;
  currency?: Currency;
  imageUrl?: string;
  memberMode?: GroupMemberMode;
  creatorId: string;
}

interface InvitePayload {
  groupId: string;
  inviterId: string;
  identifier: string;
}

interface AddFriendToGroupPayload {
  groupId: string;
  actorId: string;
  friendId: string;
}

interface AddGuestMemberPayload {
  groupId: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface CreateExpensePayload {
  groupId: string;
  description: string;
  amount: number;
  currency: Currency;
  splitType: SplitType;
  date: string;
  payers: Array<{ memberId: string; amount: number }>;
  splits?: Array<{ memberId: string; value: number }>;
}

export interface CreateSettlementPayload {
  groupId: string;
  payerMemberId: string;
  receiverMemberId: string;
  amount: number;
  method?: 'CASH' | 'CARD' | 'BANK' | 'MANUAL';
  status?: 'PENDING' | 'SETTLED';
}

export function useGroups(userId?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['groups', userId, page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<GroupSummary>>('/groups', {
        params: { userId, page, limit },
      });
      return data;
    },
    enabled: Boolean(userId),
  });
}

export function useGroup(groupId?: string, userId?: string) {
  return useQuery({
    queryKey: ['group', groupId, userId],
    queryFn: async () => {
      const { data } = await apiClient.get<GroupDetail>(`/groups/${groupId}`, {
        params: { userId },
      });
      return data;
    },
    enabled: Boolean(groupId),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateGroupPayload) => {
      const { data } = await apiClient.post<GroupSummary>('/groups', payload);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useInviteToGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InvitePayload) => {
      const { data } = await apiClient.post(`/groups/${payload.groupId}/invite`, {
        inviterId: payload.inviterId,
        identifier: payload.identifier,
      });
      return data;
    },
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: ['group', payload.groupId] });
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useAddGuestMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddGuestMemberPayload) => {
      const { groupId, ...body } = payload;
      const { data } = await apiClient.post(`/groups/${groupId}/guest-members`, body);
      return data;
    },
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: ['group', payload.groupId] });
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useAddFriendToGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddFriendToGroupPayload) => {
      const { data } = await apiClient.post(
        `/groups/${payload.groupId}/friends/add`,
        {
          actorId: payload.actorId,
          friendId: payload.friendId,
        },
      );
      return data;
    },
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: ['group', payload.groupId] });
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      await queryClient.invalidateQueries({ queryKey: ['friends'] });
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateExpensePayload) => {
      const { groupId, ...body } = payload;
      const { data } = await apiClient.post(`/groups/${groupId}/expenses`, body);
      return data;
    },
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: ['group', payload.groupId] });
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useSettlements(groupId?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['settlements', groupId, page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<SettlementItem>>(
        `/groups/${groupId}/settlements`,
        { params: { page, limit } },
      );
      return data;
    },
    enabled: Boolean(groupId),
  });
}

export function useGroupExpenses(groupId?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['expenses', groupId, page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<GroupExpense>>(
        `/groups/${groupId}/expenses`,
        { params: { page, limit } },
      );
      return data;
    },
    enabled: Boolean(groupId),
  });
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSettlementPayload) => {
      const { groupId, method = 'CASH', ...rest } = payload;
      const { data } = await apiClient.post(`/groups/${groupId}/settlements`, {
        ...rest,
        method,
      });
      return data;
    },
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: ['settlements', payload.groupId] });
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
      await queryClient.invalidateQueries({ queryKey: ['group', payload.groupId] });
    },
  });
}

export function useSettleSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; groupId: string }) => {
      const { data } = await apiClient.patch(`/settlements/${payload.id}`, {
        status: 'SETTLED',
      });
      return data;
    },
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: ['settlements', payload.groupId] });
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
      await queryClient.invalidateQueries({ queryKey: ['group', payload.groupId] });
    },
  });
}
