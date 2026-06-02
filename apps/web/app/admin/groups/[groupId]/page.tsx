'use client';

import Link from 'next/link';
import { Card, Placeholder } from '../../../components/ui';
import { useAuthMe } from '../../../../lib/auth/hooks';
import { useAdminGroup } from '../../../../lib/admin/hooks';

interface AdminGroupDetailPageProps {
  params: { groupId: string };
}

const formatNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

const formatMoney = (value: number, currency: 'TOMAN' | 'RIAL') =>
  `${formatNumber(Math.round(value))} ${currency === 'TOMAN' ? 'تومان' : 'ریال'}`;

export default function AdminGroupDetailPage({ params }: AdminGroupDetailPageProps) {
  const { data: me } = useAuthMe();
  const { data: group, isLoading, isError } = useAdminGroup(params.groupId, Boolean(me?.isAdmin));

  return (
    <div className="stack">
      <Link href="/admin/groups" className="btn btn-secondary admin-back-link">
        بازگشت به گروه‌ها
      </Link>

      {isLoading ? (
        <Card>
          <p style={{ margin: 0 }}>در حال بارگذاری گروه...</p>
        </Card>
      ) : null}

      {isError ? (
        <Card>
          <p style={{ margin: 0, color: 'var(--debit-fg)' }}>خواندن اطلاعات گروه ناموفق بود.</p>
        </Card>
      ) : null}

      {group ? (
        <>
          <Card title={group.name}>
            <div className="admin-readonly-banner">نمای فقط خواندنی ادمین</div>
            <div className="admin-stats-grid">
              <div className="stat-item">
                <p className="stat-label">اعضا</p>
                <p className="stat-value">{formatNumber(group.members.length)}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">هزینه‌ها</p>
                <p className="stat-value">{formatNumber(group.expenses.length)}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">تسویه‌ها</p>
                <p className="stat-value">{formatNumber(group.settlements.length)}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">واحد پول</p>
                <p className="stat-value">{group.currency === 'TOMAN' ? 'تومان' : 'ریال'}</p>
              </div>
            </div>
            <p className="admin-readonly-copy">{group.description || 'بدون توضیح'}</p>
          </Card>

          <Card title="اعضا">
            {!group.members.length ? <Placeholder label="عضوی ثبت نشده است." /> : null}
            <div className="admin-list">
              {group.members.map((member) => (
                <div key={member.id} className="admin-row">
                  <div className="admin-row-main">
                    <p className="member-name">{member.nickname}</p>
                    <p className="member-contact">{member.email || member.phone || 'بدون شناسه'}</p>
                    <div className="admin-badges">
                      {member.isAdmin ? <span className="settlement-pill settlement-credit">ادمین گروه</span> : null}
                      {member.isGuest ? <span className="settlement-pill settlement-clear">مهمان</span> : null}
                      {member.isBanned ? <span className="settlement-pill settlement-debit">کاربر مسدود</span> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="هزینه‌ها">
            {!group.expenses.length ? <Placeholder label="هزینه‌ای ثبت نشده است." /> : null}
            <div className="admin-list">
              {group.expenses.map((expense) => (
                <div key={expense.id} className="admin-readonly-item">
                  <div className="admin-row-main">
                    <p className="member-name">{expense.description}</p>
                    <p className="member-contact">
                      {new Date(expense.date).toLocaleString('fa-IR')} · {expense.splitType}
                    </p>
                  </div>
                  <p className="admin-money">{formatMoney(expense.amount, expense.currency)}</p>
                  <div className="admin-mini-grid">
                    <div>
                      <p className="stat-label">پرداخت‌کننده‌ها</p>
                      <p className="member-contact">
                        {expense.payers.map((payer) => `${payer.nickname}: ${formatMoney(payer.amount, expense.currency)}`).join('، ')}
                      </p>
                    </div>
                    <div>
                      <p className="stat-label">سهم‌ها</p>
                      <p className="member-contact">
                        {expense.splits.map((split) => `${split.nickname}: ${formatMoney(split.value, expense.currency)}`).join('، ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="تسویه‌ها">
            {!group.settlements.length ? <Placeholder label="تسویه‌ای ثبت نشده است." /> : null}
            <div className="admin-list">
              {group.settlements.map((settlement) => (
                <div key={settlement.id} className="admin-row">
                  <div className="admin-row-main">
                    <p className="member-name">
                      {settlement.payer} ← {settlement.receiver}
                    </p>
                    <p className="member-contact">
                      {settlement.method} · {new Date(settlement.createdAt).toLocaleString('fa-IR')}
                    </p>
                  </div>
                  <div className="admin-group-meta">
                    <span>{formatMoney(settlement.amount, group.currency)}</span>
                    <span>{settlement.status === 'SETTLED' ? 'تسویه شده' : 'در انتظار'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
