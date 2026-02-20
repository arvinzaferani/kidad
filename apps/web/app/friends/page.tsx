'use client';

import { useState } from 'react';
import { AppShell, Card, Placeholder } from '../components/ui';
import { getApiError, useAuthMe } from '../../lib/auth/hooks';
import {
  useCreateFriendRequest,
  useFriends,
  useIncomingFriendRequests,
  useRemoveFriend,
  useRespondFriendRequest,
} from '../../lib/friends/hooks';
import { useAlert } from '../providers/alert-provider';

export default function FriendsPage() {
  const { data: me } = useAuthMe();
  const { showAlert } = useAlert();
  const [friendsPage, setFriendsPage] = useState(1);
  const [incomingPage, setIncomingPage] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data: friends, isLoading: friendsLoading } = useFriends(
    me?.id,
    friendsPage,
    10,
  );
  const { data: incoming, isLoading: incomingLoading } = useIncomingFriendRequests(
    me?.id,
    incomingPage,
    10,
  );

  const createMutation = useCreateFriendRequest();
  const acceptMutation = useRespondFriendRequest('accept');
  const declineMutation = useRespondFriendRequest('decline');
  const removeMutation = useRemoveFriend();

  const onAddFriend = async () => {
    if (!me?.id || !identifier.trim()) return;
    setError(null);
    setMessage(null);
    try {
      await createMutation.mutateAsync({
        requesterId: me.id,
        identifier: identifier.trim(),
      });
      setIdentifier('');
      const msg = 'درخواست دوستی ارسال شد.';
      setMessage(msg);
      showAlert(msg, 'success');
    } catch (err) {
      const msg = getApiError(err);
      setError(msg);
      showAlert(msg, 'error');
    }
  };

  const onRespond = async (action: 'accept' | 'decline', requestId: string) => {
    if (!me?.id) return;
    setError(null);
    try {
      if (action === 'accept') {
        await acceptMutation.mutateAsync({ requestId, userId: me.id });
        showAlert('درخواست دوستی پذیرفته شد.', 'success');
      } else {
        await declineMutation.mutateAsync({ requestId, userId: me.id });
        showAlert('درخواست دوستی رد شد.', 'info');
      }
    } catch (err) {
      const msg = getApiError(err);
      setError(msg);
      showAlert(msg, 'error');
    }
  };

  const onRemove = async (friendshipId: string) => {
    if (!me?.id) return;
    setError(null);
    try {
      await removeMutation.mutateAsync({ friendshipId, userId: me.id });
      showAlert('دوست حذف شد.', 'info');
    } catch (err) {
      const msg = getApiError(err);
      setError(msg);
      showAlert(msg, 'error');
    }
  };

  return (
    <AppShell title="دوستان" subtitle="مدیریت دوستان و درخواست‌های دوستی">
      <Card title="افزودن دوست">
        <div className="stack">
          <label className="label">ایمیل یا شماره موبایل</label>
          <input
            className="field"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="user@email.com یا 0912..."
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={onAddFriend}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'در حال ارسال...' : 'ارسال درخواست دوستی'}
          </button>
        </div>
      </Card>

      <Card title="درخواست‌های ورودی">
        {incomingLoading ? <p style={{ margin: 0 }}>در حال بارگذاری...</p> : null}
        {!incomingLoading && !incoming?.items.length ? (
          <Placeholder label="درخواست دوستی جدیدی نداری." />
        ) : null}
        <div className="stack">
          {(incoming?.items ?? []).map((request) => (
            <div key={request.id} className="card" style={{ marginTop: '0.75rem' }}>
              <p style={{ margin: 0 }}>{request.requester.nickname}</p>
              <p style={{ margin: '0.2rem 0 0', opacity: 0.7 }}>
                {request.requester.phone || request.requester.email || 'بدون اطلاعات تماس'}
              </p>
              <div className="grid-two" style={{ marginTop: '0.65rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                  onClick={() => onRespond('accept', request.id)}
                >
                  قبول
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                  onClick={() => onRespond('decline', request.id)}
                >
                  رد
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid-two" style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIncomingPage((p) => Math.max(1, p - 1))}
            disabled={incomingPage === 1}
          >
            صفحه قبل
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIncomingPage((p) => p + 1)}
            disabled={!incoming?.hasNext}
          >
            صفحه بعد
          </button>
        </div>
      </Card>

      <Card title="لیست دوستان">
        {friendsLoading ? <p style={{ margin: 0 }}>در حال بارگذاری...</p> : null}
        {!friendsLoading && !friends?.items.length ? (
          <Placeholder label="هنوز دوستی نداری." />
        ) : null}
        <div className="stack">
          {(friends?.items ?? []).map((friend) => (
            <div key={friend.friendshipId} className="member-row">
              <div className="member-main">
                <div className="member-avatar">
                  {friend.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={friend.user.avatarUrl} alt={friend.user.nickname} className="member-avatar-image" />
                  ) : (
                    friend.user.nickname.slice(0, 1)
                  )}
                </div>
                <div>
                  <p className="member-name">{friend.user.nickname}</p>
                  <p className="member-contact">
                    {friend.user.phone || friend.user.email || 'بدون اطلاعات تماس'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary member-settle-btn"
                disabled={removeMutation.isPending}
                onClick={() => onRemove(friend.friendshipId)}
              >
                حذف دوست
              </button>
            </div>
          ))}
        </div>
        <div className="grid-two" style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setFriendsPage((p) => Math.max(1, p - 1))}
            disabled={friendsPage === 1}
          >
            صفحه قبل
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setFriendsPage((p) => p + 1)}
            disabled={!friends?.hasNext}
          >
            صفحه بعد
          </button>
        </div>
      </Card>

      {message ? <p style={{ margin: 0, color: 'var(--accent)' }}>{message}</p> : null}
      {error ? <p style={{ margin: 0, color: '#dc2626' }}>{error}</p> : null}
    </AppShell>
  );
}
