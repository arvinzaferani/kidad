'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell, Card } from '../../../components/ui';
import { ModalPortal } from '../../../components/modal-portal';
import { BrandLoader } from '../../../components/brand-loader';
import { getAuthToken } from '../../../../lib/auth/token';
import {
  getApiError,
  useSendLoginLink,
} from '../../../../lib/auth/hooks';
import {
  useGuestJoinSplit,
  useJoinSplit,
  useSplitInviteInfo,
} from '../../../../lib/split/hooks';

export default function SplitJoinPage() {
  const params = useParams<{ inviteToken: string }>();
  const inviteToken = params?.inviteToken ?? '';
  const isAuthed = Boolean(getAuthToken());

  const { data: invite, isLoading, isError } = useSplitInviteInfo(inviteToken);
  const joinMutation = useJoinSplit(inviteToken);
  const guestJoinMutation = useGuestJoinSplit(inviteToken);
  const sendLoginLinkMutation = useSendLoginLink();

  const [joinError, setJoinError] = useState<string | null>(null);
  const joinedSessionId = useRef<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [guestError, setGuestError] = useState<string | null>(null);
  const [magicLinkEmail, setMagicLinkEmail] = useState<string | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(
    () => typeof window === 'undefined' ? false : !getAuthToken(),
  );

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

  const onSubmitGuest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuestError(null);
    setMagicLinkEmail(null);
    try {
      const result = await guestJoinMutation.mutateAsync({
        nickname: name.trim(),
        email: email.trim(),
      });
      if (result.requiresMagicLink) {
        await sendLoginLinkMutation.mutateAsync({
          email: email.trim(),
          next: `/split/join/${inviteToken}`,
        });
        setMagicLinkEmail(email.trim());
        return;
      }
      if (result.session) {
        window.location.href = `/split/${result.session.id}`;
      }
    } catch (mutationError) {
      setGuestError(getApiError(mutationError));
    }
  };

  const showJoinModal =
    !isLoading && !isError && invite && !sessionClosed && !isAuthed && onboardingOpen;

  return (
    <AppShell
      title="پیوستن به دنگ"
      subtitle={invite?.title ?? 'دعوت به یک جلسهٔ اسپلیت'}
    >
      <Card>
        {isLoading ? (
          <BrandLoader label="در حال بررسی دعوتنامه..." />
        ) : isError || !invite ? (
          <div className="notice notice-error">
            این دعوتنامه نامعتبر است یا دیگر فعال نیست.
          </div>
        ) : sessionClosed ? (
          <div className="notice notice-error">
            این اسپلیت دیگر اعضای جدید نمی‌پذیرد.
          </div>
        ) : isAuthed ? (
          <div className="stack">
            <p style={{ margin: 0, textAlign: 'center' }}>
              در حال پیوستن به جلسهٔ <strong>{invite.host.nickname}</strong>...
            </p>
            {joinError ? (
              <div className="notice notice-error">{joinError}</div>
            ) : null}
          </div>
        ) : (
          <div className="stack" style={{ textAlign: 'center' }}>
            <p style={{ margin: 0 }}>
              <strong>{invite.host.nickname}</strong> تو را به یک جلسهٔ دنگ
              دعوت کرده است.
            </p>
            <p className="field-hint" style={{ margin: 0 }}>
              هم‌اکنون {invite.memberCount} نفر عضو این جلسه‌اند.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setOnboardingOpen(true)}
            >
              خودت رو معرفی کن و بپیوند
            </button>
          </div>
        )}
      </Card>

      {showJoinModal ? (
        <ModalPortal>
          <div
            className="modal-root"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
          >
            <button
              type="button"
              className="modal-backdrop"
              aria-label="بستن"
              onClick={() => {
                setOnboardingOpen(false);
                setMagicLinkEmail(null);
              }}
            />
            <div className="modal-card card">
              {magicLinkEmail ? (
                <>
                  <div className="modal-header">
                    <h2 id="onboarding-title" className="card-title">
                      ایمیل قبلاً ثبت شده ✉️
                    </h2>
                    <button
                      type="button"
                      className="sidebar-close"
                      aria-label="بستن"
                      onClick={() => {
                        setMagicLinkEmail(null);
                        setEmail('');
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="stack">
                    <p style={{ margin: 0 }}>
                      این ایمیل قبلاً یک حساب کاربری داره. لینک ورود به ایمیل
                      فرستادیم — از طریق اون وارد شو و دوباره از همین لینک دعوت
                      بیا تا به دنگ اضافه بشی.
                    </p>
                    <p
                      className="field-hint"
                      style={{ margin: 0, textAlign: 'center' }}
                    >
                      پوشه Spam را هم بررسی کن.
                    </p>
                    {guestError ? (
                      <div className="notice notice-error">{guestError}</div>
                    ) : null}
                    <a
                      className="btn btn-primary"
                      href={`/login?next=${encodeURIComponent(
                        `/split/join/${inviteToken}`,
                      )}`}
                    >
                      ورود با رمز عبور
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div className="modal-header">
                    <h2 id="onboarding-title" className="card-title">
                      برای پیوستن، خودت رو معرفی کن 👋
                    </h2>
                    <button
                      type="button"
                      className="sidebar-close"
                      aria-label="بستن"
                      onClick={() => setOnboardingOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={onSubmitGuest} className="stack">
                    <p style={{ margin: 0, color: 'var(--muted)' }}>
                      فقط اسمت و ایمیلت رو وارد کن تا به این دنگ اضافه بشی.
                    </p>

                    <label className="label" htmlFor="onboarding-name">
                      نام *
                    </label>
                    <input
                      id="onboarding-name"
                      type="text"
                      className="field"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="مثلاً امیر"
                      maxLength={60}
                      required
                      autoFocus
                    />

                    <label className="label" htmlFor="onboarding-email">
                      ایمیل *
                    </label>
                    <input
                      id="onboarding-email"
                      type="email"
                      className="field"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@email.com"
                      required
                    />

                    {guestError ? (
                      <div className="notice notice-error">{guestError}</div>
                    ) : null}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={guestJoinMutation.isPending}
                    >
                      {guestJoinMutation.isPending
                        ? 'در حال پیوستن...'
                        : 'پیوستن به دنگ'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </AppShell>
  );
}