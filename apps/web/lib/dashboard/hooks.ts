'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface DashboardActivityItem {
  id: string;
  source: 'INBOX' | 'EXPENSE' | 'SETTLEMENT';
  createdAt: string;
  message: string;
  groupId?: string;
  groupName?: string;
}

interface DashboardActivityResponse {
  items: DashboardActivityItem[];
  limit: number;
}

export function useDashboardActivity(userId?: string, limit = 5) {
  return useQuery({
    queryKey: ['dashboard-activity', userId, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardActivityResponse>('/dashboard/activity', {
        params: { userId, limit },
      });
      return data;
    },
    enabled: Boolean(userId),
  });
}
