'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell, Card, Placeholder } from '../../components/ui';
import { StaggerItem } from '../../components/page-transition';
import { ClockIcon } from '../../components/icons';
import { useAuthMe } from '../../../lib/auth/hooks';
import { getApiError } from '../../../lib/auth/hooks';
import { useAlert } from '../../providers/alert-provider';
import {
  AddSplitExpensePayload,
  SplitType,
  useAddSplitExpense,
  useCloseSplitSession,
  useSplitSession,
} from '../../../lib/split/hooks';
import { SplitQr } from '../../components/split-qr';
import { ArrowRightLeft, CheckIcon, CopyIcon, Users } from 'lucide-react';

const splitTypes: Array<{ value: SplitType; label: string }> = [
  { value: 'EQUAL', label: 'مساوی' },
  { value: 'EXACT', label: 'مبلغ دقیق' },
  { value: 'PERCENT', label: 'درصدی' },
  { value: 'SHARE', label: 'سهمی' },
];

const splitTypeLabels: Record<SplitType, string> = {
  EQUAL: 'مساوی',
  EXACT: 'دقیق',
  PERCENT: 'درصدی',
  SHARE: 'سهمی',
};

const formatMoney = (value: number, currency: 'TOMAN' | 'RIAL') =>
  `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} ${currency === 'TOMAN' ? 'تومان' : 'ریال'}`;

const toEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

const sanitizeNumericInput = (s: string) =>
  toEnglishDigits(s).replace(/[,\u066C]/g, '').replace(/[^\d.]/g, '');

