'use client';

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ModalPortal } from '../components/modal-portal';
import { BrandLoader } from '../components/brand-loader';
import { getApiError, useAuthMe, useSetPassword } from '../../lib/auth/hooks';

interface AccountCompletionContextValue {
  openCompletion: (onComplete?: () => void) => void;
  closeCompletion: () => void;
}

const AccountCompletionContext = createContext<
  AccountCompletionContextValue | undefined
>(undefined);

export function AccountCompletionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const setPasswordMutation = useSetPassword();

  const openCompletion = useCallback((onComplete?: () => void) => {
    onCompleteRef.current = onComplete ?? null;
    setPassword('');
    setError(null);
    setOpen(true);
  }, []);

  const closeCompletion = useCallback(() => {
    setOpen(false);
    setError(null);
  }, []);

  const onSubmitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await setPasswordMutation.mutateAsync({ password });
      setOpen(false);
      setPassword('');
      const resume = onCompleteRef.current;
      onCompleteRef.current = null;
      resume?.();
    } catch (mutationError) {
      setError(getApiError(mutationError));
    }
  };

  return (
    <AccountCompletionContext.Provider value={{ openCompletion, closeCompletion }}>
      {children}
      {open ? (
        <ModalPortal>
          <div
            className="modal-root"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-completion-title"
          >
            <button
              type="button"
              className="modal-backdrop"
              aria-label="بستن"
              onClick={closeCompletion}
            />
            <div className="modal-card card">
              <div className="modal-header">
                <h2 id="account-completion-title" className="card-title">
                  حسابت رو کامل کن 🔐
                </h2>
                <button
                  type="button"
                  className="sidebar-close"
                  aria-label="بستن"
                  onClick={closeCompletion}
                >
                  ×
                </button>
              </div>
              <form onSubmit={onSubmitPassword} className="stack">
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  برای استفاده از این قابلیت، فقط لازمه یک رمز عبور برای حسابت
                  تنظیم کنی. اطلاعات دنگ‌ها و هزینه‌هات محفوظ می‌مونه.
                </p>

                <label className="label" htmlFor="completion-password">
                  رمز عبور جدید *
                </label>
                <input
                  id="completion-password"
                  type="password"
                  className="field"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="حداقل ۸ کاراکتر"
                  minLength={8}
                  required
                  autoFocus
                />

                {error ? (
                  <p style={{ margin: 0, color: '#dc2626', fontSize: '0.85rem' }}>
                    {error}
                  </p>
                ) : null}

                <div className="grid-two">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeCompletion}
                  >
                    فعلاً نه
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={setPasswordMutation.isPending}
                  >
                    {setPasswordMutation.isPending
                      ? 'در حال تنظیم...'
                      : 'تنظیم رمز عبور'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </AccountCompletionContext.Provider>
  );
}

export function useAccountCompletion() {
  const context = useContext(AccountCompletionContext);
  if (!context) {
    throw new Error(
      'useAccountCompletion must be used inside AccountCompletionProvider',
    );
  }
  return context;
}

export function RequireCompletedAccount({
  feature,
  children,
  loading,
}: {
  feature: string;
  children: ReactNode;
  loading?: ReactNode;
}) {
  const { data: me, isLoading } = useAuthMe();
  const { openCompletion } = useAccountCompletion();
  const incomplete = Boolean(me && me.status === 'ONBOARDING');

  useEffect(() => {
    if (incomplete) {
      openCompletion();
    }
  }, [incomplete, openCompletion]);

  if (isLoading) {
    return <>{loading ?? <BrandLoader />}</>;
  }

  if (!me || me.status === 'ONBOARDING') {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title-parent">
            <h2 className="card-title">قابلیت {feature}</h2>
          </div>
        </div>
        <div className="stack">
          <p style={{ margin: 0, textAlign: 'center' }}>
            برای استفاده از {feature} باید اول حساب‌ت رو کامل کنی.
          </p>
          <p style={{ margin: 0, textAlign: 'center', fontSize: '0.85rem', opacity: 0.7 }}>
            فقط کافیه یک رمز عبور برای حسابت تنظیم کنی؛ دنگ‌ها و هزینه‌هات محفوظ
            می‌مونن.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openCompletion()}
          >
            کامل کردن حساب
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}