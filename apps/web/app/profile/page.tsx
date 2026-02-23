'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { AppShell, Card } from '../components/ui';
import { getApiError, useAuthMe, useResendVerification } from '../../lib/auth/hooks';
import { useUpdateProfile } from '../../lib/users/hooks';
import { useAlert } from '../providers/alert-provider';

export default function ProfilePage() {
  const { data: me, isLoading } = useAuthMe();
  const updateProfileMutation = useUpdateProfile();
  const resendVerificationMutation = useResendVerification();
  const { showAlert } = useAlert();

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarName, setAvatarName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    setNickname(me.nickname ?? '');
    setEmail(me.email ?? '');
    setPhone(me.phone ?? '');
    setAvatarUrl(me.avatarUrl ?? '');
    setAvatarName('');
  }, [me]);

  const onUploadAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      const msg = 'فقط فایل تصویری قابل قبول است.';
      setError(msg);
      showAlert(msg, 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      const msg = 'حجم تصویر باید کمتر از ۲ مگابایت باشد.';
      setError(msg);
      showAlert(msg, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setAvatarUrl(result);
        setAvatarName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!me?.id) return;

    setMessage(null);
    setError(null);

    try {
      await updateProfileMutation.mutateAsync({
        id: me.id,
        nickname: nickname.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      setMessage('پروفایل با موفقیت ذخیره شد.');
      showAlert('پروفایل با موفقیت ذخیره شد.', 'success');
    } catch (submitError) {
      const msg = getApiError(submitError);
      setError(msg);
      showAlert(msg, 'error');
    }
  };

  const onResendVerification = async () => {
    if (!email.trim()) {
      const msg = 'ابتدا ایمیل را وارد کن.';
      setError(msg);
      showAlert(msg, 'error');
      return;
    }

    setError(null);
    setMessage(null);
    try {
      await resendVerificationMutation.mutateAsync({ email: email.trim() });
      const msg =
        'اگر ایمیل ثبت شده باشد، لینک تایید ارسال شد. اگر در Inbox نبود، پوشه Spam را بررسی کن.';
      setMessage(msg);
      showAlert(msg, 'success');
    } catch (submitError) {
      const msg = getApiError(submitError);
      setError(msg);
      showAlert(msg, 'error');
    }
  };

  return (
    <AppShell title="پروفایل" subtitle="مدیریت اطلاعات شخصی و آواتار">
      <Card title="اطلاعات حساب کاربری">
        {isLoading ? <p style={{ margin: 0 }}>در حال بارگذاری اطلاعات...</p> : null}
        {!isLoading && me ? (
          <form onSubmit={onSubmit} className="stack">
            <div className="profile-preview">
              <div className="profile-avatar">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={nickname || 'avatar'} className="profile-avatar-image" />
                ) : (
                  (nickname || 'U').slice(0, 1)
                )}
              </div>
              <div>
                <p className="member-name">{nickname || 'بدون نام'}</p>
                <p className="member-contact">{phone || email || 'بدون اطلاعات تماس'}</p>
              </div>
            </div>

            <label className="label">نام نمایشی</label>
            <input
              className="field"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="نام شما"
              required
            />

            <label className="label">ایمیل</label>
            <input
              className="field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="you@example.com"
            />
            {email.trim() ? (
              <p style={{ margin: '-0.5rem 0 0', fontSize: '0.8rem', opacity: 0.75 }}>
                وضعیت ایمیل: {me?.isEmailVerified ? 'تایید شده' : 'تایید نشده'}
              </p>
            ) : null}
            {!me?.isEmailVerified && email.trim() ? (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={resendVerificationMutation.isPending}
                onClick={onResendVerification}
              >
                {resendVerificationMutation.isPending
                  ? 'در حال ارسال...'
                  : 'ارسال لینک تایید ایمیل'}
              </button>
            ) : null}

            <label className="label">شماره موبایل</label>
            <input
              className="field"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0912xxxxxxx"
            />

            <label className="label">آپلود آواتار</label>
            <input className="field" type="file" accept="image/*" onChange={onUploadAvatar} />
            {avatarName ? (
              <p style={{ margin: '-0.5rem 0 0', fontSize: '0.8rem', opacity: 0.75 }}>
                فایل انتخاب‌شده: {avatarName}
              </p>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setAvatarUrl('');
                setAvatarName('');
              }}
            >
              حذف آواتار
            </button>

            <button type="submit" className="btn btn-primary" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </form>
        ) : null}
      </Card>

      {message ? <div className="notice notice-success">{message}</div> : null}
      {error ? <div className="notice notice-error">{error}</div> : null}
    </AppShell>
  );
}
