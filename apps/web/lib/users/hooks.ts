'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { SafeUser } from '../auth/hooks';

 * UpdateProfilePayload must match UpdateUserDto on the API.
export interface UpdateProfilePayload {
  id: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  cardNumber?: string;
  shaba?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const { id, ...body } = payload;
      const { data } = await apiClient.patch<SafeUser>(`/users/${id}`, body);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['group'] });
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
