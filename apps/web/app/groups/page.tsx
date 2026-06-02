'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { AppShell, Card, Placeholder } from '../components/ui';
import { getApiError, useAuthMe } from '../../lib/auth/hooks';
import {
  GroupMemberMode,
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

const resizeGroupImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('خواندن تصویر ناموفق بود.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('فایل انتخاب‌شده تصویر معتبر نیست.'));
      image.onload = () => {
        const maxSide = 720;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('آماده‌سازی تصویر ناموفق بود.'));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

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
  const [memberMode, setMemberMode] = useState<GroupMemberMode>('STANDARD');
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
        memberMode,
        creatorId: me.id,
      });
      setGroupName('');
      setGroupDescription('');
      setGroupImageUrl('');
      setMemberMode('STANDARD');
      setModalOpen(false);
      setPage(1);
      showAlert('گروه با موفقیت ایجاد شد.', 'success');
    } catch (mutationError) {
      const msg = getApiError(mutationError);
      setError(msg);
      showAlert(msg, 'error');
    }
  };

  const onGroupImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setGroupImageUrl(await resizeGroupImage(file));
    } catch (imageError) {
      const msg = imageError instanceof Error ? imageError.message : 'انتخاب تصویر ناموفق بود.';
      setError(msg);
      showAlert(msg, 'error');
    } finally {
      event.target.value = '';
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
                  {group.memberMode === 'CREATOR_MANAGED' ? (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--accent)' }}>
                      گروه مادرخرج / ثبت اعضای مهمان
                    </p>
                  ) : null}
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

              <label className="label">تصویر گروه</label>
              <label className="image-upload-box">
                <input
                  type="file"
                  accept="image/*"
                  className="image-upload-input"
                  onChange={onGroupImageChange}
                />
                <span className="image-upload-preview">
                  {groupImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={groupImageUrl} alt="پیش‌نمایش تصویر گروه" />
                  ) : (
                    <span>+</span>
                  )}
                </span>
                <span className="image-upload-copy">
                  <strong>انتخاب تصویر</strong>
                  <small>یک تصویر از دستگاهت انتخاب کن؛ پیش‌نمایش همین‌جا نمایش داده می‌شود.</small>
                </span>
              </label>
              {groupImageUrl ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setGroupImageUrl('')}
                >
                  حذف تصویر
                </button>
              ) : null}

              <label className="creator-mode-toggle">
                <input
                  type="checkbox"
                  checked={memberMode === 'CREATOR_MANAGED'}
                  onChange={(event) =>
                    setMemberMode(event.target.checked ? 'CREATOR_MANAGED' : 'STANDARD')
                  }
                />
                <span>
                  <strong>گروه مادرخرج</strong>
                  <small>اعضای بدون ثبت‌نام هم بتوانند داخل گروه ثبت شوند.</small>
                </span>
              </label>
              <p style={{ margin: '-0.5rem 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                در حالت مادرخرج، شما می‌توانی اعضا را فقط با نام و شماره یا ایمیل اختیاری ثبت کنی.
              </p>

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
