'use client';

import { useState } from 'react';
import { Card, Placeholder } from '../../components/ui';
import { getApiError, useAuthMe } from '../../../lib/auth/hooks';
import {
  useAdminUsers,
  useSetAdminFlag,
  useSetBannedFlag,
} from '../../../lib/admin/hooks';

export default function AdminUsersPage() {
  const { data: me } = useAuthMe();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const { data: users, isLoading } = useAdminUsers(search, page, Boolean(me?.isAdmin));
  const setAdminFlag = useSetAdminFlag();
  const setBannedFlag = useSetBannedFlag();

  const runUserAction = async (action: () => Promise<unknown>, success: string) => {
    setMessage(null);
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage(getApiError(error));
    }
  };

  return (
    <div className="stack">
      {message ? <div className="notice notice-info">{message}</div> : null}

      <Card title="کاربران">
        <div className="admin-toolbar">
          <input
            className="field"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="جستجو با نام، ایمیل یا موبایل"
          />
        </div>

        {isLoading ? <p style={{ margin: 0 }}>در حال بارگذاری کاربران...</p> : null}
        {!isLoading && !users?.items.length ? <Placeholder label="کاربری پیدا نشد." /> : null}

        <div className="admin-list">
          {(users?.items ?? []).map((user) => (
            <div key={user.id} className="admin-row">
              <div className="admin-row-main">
                <p className="member-name">{user.nickname}</p>
                <p className="member-contact">{user.email || user.phone || 'بدون شناسه ورود'}</p>
                <div className="admin-badges">
                  {user.isAdmin ? <span className="settlement-pill settlement-credit">ادمین</span> : null}
                  {user.isBanned ? <span className="settlement-pill settlement-debit">مسدود</span> : null}
                </div>
              </div>
              <div className="admin-row-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={setAdminFlag.isPending || user.id === me?.id}
                  onClick={() =>
                    runUserAction(
                      () => setAdminFlag.mutateAsync({ userId: user.id, value: !user.isAdmin }),
                      user.isAdmin ? 'دسترسی ادمین حذف شد.' : 'کاربر ادمین شد.',
                    )
                  }
                >
                  {user.isAdmin ? 'حذف ادمین' : 'ادمین کن'}
                </button>
                <button
                  type="button"
                  className={user.isBanned ? 'btn btn-primary' : 'btn btn-secondary'}
                  disabled={setBannedFlag.isPending || user.id === me?.id}
                  onClick={() =>
                    runUserAction(
                      () => setBannedFlag.mutateAsync({ userId: user.id, value: !user.isBanned }),
                      user.isBanned ? 'کاربر آزاد شد.' : 'کاربر مسدود شد.',
                    )
                  }
                >
                  {user.isBanned ? 'آزاد کن' : 'مسدود کن'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid-two" style={{ marginTop: '0.75rem' }}>
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            صفحه قبل
          </button>
          <button className="btn btn-secondary" disabled={!users?.hasNext} onClick={() => setPage((p) => p + 1)}>
            صفحه بعد
          </button>
        </div>
      </Card>
    </div>
  );
}
