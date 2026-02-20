'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppShell, Card, Placeholder } from '../components/ui';
import { getApiError, useAuthMe } from '../../lib/auth/hooks';
import { useInbox, useRespondInvitation } from '../../lib/inbox/hooks';
import { useRespondFriendRequest } from '../../lib/friends/hooks';
import { useAlert } from '../providers/alert-provider';

export default function InboxPage() {
  const { showAlert } = useAlert();
  const { data: me } = useAuthMe();
  const [page, setPage] = useState(1);
  const { data: messages, isLoading, isError } = useInbox(me?.id, page, 10);
  const acceptMutation = useRespondInvitation('accept');
  const declineMutation = useRespondInvitation('decline');
  const acceptFriendMutation = useRespondFriendRequest('accept');
  const declineFriendMutation = useRespondFriendRequest('decline');
  const [actionError, setActionError] = useState<string | null>(null);

  const isPending =
    acceptMutation.isPending ||
    declineMutation.isPending ||
    acceptFriendMutation.isPending ||
    declineFriendMutation.isPending;

  const onRespond = async (
    action: 'accept' | 'decline',
    groupId?: string,
    invitationId?: string,
  ) => {
    if (!me?.id || !groupId || !invitationId) return;

    setActionError(null);

    try {
      if (action === 'accept') {
        await acceptMutation.mutateAsync({
          groupId,
          invitationId,
          userId: me.id,
        });
        showAlert('دعوت پذیرفته شد.', 'success');
      } else {
        await declineMutation.mutateAsync({
          groupId,
          invitationId,
          userId: me.id,
        });
        showAlert('دعوت رد شد.', 'info');
      }
    } catch (error) {
      const msg = getApiError(error);
      setActionError(msg);
      showAlert(msg, 'error');
    }
  };

  const onRespondFriend = async (
    action: 'accept' | 'decline',
    requestId?: string,
  ) => {
    if (!me?.id || !requestId) return;
    setActionError(null);
    try {
      if (action === 'accept') {
        await acceptFriendMutation.mutateAsync({
          requestId,
          userId: me.id,
        });
        showAlert('درخواست دوستی پذیرفته شد.', 'success');
      } else {
        await declineFriendMutation.mutateAsync({
          requestId,
          userId: me.id,
        });
        showAlert('درخواست دوستی رد شد.', 'info');
      }
    } catch (error) {
      const msg = getApiError(error);
      setActionError(msg);
      showAlert(msg, 'error');
    }
  };

  return (
    <AppShell title="اینباکس" subtitle="دعوت‌ها و رویدادهای گروه">
      

      <Card title="پیام‌ها">
        {isLoading ? <p style={{ margin: 0 }}>در حال بارگذاری پیام‌ها...</p> : null}
        {isError ? <p style={{ margin: 0, color: '#dc2626' }}>خواندن اینباکس ناموفق بود.</p> : null}

        {!isLoading && !messages?.items.length ? (
          <Placeholder label="هنوز پیامی در اینباکس نداری." />
        ) : null}

        <div className="stack">
          {(messages?.items ?? []).map((msg) => {
            const invitationId = msg.meta?.invitationId;
            const inviteeId = msg.meta?.inviteeId;
            const friendRequestId = msg.meta?.friendRequestId;
            const canRespond =
              msg.type === 'INVITE_CREATED' &&
              Boolean(msg.groupId) &&
              Boolean(invitationId) &&
              inviteeId === me?.id;
            const canRespondFriend =
              msg.type === 'FRIEND_REQUEST_CREATED' && Boolean(friendRequestId);

            return (
              <div key={msg.id} className="card" style={{ marginTop: '0.75rem' }}>
                <p style={{ margin: 0 }}>{msg.message}</p>
                <p style={{ margin: '0.35rem 0 0', opacity: 0.7, fontSize: '0.85rem' }}>
                  {new Date(msg.createdAt).toLocaleString('fa-IR')}
                </p>

                {canRespond ? (
                  <div className="grid-two" style={{ marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={isPending}
                      onClick={() => onRespond('accept', msg.groupId, invitationId)}
                    >
                      قبول دعوت
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={isPending}
                      onClick={() => onRespond('decline', msg.groupId, invitationId)}
                    >
                      رد دعوت
                    </button>
                  </div>
                ) : null}
                {canRespondFriend ? (
                  <div className="grid-two" style={{ marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={isPending}
                      onClick={() => onRespondFriend('accept', friendRequestId)}
                    >
                      قبول دوستی
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={isPending}
                      onClick={() => onRespondFriend('decline', friendRequestId)}
                    >
                      رد دوستی
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="grid-two" style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
          >
            صفحه قبل
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPage((current) => current + 1)}
            disabled={!messages?.hasNext}
          >
            صفحه بعد
          </button>
        </div>
      </Card>

      {actionError ? <p style={{ margin: 0, color: '#dc2626' }}>{actionError}</p> : null}
    </AppShell>
  );
}
