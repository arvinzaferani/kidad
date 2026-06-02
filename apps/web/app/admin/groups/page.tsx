'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Placeholder } from '../../components/ui';
import { useAuthMe } from '../../../lib/auth/hooks';
import { useAdminGroups } from '../../../lib/admin/hooks';

const formatNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

export default function AdminGroupsPage() {
  const { data: me } = useAuthMe();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data: groups, isLoading } = useAdminGroups(search, page, Boolean(me?.isAdmin));

  return (
    <div className="stack">
      <Card title="گروه‌ها">
        <div className="admin-toolbar">
          <input
            className="field"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="جستجو با نام گروه"
          />
        </div>

        {isLoading ? <p style={{ margin: 0 }}>در حال بارگذاری گروه‌ها...</p> : null}
        {!isLoading && !groups?.items.length ? <Placeholder label="گروهی پیدا نشد." /> : null}

        <div className="admin-list">
          {(groups?.items ?? []).map((group) => (
            <Link key={group.id} href={`/admin/groups/${group.id}`} className="admin-row admin-row-link">
              <div className="admin-row-main">
                <p className="member-name">{group.name}</p>
                <p className="member-contact">{group.description || 'بدون توضیح'}</p>
              </div>
              <div className="admin-group-meta">
                <span>{formatNumber(group.membersCount)} عضو</span>
                <span>{formatNumber(group.expensesCount)} هزینه</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid-two" style={{ marginTop: '0.75rem' }}>
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            صفحه قبل
          </button>
          <button className="btn btn-secondary" disabled={!groups?.hasNext} onClick={() => setPage((p) => p + 1)}>
            صفحه بعد
          </button>
        </div>
      </Card>
    </div>
  );
}