const formatNumericInput = (s: string) => {
  const cleaned = sanitizeNumericInput(s);
  if (!cleaned) return '';
  const [intPart, decPart] = cleaned.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${grouped}.${decPart.slice(0, 2)}` : grouped;
};

const parseNumericInput = (s: string) => {
  const n = Number(sanitizeNumericInput(s));
  return Number.isFinite(n) ? n : NaN;
};

export default function SplitSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { data: me } = useAuthMe();
  const { showAlert } = useAlert();
  const { data: session, isLoading, isError } = useSplitSession(sessionId);
  const closeSessionMutation = useCloseSplitSession(sessionId);
  const addExpenseMutation = useAddSplitExpense(sessionId);

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [paidByMemberIds, setPaidByMemberIds] = useState<Record<string, boolean>>({});
  const [memberSelection, setMemberSelection] = useState<Record<string, boolean>>({});
  const [memberValues, setMemberValues] = useState<Record<string, string>>({});

  const members = session?.members ?? [];
  const myUserId = me?.id;

  const selectedMemberIds = useMemo(() => {
    if (!members.length) return [];
    const defaultsMissing = Object.keys(memberSelection).length === 0;
    if (defaultsMissing) return members.map((m) => m.id);
    return members.filter((m) => memberSelection[m.id] !== false).map((m) => m.id);
  }, [members, memberSelection]);

  const selectedPayerMemberIds = useMemo(() => {
    if (!members.length) return [];
    const defaultsMissing = Object.keys(paidByMemberIds).length === 0;
    if (defaultsMissing) {
      const you = members.find((m) => m.isYou);
      return you ? [you.id] : members.length ? [members[0].id] : [];
    }
    return members.filter((m) => paidByMemberIds[m.id] === true).map((m) => m.id);
  }, [members, paidByMemberIds]);

  const totalAmount = parseNumericInput(expenseAmount);

  const onToggleMember = (id: string) =>
    setMemberSelection((prev) => ({ ...prev, [id]: prev[id] === false ? true : false }));

  const onTogglePayer = (id: string) =>
    setPaidByMemberIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const onAddExpense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session || !members.length) return;

    setFormError(null);
    const amount = parseNumericInput(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('مبلغ معتبر وارد کن.');
      return;
    }
    if (!expenseDescription.trim()) {
      setFormError('عنوان هزینه را وارد کن.');
      return;
    }
    if (!selectedPayerMemberIds.length) {
      setFormError('حداقل یک پرداخت‌کننده انتخاب کن.');
      return;
    }
    if (!selectedMemberIds.length) {
      setFormError('حداقل یک نفر برای تقسیم انتخاب کن.');
      return;
    }

    const payerAmount = Math.round(amount / selectedPayerMemberIds.length);

    const payers = selectedPayerMemberIds.map((mid, i) => ({
      memberId: mid,
      amount:
        i === selectedPayerMemberIds.length - 1
          ? amount - payerAmount * (selectedPayerMemberIds.length - 1)
          : payerAmount,
    }));

    let splits: AddSplitExpensePayload['splits'] | undefined;

    if (splitType !== 'EQUAL') {
      splits = selectedMemberIds.map((mid) => ({
        memberId: mid,
        value: parseNumericInput(memberValues[mid] || ''),
      }));
      if (splits.some((s) => !Number.isFinite(s.value) || s.value <= 0)) {
        setFormError('برای نوع تقسیم انتخابی، مقدار معتبر برای همه اعضا وارد کن.');
        return;
      }
    }

    try {
      await addExpenseMutation.mutateAsync({
        description: expenseDescription.trim(),
        amount,
        currency: 'TOMAN',
        splitType,
        payers,
        splits,
      });
      setExpenseDescription('');
      setExpenseAmount('');
      setSplitType('EQUAL');
      setPaidByMemberIds({});
      setMemberSelection({});
      setMemberValues({});
      setFormOpen(false);
      showAlert('هزینه ثبت شد.', 'success');
    } catch (err) {
      const msg = getApiError(err);
      setFormError(msg);
      showAlert(msg, 'error');
    }
  };

  const onClose = async () => {
    setFormError(null);
    try {
      await closeSessionMutation.mutateAsync();
      showAlert('جلسه بسته شد.', 'success');
    } catch (err) {
      const msg = getApiError(err);
      setFormError(msg);
      showAlert(msg, 'error');
    }
  };

  const copyLink = () => {
    if (!session?.inviteToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/split/join/${session.inviteToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const balanceClass = (amount: number) =>
    amount > 0.01 ? 'settlement-credit' : amount < -0.01 ? 'settlement-debit' : 'settlement-clear';

  const balanceLabel = (amount: number) =>
    amount > 0.01
      ? `طلب: ${formatMoney(amount, 'TOMAN')}`
      : amount < -0.01
        ? `بدهی: ${formatMoney(Math.abs(amount), 'TOMAN')}`
        : 'تسویه';

  return (
    <AppShell title={session?.title ?? 'اسپلیت سریع'} subtitle={isLoading ? 'در حال بارگذاری...' : session ? `${session.status === 'ACTIVE' ? 'فعال' : 'بسته‌شده'} • ${members.length} عضو` : undefined}>
      {isLoading ? (
        <div className="stack">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      ) : isError || !session ? (
        <Card title="خطا">
          <p style={{ margin: 0, color: '#dc2626' }}>خواندن جلسه ناموفق بود.</p>
        </Card>
      ) : (
        <>
          {session.status === 'ACTIVE' && session.isHost ? (
            <Card
              title="دعوت دوستان"
              icon={<CopyIcon size={16} />}
              headerAction={
                <button
                  type="button"
                  className="btn btn-secondary member-settle-btn"
                  onClick={onClose}
                  disabled={closeSessionMutation.isPending}
                >
                  {closeSessionMutation.isPending ? '...' : 'بستن دعوت'}
                </button>
              }
            >
              <div className="stack-qr">
                <SplitQr value={session.inviteToken} />
                <div className="grid-two">
                  <button type="button" className="btn btn-primary" onClick={copyLink}>
                    {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    {copied ? 'کپی شد!' : 'کپی لینک'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (!navigator.share) {
                        copyLink();
                        return;
                      }
                      navigator.share({
                        title: session.title || 'اسپلیت سریع',
                        text: `به اسپلیت «${session.title || 'اسپلیت سریع'}» بپیوندید`,
                        url: `${window.location.origin}/split/join/${session.inviteToken}`,
                      });
                    }}
                  >
                    اشتراک‌گذاری
                  </button>
                </div>
              </div>
            </Card>
          ) : null}

          <Card title="مانده‌ها" icon={<ArrowRightLeft />}>
            {session.balances.length === 0 ? (
              <Placeholder label="هنوز هزینه‌ای ثبت نشده." />
            ) : (
              <div className="member-list">
                {session.balances.map((b, i) => (
                  <StaggerItem key={b.memberId} index={i} className="member-row">
                    <div className="member-main">
                      <div className="members-cred">
                        <div className="member-avatar">{b.nickname?.slice(0, 1) || '?'}</div>
                        <div>
                          <p className="member-name">
                            {b.nickname}
                            {b.userId === myUserId ? <span className="you-badge">شما</span> : null}
                          </p>
                        </div>
                      </div>
                      <span className={`settlement-pill ${balanceClass(b.amount)}`}>
                        {balanceLabel(b.amount)}
                      </span>
                    </div>
                  </StaggerItem>
                ))}
              </div>
            )}
          </Card>

          <Card title="اعضا" icon={<Users size={16} />}>
            <div className="member-list">
              {members.map((m, i) => (
                <StaggerItem key={m.id} index={i} className="member-row">
                  <div className="member-main">
                    <div className="members-cred">
                      <div className="member-avatar">{m.nickname?.slice(0, 1) || '?'}</div>
                      <div>
                        <p className="member-name">
                          {m.nickname}
                          {m.isHost ? <span className="you-badge">میزبان</span> : null}
                          {m.isYou ? <span className="you-badge">شما</span> : null}
                        </p>
                        <p className="member-contact">
                          <ClockIcon size={11} />
                          {' '}
                          {new Date(m.joinedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </Card>

          <Card
            title="هزینه‌ها"
            icon={<ClipboardListIcon />}
            headerAction={
              session.status === 'ACTIVE' && session.isHost ? (
                <button type="button" className="btn btn-secondary member-settle-btn" onClick={() => setFormOpen(true)}>
                  افزودن هزینه +
                </button>
              ) : null
            }
          >
            {session.expenses.length === 0 ? (
              <Placeholder label="هنوز هزینه‌ای ثبت نشده." />
            ) : (
              <div className="stack">
                {session.expenses.map((ex, i) => {
                  const splitCount = ex.participants.length;
                  const splitLabel = splitTypeLabels[ex.splitType] ?? `${splitCount} نفر`;
                  return (
                    <StaggerItem key={ex.id} index={i} className="expense-story">
                      <p className="expense-story-text">
                        <span className="expense-story-payer">{ex.payers.map((p) => p.nickname || 'کاربر').join(' و ')}</span>
                        {' '}با مبلغ{' '}
                        <span className="expense-story-amount">{formatMoney(ex.amount, ex.currency)}</span>
                        {' '}برای <strong>{ex.description}</strong> پرداخت کرد.{' '}
                        تقسیم {splitCount === 1 ? 'نشده' : `به ${splitLabel === 'مساوی' ? `صورت ${splitLabel}` : `روش ${splitLabel}`} بین ${splitCount} نفر`}.
                      </p>
                      <div className="expense-story-meta">
                        <ClockIcon size={12} />
                        <span>{new Date(ex.createdAt).toLocaleDateString('fa-IR-u-ca-persian')}</span>
                        {ex.payers.length > 1 ? (
                          <span>• {ex.payers.length} پرداخت‌کننده</span>
                        ) : null}
                      </div>
                    </StaggerItem>
                  );
                })}
              </div>
            )}
          </Card>

          {formOpen && session.status === 'ACTIVE' && session.isHost ? (
            <div className="bottom-sheet-root" role="dialog" aria-modal="true" aria-labelledby="add-expense-title">
              <button type="button" className="bottom-sheet-backdrop" aria-label="بستن" onClick={() => setFormOpen(false)} />
              <div className="bottom-sheet">
                <div className="bottom-sheet-handle" />
                <h2 id="add-expense-title" className="bottom-sheet-title">هزینه جدید</h2>
                <form onSubmit={onAddExpense} className="stack">
                  <label className="label">عنوان هزینه</label>
                  <input
                    className="field"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    placeholder="مثلاً خرید مواد غذایی"
                    required
                  />

                  <label className="label">مبلغ (تومان)</label>
                  <input
                    className="field"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(formatNumericInput(e.target.value))}
                    type="text"
                    inputMode="decimal"
                    placeholder="مثلاً 1,250,000"
                    required
                  />

                  <label className="label">روش تقسیم</label>
                  <select
                    className="field"
                    value={splitType}
                    onChange={(e) => setSplitType(e.target.value as SplitType)}
                  >
                    {splitTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  <div className="stack">
                    <label className="label">چه کسی پرداخت کرد؟ (امکان انتخاب چند نفر)</label>
                    {members.map((m) => (
                      <label key={m.id} className="split-check">
                        <input
                          type="checkbox"
                          checked={selectedPayerMemberIds.includes(m.id)}
                          onChange={() => onTogglePayer(m.id)}
                        />
                        <span>{m.nickname}</span>
                      </label>
                    ))}
                  </div>

                  {selectedPayerMemberIds.length > 1 && Number.isFinite(totalAmount) && totalAmount > 0 ? (
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>
                      هر نفر: {formatMoney(Math.round(totalAmount / selectedPayerMemberIds.length), 'TOMAN')}
                    </p>
                  ) : null}

                  <label className="label">بین چه کسانی تقسیم شود؟</label>
                  <div className="split-grid">
                    {members.map((m) => {
                      const selected = selectedMemberIds.includes(m.id);
                      return (
                        <div key={m.id} className="split-row">
                          <label className="split-check">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => onToggleMember(m.id)}
                            />
                            <span>{m.nickname}</span>
                          </label>
                          {splitType !== 'EQUAL' && selected ? (
                            <input
                              className="field split-value"
                              type="text"
                              inputMode="decimal"
                              value={memberValues[m.id] || ''}
                              onChange={(e) =>
                                setMemberValues((prev) => ({ ...prev, [m.id]: formatNumericInput(e.target.value) }))
                              }
                              placeholder={
                                splitType === 'PERCENT' ? '%' : splitType === 'SHARE' ? 'سهم' : 'مبلغ'
                              }
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {formError ? <p style={{ margin: 0, color: '#dc2626', fontSize: '0.85rem' }}>{formError}</p> : null}

                  <div className="grid-two">
                    <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>
                      انصراف
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={addExpenseMutation.isPending}>
                      {addExpenseMutation.isPending ? 'در حال ثبت...' : 'ثبت هزینه'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

function ClipboardListIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}