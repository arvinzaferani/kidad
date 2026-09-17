'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { PaginatedResponse } from '../api/pagination';
import { getApiError } from '../auth/hooks';
import { setAuthToken } from '../auth/token';

export type SplitSessionStatus = 'ACTIVE' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';
export type SplitCurrency = 'TOMAN' | 'RIAL';
export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENT' | 'SHARE';

export interface SplitMemberView {
  id: string;
  userId: string;
  nickname: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isHost: boolean;
  isYou: boolean;
  joinedAt: string;
}

export interface SplitExpenseView {
  id: string;
  description: string;
  amount: number;
  currency: SplitCurrency;
  splitType: SplitType;
  createdAt: string;
  addedBy: {
    memberId: string;
    userId?: string | null;
    nickname: string;
  };
  payers: Array<{
    memberId: string;
    userId?: string | null;
    nickname?: string | null;
    amount: number;
  }>;
  participants: Array<{
    memberId: string;
    userId?: string | null;
    nickname?: string | null;
    value: number;
  }>;
}

export interface SplitBalanceView {
  memberId: string;
  userId: string;
  nickname: string;
  amount: number;
}

export interface SplitSessionView {
  id: string;
  hostId: string;
  isHost: boolean;
  title?: string | null;
  status: SplitSessionStatus;
  inviteToken: string;
  createdAt: string;
  members: SplitMemberView[];
  expenses: SplitExpenseView[];
  balances: SplitBalanceView[];
}

export interface SplitInviteInfo {
  sessionId: string;
  title?: string | null;
  status: SplitSessionStatus;
  host: {
    userId: string;
    nickname: string;
  };
  memberCount: number;
}

export interface SplitSessionSummary {
  id: string;
  title?: string | null;
  status: SplitSessionStatus;
  isHost: boolean;
  inviteToken: string;
  createdAt: string;
  memberCount: number;
  expenseCount: number;
  totalAmount: number;
  currency: SplitCurrency;
  myBalance: number;
}

export function useSplitSessions(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['split', 'sessions', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<SplitSessionSummary>
      >('/split/sessions', { params: { page, limit } });
      return data;
    },
  });
}

export function useSplitInviteInfo(inviteToken?: string) {
  return useQuery({
    queryKey: ['split', 'invite', inviteToken],
    queryFn: async () => {
      const { data } = await apiClient.get<SplitInviteInfo>(
        `/split/invite/${inviteToken}`,
      );
      return data;
    },
    enabled: Boolean(inviteToken),
    retry: 1,
  });
}

export function useSplitSession(sessionId?: string) {
  return useQuery({
    queryKey: ['split', 'session', sessionId],
    queryFn: async () => {
      const { data } = await apiClient.get<SplitSessionView>(
        `/split/sessions/${sessionId}`,
      );
      return data;
    },
    enabled: Boolean(sessionId),
    refetchInterval: 4000,
  });
}

export function useCreateSplitSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title?: string }) => {
      const { data } = await apiClient.post<SplitSessionView>(
        '/split/sessions',
        payload,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['split', 'session', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['split', 'sessions'] });
    },
  });
}

export function useJoinSplit(inviteToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<SplitSessionView>(
        `/split/join/${inviteToken}`,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['split', 'session', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['split', 'sessions'] });
    },
  });
}

export interface GuestJoinResult {
  requiresMagicLink: boolean;
  email?: string;
  token?: string;
  session?: SplitSessionView;
}

export function useGuestJoinSplit(inviteToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { nickname: string; email: string }) => {
      const { data } = await apiClient.post<GuestJoinResult>(
        `/split/join/${inviteToken}/guest`,
        payload,
      );
      return data;
    },
    onSuccess: (data) => {
      if (!data.requiresMagicLink && data.token && data.session) {
        setAuthToken(data.token);
        queryClient.setQueryData(['split', 'session', data.session.id], data.session);
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        queryClient.invalidateQueries({ queryKey: ['split', 'sessions'] });
      }
    },
  });
}

export interface SplitPayerPayload {
  memberId: string;
  amount: number;
}

export interface SplitParticipantValue {
  memberId: string;
  value: number;
}

export interface AddSplitExpensePayload {
  description: string;
  amount: number;
  currency: SplitCurrency;
  splitType: SplitType;
  participantIds?: string[];
  payers: SplitPayerPayload[];
  splits?: SplitParticipantValue[];
}

export function useAddSplitExpense(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddSplitExpensePayload) => {
      const { data } = await apiClient.post<SplitSessionView>(
        `/split/sessions/${sessionId}/expenses`,
        payload,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['split', 'session', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['split', 'sessions'] });
    },
  });
}

export function useCloseSplitSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<SplitSessionView>(
        `/split/sessions/${sessionId}/close`,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['split', 'session', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['split', 'sessions'] });
    },
  });
}

export { getApiError };