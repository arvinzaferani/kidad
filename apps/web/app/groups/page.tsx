'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { AppShell, Card, Placeholder } from '../components/ui';
import { getApiError, useAuthMe } from '../../lib/auth/hooks';
import {
  GroupSummary,
  useCreateGroup,
  useGroups,
} from '../../lib/groups/hooks';
import { useAlert } from '../providers/alert-provider';

const formatMoney = (value: number, currency: 'TOMAN' | 'RIAL') =>
  `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} ${currency === 'TOMAN' ? 'تومان' : 'ریال'}`;

const settlementLabel = (group: GroupSummary) => {
  const settlement = group.settlement;
  if (!settlement || settlement.status === 'CLEAR') {
    return { text: 'تسویه شده', className: 'settlement-clear' };
  }
  if (settlement.status === 'CREDIT') {
    return {
      text: `طلبکار: ${formatMoney(settlement.amount, group.currency)}`,
      className: 'settlement-credit',
    };
  }
  return {
    text: `بدهکار: ${formatMoney(settlement.amount, group.currency)}`,
    className: 'settlement-debit',
  };
};

export default function GroupsPage() {
  const { showAlert } = useAlert();
  const { data: me } = useAuthMe();
  const [page, setPage] = useState(1);
  const { data: groups, isLoading, isError } = useGroups(me?.id, page, 8);
  const createGroupMutation = useCreateGroup();

  const [modalOpen, setModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupImageUrl, setGroupImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const creating = createGroupMutation.isPending;
  const sortedGroups = useMemo(() => groups?.items ?? [], [groups]);

  const onCreateGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!me?.id) return;

    setError(null);
    try {
      await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        currency: 'TOMAN',
        imageUrl: groupImageUrl.trim() || undefined,
        creatorId: me.id,
      });
      setGroupName('');
      setGroupDescription('');
      setGroupImageUrl('');
      setModalOpen(false);
      setPage(1);
      showAlert('گروه با موفقیت ایجاد شد.', 'success');
    } catch (mutationError) {
      const msg = getApiError(mutationError);
      setError(msg);
      showAlert(msg, 'error');
    }
  };

  return (
    <AppShell title="گروه‌ها" subtitle="ساخت گروه و مشاهده مانده هر گروه">
      {me ? (
        <Card title="پروفایل من">
          <div className="profile-preview">
            <div className="profile-avatar">
              {me.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.avatarUrl} alt={me.nickname} className="profile-avatar-image" />
              ) : (
                me.nickname.slice(0, 1)
              )}
            </div>
            <div>
              <p className="member-name">{me.nickname}</p>
              <p className="member-contact">{me.phone || me.email || 'بدون اطلاعات تماس'}</p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card title="ابزار سریع">
        <div className="grid-two">
          <Link href="/inbox" className="btn btn-secondary">
            اینباکس
          </Link>
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            + گروه جدید
          </button>
        </div>
      </Card>

      <Card title="گروه‌های من">
        {isLoading ? <p style={{ margin: 0 }}>در حال بارگذاری گروه‌ها...</p> : null}
        {isError ? <p style={{ margin: 0, color: '#dc2626' }}>خواندن گروه‌ها ناموفق بود.</p> : null}
        {!isLoading && !sortedGroups.length ? (
          <Placeholder label="هنوز گروهی نداری. از دکمه + گروه جدید استفاده کن." />
        ) : null}

        <div className="group-list">
          {sortedGroups.map((group) => {
            const label = settlementLabel(group);
            return (
              <Link key={group.id} href={`/groups/${group.id}`} className="group-card">
                <div className="group-card-image-wrap">
                  {group.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={group.imageUrl} alt={group.name} className="group-card-image" />
                  ) : (
                    <div className="group-card-image-fallback">{group.name.slice(0, 1)}</div>
                  )}
                </div>
                <div className="group-card-content">
                  <p className="group-card-title">{group.name}</p>
                  {group.description ? (
                    <p className="group-card-description">{group.description}</p>
                  ) : (
                    <p className="group-card-description">بدون توضیح</p>
                  )}
                  <div className="group-card-meta">
                    <span className={`settlement-pill ${label.className}`}>{label.text}</span>
                    <span className="group-card-members">{group.membersCount} عضو</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {groups?.hasNext ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPage((current) => current + 1)}
          >
            صفحه بعد
          </button>
        ) : null}
        {page > 1 ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            صفحه قبل
          </button>
        ) : null}
      </Card>

      {modalOpen ? (
        <div className="modal-root" role="dialog" aria-modal="true" aria-label="ساخت گروه جدید">
          <button type="button" className="modal-backdrop" onClick={() => setModalOpen(false)} />
          <div className="modal-card card">
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1rem' }}>ساخت گروه جدید</h2>
              <button type="button" className="sidebar-close" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={onCreateGroup} className="stack">
              <label className="label">نام گروه</label>
              <input
                className="field"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="مثلاً سفر شمال"
                required
              />

              <label className="label">توضیح</label>
              <input
                className="field"
                value={groupDescription}
                onChange={(event) => setGroupDescription(event.target.value)}
                placeholder="مثلاً هزینه‌های سفر"
              />

              <label className="label">تصویر گروه (URL)</label>
              <input
                className="field"
                value={groupImageUrl}
                onChange={(event) => setGroupImageUrl(event.target.value)}
                placeholder="https://..."
              />

              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'در حال ساخت...' : 'ایجاد گروه'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {error ? <p style={{ margin: 0, color: '#dc2626' }}>{error}</p> : null}
    </AppShell>
  );
}
