'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '../api/client';
import { clearAuthToken, setAuthToken } from './token';

export interface SafeUser {
  id: string;
  email?: string;
  phone?: string;
  isEmailVerified: boolean;
  nickname: string;
  avatarUrl?: string;
  createdAt: string;
}

interface AuthResponse {
  user: SafeUser;
  token?: string;
  requiresEmailVerification?: boolean;
}

interface LoginResponse {
  user: SafeUser;
  token: string;
}

interface SignupPayload {
  email?: string;
  phone?: string;
  password: string;
  nickname?: string;
}

interface LoginPayload {
  identifier: string;
  password: string;
}

interface VerifyEmailPayload {
  userId: string;
  token: string;
}

function getApiError(error: unknown) {
  if (error instanceof AxiosError) {
    return (error.response?.data?.message as string) || 'خطای ارتباط با سرور';
  }
  return 'خطای ناشناخته';
}

export function useAuthMe(enabled = true) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<SafeUser>('/auth/me');
      return data;
    },
    enabled,
  });
}

export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SignupPayload) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/signup', payload);
      return data;
    },
    onSuccess: async (data) => {
      if (data.token) {
        setAuthToken(data.token);
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      }
    },
    meta: {
      humanErrorMessage: 'ثبت‌نام ناموفق بود',
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
      return data;
    },
    onSuccess: async (data) => {
      setAuthToken(data.token);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    meta: {
      humanErrorMessage: 'ورود ناموفق بود',
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: VerifyEmailPayload) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/verify-email', payload);
      return data;
    },
    onSuccess: async (data) => {
      if (data.token) {
        setAuthToken(data.token);
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      }
    },
    meta: {
      humanErrorMessage: 'تأیید ایمیل ناموفق بود',
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async (payload: { email: string }) => {
      const { data } = await apiClient.post<{ sent: boolean }>('/auth/resend-verification', payload);
      return data;
    },
    meta: {
      humanErrorMessage: 'ارسال مجدد ایمیل ناموفق بود',
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    clearAuthToken();
    queryClient.removeQueries({ queryKey: ['auth'] });
  };
}

export { getApiError };
