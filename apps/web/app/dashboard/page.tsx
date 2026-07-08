'use client';

import Link from 'next/link';
import { AppShell, Card, Placeholder } from '../components/ui';
import { StaggerItem } from '../components/page-transition';
import { useAuthMe, useLogout } from '../../lib/auth/hooks';
import { useInbox } from '../../lib/inbox/hooks';
import { useGroups } from '../../lib/groups/hooks';
import { useFriends, useIncomingFriendRequests } from '../../lib/friends/hooks';
import { useDashboardActivity } from '../../lib/dashboard/hooks';

const formatMoney = (value: number) =>
  `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} تومان`;

export default function DashboardPage() {
  const { data: me, isLoading, isError } = useAuthMe();
  const { data: inbox } = useInbox(me?.id, 1, 1);
  const { data: groups } = useGroups(me?.id, 1, 100);
  const { data: friends } = useFriends(me?.id, 1, 1);
  const { data: incomingFriends } = useIncomingFriendRequests(me?.id, 1, 1);
  const { data: recentActivity, isLoading: isActivityLoading, isError: isActivityError } = useDashboardActivity(
    me?.id,
    5,
  );
  const logout = useLogout();

  const totals = (groups?.items ?? []).reduce(
    (acc, group) => {
      const settlement = group.settlement;
      if (!settlement) return acc;
      if (settlement.status === 'DEBIT') acc.debit += settlement.amount;
      if (settlement.status === 'CREDIT') acc.credit += settlement.amount;
      return acc;
    },
    { debit: 0, credit: 0 },
  );

  return (
    <AppShell title="داشبورد" subtitle="خلاصه وضعیت حساب‌ها">
      <Card title="حساب کاربری">
        {isLoading ? <p style={{ margin: 0 }}>در حال بارگذاری...</p> : null}
        {isError ? <p style={{ margin: 0, color: '#dc2626' }}>خواندن اطلاعات کاربر ناموفق بود.</p> : null}
        {me ? (
          <div className="stack">
            <p style={{ margin: 0 }}>
              <strong>نام:</strong> {me.nickname}
            </p>
            <p style={{ margin: 0 }}>
              <strong>شناسه ورود:</strong> {me.phone || me.email}
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
            >
              خروج
            </button>

            <div className="grid-two">
              <Link href="/groups" className="btn btn-secondary">
                گروه‌ها
              </Link>
              <Link href="/inbox" className="btn btn-secondary">
                اینباکس ({inbox?.total ?? 0})
              </Link>
            </div>
          </div>
        ) : null}
      </Card>

      <Card title="آمار کلی">
        <div className="stats-grid">
          <div className="stat-item">
            <p className="stat-label">تعداد گروه‌ها</p>
            <p className="stat-value">{groups?.total ?? 0}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">دوستان</p>
            <p className="stat-value">{friends?.total ?? 0}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">درخواست دوستی</p>
            <p className="stat-value">{incomingFriends?.total ?? 0}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">اعلان‌ها</p>
            <p className="stat-value">{inbox?.total ?? 0}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">مجموع بدهی</p>
            <p className="stat-value stat-debit">{formatMoney(totals.debit)}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">مجموع طلب</p>
            <p className="stat-value stat-credit">{formatMoney(totals.credit)}</p>
          </div>
        </div>
      </Card>

      <Card title="فعالیت‌های اخیر">
        {isActivityLoading ? <p style={{ margin: 0 }}>در حال بارگذاری فعالیت‌ها...</p> : null}
        {isActivityError ? (
          <p style={{ margin: 0, color: '#dc2626' }}>خواندن فعالیت‌ها ناموفق بود.</p>
        ) : null}
        {!isActivityLoading && !(recentActivity?.items.length ?? 0) ? (
          <Placeholder label="هنوز فعالیتی ثبت نشده است." />
        ) : null}
        <div className="stack">
          {(recentActivity?.items ?? []).map((item, i) => (
            <StaggerItem key={`${item.source}-${item.id}`} index={i} className="card" style={{ marginTop: '0.75rem' }}>
              <p style={{ margin: 0 }}>{item.message}</p>
              <p style={{ margin: '0.35rem 0 0', opacity: 0.7, fontSize: '0.85rem' }}>
                {new Date(item.createdAt).toLocaleString('fa-IR')}
              </p>
              {item.groupId ? (
                <Link
                  href={`/groups/${item.groupId}`}
                  style={{ display: 'inline-block', marginTop: '0.45rem' }}
                >
                  {item.groupName ? `گروه: ${item.groupName}` : 'مشاهده گروه'}
                </Link>
              ) : null}
            </StaggerItem>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
