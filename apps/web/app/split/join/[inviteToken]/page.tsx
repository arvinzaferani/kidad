'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell, Card } from '../../../components/ui';
import { getAuthToken } from '../../../../lib/auth/token';
import { getApiError } from '../../../../lib/auth/hooks';
import {
  useJoinSplit,
  useSplitInviteInfo,
} from '../../../../lib/split/hooks';

export default function SplitJoinPage() {
  const params = useParams<{ inviteToken: string }>();
  const inviteToken = params?.inviteToken ?? '';
  const isAuthed = Boolean(getAuthToken());

  const { data: invite, isLoading, isError } = useSplitInviteInfo(inviteToken);
  const joinMutation = useJoinSplit(inviteToken);

  const [joinError, setJoinError] = useState<string | null>(null);
  const joinedSessionId = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthed || !invite || joinMutation.isPending) return;
    if (joinedSessionId.current) return;
    setJoinError(null);
    joinMutation
      .mutateAsync()
      .then((session) => {
        joinedSessionId.current = session.id;
        window.location.href = `/split/${session.id}`;
      })
      .catch((error) => {
        setJoinError(getApiError(error));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, invite, joinMutation.isPending]);

  const sessionClosed =
    invite &&
    (invite.status === 'CLOSED' ||
      invite.status === 'COMPLETED' ||
      invite.status === 'CANCELLED');

  return (
    <AppShell
      title="پیوستن به اسپلیت"
      subtitle={invite?.title ?? 'دعوت به یک جلسهٔ اسپلیت'}
    >
      <Card>
        {isLoading ? (
          <div className="placeholder">در حال بررسی دعوتنامه...</div>
        ) : isError || !invite ? (
          <div className="notice notice-error">
            این دعوتنامه نامعتبر است یا دیگر فعال نیست.
          </div>
        ) : sessionClosed ? (
          <div className="notice notice-error">
            این اسپلیت دیگر اعضای جدید نمی‌پذیرد.
          </div>
        ) : !isAuthed ? (
          <div className="stack">
            <p style={{ margin: 0, textAlign: 'center' }}>
              <strong>{invite.host.nickname}</strong> تو را به یک جلسهٔ اسپلیت
              دعوت کرده است.
            </p>
            <p className="field-hint" style={{ textAlign: 'center' }}>
              هم‌اکنون {invite.memberCount} نفر عضو این جلسه‌اند.
            </p>
            {joinError ? (
              <div className="notice notice-error">{joinError}</div>
            ) : null}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                window.location.href = `/login?next=${encodeURIComponent(
                  `/split/join/${inviteToken}`,
                )}`;
              }}
            >
              ورود یا ثبت‌نام برای پیوستن
            </button>
          </div>
        ) : (
          <div className="stack">
            <p style={{ margin: 0, textAlign: 'center' }}>
              در حال پیوستن به جلسهٔ <strong>{invite.host.nickname}</strong>...
            </p>
            {joinError ? (
              <div className="notice notice-error">{joinError}</div>
            ) : null}
            <button
              type="button"
              className="btn btn-primary"
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? 'در حال پیوستن...' : 'منتظر بمانید...'}
            </button>
          </div>
        )}
      </Card>
    </AppShell>
  );
}