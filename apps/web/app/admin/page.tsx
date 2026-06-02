'use client';

import { Card } from '../components/ui';
import { useAuthMe } from '../../lib/auth/hooks';
import { useAdminStats } from '../../lib/admin/hooks';

const formatNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

export default function AdminPage() {
  const { data: me } = useAuthMe();
  const { data: stats, isLoading } = useAdminStats(Boolean(me?.isAdmin));

  return (
    <div className="stack">
      <Card title="نمای کلی">
        {isLoading ? <p style={{ margin: 0 }}>در حال بارگذاری آمار...</p> : null}
        <div className="admin-stats-grid">
          <div className="stat-item">
            <p className="stat-label">کاربران</p>
            <p className="stat-value">{formatNumber(stats?.usersCount ?? 0)}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">ادمین‌ها</p>
            <p className="stat-value">{formatNumber(stats?.adminsCount ?? 0)}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">کاربران مسدود</p>
            <p className="stat-value stat-debit">{formatNumber(stats?.bannedUsersCount ?? 0)}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">گروه‌ها</p>
            <p className="stat-value">{formatNumber(stats?.groupsCount ?? 0)}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">تراکنش‌ها</p>
            <p className="stat-value">{formatNumber(stats?.transactionCount ?? 0)}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">ثبت‌نام امروز</p>
            <p className="stat-value stat-credit">{formatNumber(stats?.signupsToday ?? 0)}</p>
          </div>
        </div>
      </Card>

      <Card title="جزئیات تراکنش‌ها">
        <div className="admin-stats-grid">
          <div className="stat-item">
            <p className="stat-label">هزینه‌ها</p>
            <p className="stat-value">{formatNumber(stats?.expensesCount ?? 0)}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">تسویه‌ها</p>
            <p className="stat-value">{formatNumber(stats?.settlementsCount ?? 0)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
