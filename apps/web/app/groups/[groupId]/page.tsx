'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { AppShell, Card, Placeholder } from '../../components/ui';
import { DateTimePicker } from '../../components/date-time-picker';
import { getApiError, useAuthMe } from '../../../lib/auth/hooks';
import {
  CreateSettlementPayload,
  GroupMemberSummary,
  SplitType,
  useAddFriendToGroup,
  useCreateSettlement,
  useCreateExpense,
  useGroup,
  useGroupExpenses,
  useInviteToGroup,
  useSettleSettlement,
  useSettlements,
} from '../../../lib/groups/hooks';
import { useFriends } from '../../../lib/friends/hooks';
import { useAlert } from '../../providers/alert-provider';

interface GroupPageProps {
  params: { groupId: string };
}

const splitTypes: Array<{ value: SplitType; label: string }> = [
  { value: 'EQUAL', label: 'مساوی' },
  { value: 'EXACT', label: 'مبلغ دقیق' },
  { value: 'PERCENT', label: 'درصدی' },
  { value: 'SHARE', label: 'سهمی' },
];

const formatMoney = (value: number, currency: 'TOMAN' | 'RIAL') =>
  `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} ${currency === 'TOMAN' ? 'تومان' : 'ریال'}`;

const toEnglishDigits = (value: string) =>
  value.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

const sanitizeNumericInput = (value: string) =>
  toEnglishDigits(value).replace(/[,\u066C]/g, '').replace(/[^\d.]/g, '');

const formatNumericInput = (value: string) => {
  const cleaned = sanitizeNumericInput(value);
  if (!cleaned) return '';
  const [intPart, decimalPart] = cleaned.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (decimalPart !== undefined) {
    return `${grouped}.${decimalPart.slice(0, 2)}`;
  }
  return grouped;
};

const parseNumericInput = (value: string) => {
  const normalized = sanitizeNumericInput(value);
  if (!normalized) return NaN;
  return Number(normalized);
};

const pad2 = (value: number) => String(value).padStart(2, '0');

const toDateTimeLocalValue = (date: Date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function getSettlementBadge(member: GroupMemberSummary, currency: 'TOMAN' | 'RIAL') {
  if (member.settlement.status === 'CLEAR') {
    return <span className="settlement-pill settlement-clear"> تسویه شده</span>;
  }
  if (member.settlement.status === 'CREDIT') {
    return (
      <span className="settlement-pill settlement-credit">
        طلب: {formatMoney(member.settlement.amount, currency)}
      </span>
    );
  }
  return (
    <span className="settlement-pill settlement-debit">
      بدهی: {formatMoney(member.settlement.amount, currency)}
    </span>
  );
}

export default function GroupPage({ params }: GroupPageProps) {
  const { showAlert } = useAlert();
  const { data: me } = useAuthMe();
  const { data: group, isLoading, isError } = useGroup(params.groupId, me?.id);
  const createExpenseMutation = useCreateExpense();
  const createSettlementMutation = useCreateSettlement();
  const addFriendToGroupMutation = useAddFriendToGroup();
  const settleSettlementMutation = useSettleSettlement();
  const inviteMutation = useInviteToGroup();
  const [expensesPage, setExpensesPage] = useState(1);
  const [settlementsPage, setSettlementsPage] = useState(1);
  const [friendPicker, setFriendPicker] = useState('');
  const { data: settlements } = useSettlements(params.groupId, settlementsPage, 8);
  const { data: expenses } = useGroupExpenses(params.groupId, expensesPage, 8);
  const { data: friends, isError: isFriendsError } = useFriends(me?.id, 1, 100);

  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDateTime, setExpenseDateTime] = useState(() =>
    toDateTimeLocalValue(new Date()),
  );
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [memberSelection, setMemberSelection] = useState<Record<string, boolean>>({});
  const [memberValues, setMemberValues] = useState<Record<string, string>>({});

  const members = group?.members ?? [];
  const myMember = members.find((member) => member.userId === me?.id);
  const groupMemberIds = new Set(members.map((member) => member.userId));
  const availableFriends = (friends?.items ?? []).filter(
    (friend) => !groupMemberIds.has(friend.user.id),
  );

  const selectedMemberIds = useMemo(() => {
    if (!members.length) return [];
    const defaultsMissing = Object.keys(memberSelection).length === 0;
    if (defaultsMissing) {
      return members.map((member) => member.userId);
    }
    return members
      .filter((member) => memberSelection[member.userId] !== false)
      .map((member) => member.userId);
  }, [members, memberSelection]);

  const onToggleMember = (userId: string) => {
    setMemberSelection((prev) => ({
      ...prev,
      [userId]: !(prev[userId] !== false),
    }));
  };

  const onInvite = async () => {
    if (!me?.id || !group?.id) return;
    const identifier = inviteIdentifier.trim();
    if (!identifier) return;

    setInviteMessage(null);
    setFormError(null);
    try {
      await inviteMutation.mutateAsync({
        groupId: group.id,
        inviterId: me.id,
        identifier,
      });
      setInviteIdentifier('');
      setInviteMessage('دعوت ارسال شد.');
      showAlert('دعوت ارسال شد.', 'success');
    } catch (error) {
      const msg = getApiError(error);
      setFormError(msg);
      showAlert(msg, 'error');
    }
  };

  const onAddExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!group || !members.length) return;

    setFormError(null);
    const amount = parseNumericInput(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('مبلغ معتبر وارد کن.');
      return;
    }

    const pickedDate = new Date(expenseDateTime);
    if (Number.isNaN(pickedDate.getTime())) {
      setFormError('تاریخ و زمان معتبر انتخاب کن.');
      return;
    }
    if (!paidBy) {
      setFormError('پرداخت‌کننده را انتخاب کن.');
      return;
    }
    if (!selectedMemberIds.length) {
      setFormError('حداقل یک عضو برای تقسیم انتخاب کن.');
      return;
    }

    const splits =
      splitType === 'EQUAL'
        ? selectedMemberIds.map((userId) => ({ userId, value: 1 }))
        : selectedMemberIds.map((userId) => ({
            userId,
            value: parseNumericInput(memberValues[userId] || ''),
          }));

    if (splitType !== 'EQUAL' && splits.some((split) => split.value <= 0 || !Number.isFinite(split.value))) {
      setFormError('برای نوع تقسیم انتخابی، مقدار معتبر برای همه اعضا وارد کن.');
      return;
    }

    try {
      await createExpenseMutation.mutateAsync({
        groupId: group.id,
        description: expenseDescription.trim(),
        amount,
        currency: group.currency,
        splitType,
        date: pickedDate.toISOString(),
        payers: [{ userId: paidBy, amount }],
        splits,
      });
      setExpenseDescription('');
      setExpenseAmount('');
      setMemberValues({});
      setSplitType('EQUAL');
      setExpenseDateTime(toDateTimeLocalValue(new Date()));
      showAlert('هزینه ثبت شد.', 'success');
    } catch (error) {
      const msg = getApiError(error);
      setFormError(msg);
      showAlert(msg, 'error');
    }
  };

  const getSettlePayloadForMember = (member: GroupMemberSummary): CreateSettlementPayload | null => {
    if (!group || !myMember || !me?.id || member.userId === me.id) return null;

    if (myMember.settlement.status === 'DEBIT' && member.settlement.status === 'CREDIT') {
      const amount = Math.min(myMember.settlement.amount, member.settlement.amount);
      if (amount > 0) {
        return {
          groupId: group.id,
          payerId: me.id,
          receiverId: member.userId,
          amount,
          method: 'CASH',
          status: 'SETTLED',
        };
      }
    }

    if (myMember.settlement.status === 'CREDIT' && member.settlement.status === 'DEBIT') {
      const amount = Math.min(myMember.settlement.amount, member.settlement.amount);
      if (amount > 0) {
        return {
          groupId: group.id,
          payerId: member.userId,
          receiverId: me.id,
          amount,
          method: 'CASH',
          status: 'SETTLED',
        };
      }
    }

    return null;
  };

  const settleWithMember = async (member: GroupMemberSummary) => {
    const payload = getSettlePayloadForMember(member);
    if (!payload) {
      setFormError('برای این کاربر امکان تسویه مستقیم وجود ندارد.');
      return;
    }

    setFormError(null);
    try {
      await createSettlementMutation.mutateAsync(payload);
      showAlert('تسویه انجام شد.', 'success');
    } catch (error) {
      const msg = getApiError(error);
      setFormError(msg);
      showAlert(msg, 'error');
    }
  };

  const onSettlePending = async (settlementId: string) => {
    setFormError(null);
    try {
      await settleSettlementMutation.mutateAsync({
        id: settlementId,
        groupId: params.groupId,
      });
      showAlert('وضعیت پرداخت ثبت شد.', 'success');
    } catch (error) {
      const msg = getApiError(error);
      setFormError(msg);
      showAlert(msg, 'error');
    }
  };

  const onAddFriendToGroup = async () => {
    if (!me?.id || !group?.id || !friendPicker) return;
    setFormError(null);
    try {
      await addFriendToGroupMutation.mutateAsync({
        groupId: group.id,
        actorId: me.id,
        friendId: friendPicker,
      });
      setFriendPicker('');
      showAlert('دوست به گروه اضافه شد.', 'success');
    } catch (error) {
      const msg = getApiError(error);
      setFormError(msg);
      showAlert(msg, 'error');
    }
  };

  return (
    <AppShell title={group?.name ?? `گروه ${params.groupId}#`} subtitle="اعضا، مانده‌ها و ثبت هزینه">
     
      <Card title="دعوت عضو جدید">
        <div className="stack">
          <label className="label">ایمیل یا شماره موبایل</label>
          <input
            className="field"
            value={inviteIdentifier}
            onChange={(event) => setInviteIdentifier(event.target.value)}
            placeholder="user@email.com یا 0912..."
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={onInvite}
            disabled={inviteMutation.isPending || !me?.id}
          >
            {inviteMutation.isPending ? 'در حال ارسال...' : 'ارسال دعوت'}
          </button>
        </div>
        {inviteMessage ? <p style={{ margin: '0.75rem 0 0', color: 'var(--accent)' }}>{inviteMessage}</p> : null}
      </Card>

      <Card title="افزودن دوست به گروه">
        {isFriendsError ? (
          <p style={{ margin: 0, color: '#dc2626' }}>بارگذاری لیست دوستان ناموفق بود.</p>
        ) : null}
        {!availableFriends.length ? (
          <Placeholder label="دوست آماده برای افزودن وجود ندارد." />
        ) : (
          <div className="stack">
            <label className="label">انتخاب دوست</label>
            <select
              className="field"
              value={friendPicker}
              onChange={(event) => setFriendPicker(event.target.value)}
            >
              <option value="">انتخاب کن</option>
              {availableFriends.map((friend) => (
                <option key={friend.user.id} value={friend.user.id}>
                  {friend.user.nickname}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onAddFriendToGroup}
              disabled={!friendPicker || addFriendToGroupMutation.isPending}
            >
              {addFriendToGroupMutation.isPending ? 'در حال افزودن...' : 'افزودن به گروه'}
            </button>
          </div>
        )}
      </Card>

      <Card title="اعضا و مانده هر نفر">
        {isLoading ? <p style={{ margin: 0 }}>در حال بارگذاری...</p> : null}
        {isError ? <p style={{ margin: 0, color: '#dc2626' }}>خواندن گروه ناموفق بود.</p> : null}
        {!isLoading && !members.length ? <Placeholder label="هنوز عضوی در این گروه نیست." /> : null}
        <div className="member-list">
          {members.map((member) => (
            <div key={member.userId} className="member-row">
              <div className="member-main">
                <div className='members-cred'>
                <div className="member-avatar">
                  {member.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.avatarUrl} alt={member.nickname} className="member-avatar-image" />
                  ) : (
                    member.nickname.slice(0, 1)
                  )}
                </div>
                <div>
                  <p className="member-name">
                    {member.nickname} {member.userId === me?.id ? <span className="you-badge">شما</span> : null}
                  </p>
                  <p className="member-contact">{member.phone || member.email || 'بدون اطلاعات تماس'}</p>
                </div>
                </div>
                <div className="member-actions">
                {getSettlePayloadForMember(member) ? (
                  <button
                    type="button"
                    className="btn btn-secondary member-settle-btn"
                    disabled={createSettlementMutation.isPending}
                    onClick={() => settleWithMember(member)}
                  >
                    تسویه
                  </button>
                ) : null}

              </div>
              
              </div>
              {group ? getSettlementBadge(member, group.currency) : null}

            </div>
          ))}
        </div>
      </Card>

      <Card title="پرداخت‌ها و تسویه‌ها">
        {!settlements?.items.length ? (
          <Placeholder label="هنوز تسویه‌ای ثبت نشده." />
        ) : (
          <div className="stack">
            {settlements.items.map((item) => (
              <div key={item.id} className="expense-row">
                <p className="expense-title">
                  {item.payer?.nickname || item.payerId} ← {item.receiver?.nickname || item.receiverId}
                </p>
                <p className="expense-sub">
                  {formatMoney(Number(item.amount), group?.currency ?? 'TOMAN')} -{' '}
                  {item.status === 'SETTLED' ? 'پرداخت‌شده' : 'در انتظار پرداخت'}
                </p>
                {item.status === 'PENDING' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={settleSettlementMutation.isPending}
                    onClick={() => onSettlePending(item.id)}
                  >
                    پرداخت شد
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
        <div className="grid-two" style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSettlementsPage((p) => Math.max(1, p - 1))}
            disabled={settlementsPage === 1}
          >
            صفحه قبل
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSettlementsPage((p) => p + 1)}
            disabled={!settlements?.hasNext}
          >
            صفحه بعد
          </button>
        </div>
      </Card>

      <Card title="ثبت هزینه جدید">
        {group ? (
          <form onSubmit={onAddExpense} className="stack">
            <label className="label">عنوان هزینه</label>
            <input
              className="field"
              value={expenseDescription}
              onChange={(event) => setExpenseDescription(event.target.value)}
              placeholder="مثلاً خرید مواد غذایی"
              required
            />

            <label className="label">مبلغ</label>
            <input
              className="field"
              value={expenseAmount}
              onChange={(event) => setExpenseAmount(formatNumericInput(event.target.value))}
              type="text"
              inputMode="decimal"
              placeholder="مثلاً 1,250,000"
              required
            />
            <p style={{ margin: '-0.5rem 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
              واحد پیش‌فرض: {group.currency === 'TOMAN' ? 'تومان' : 'ریال'}
            </p>

            <DateTimePicker
              id="expense-datetime"
              label="تاریخ و زمان هزینه"
              value={expenseDateTime}
              onChange={setExpenseDateTime}
              required
            />

            <label className="label">چه کسی پرداخت کرد؟</label>
            <select
              className="field"
              value={paidBy}
              onChange={(event) => setPaidBy(event.target.value)}
              required
            >
              <option value="">انتخاب کن</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.nickname}
                </option>
              ))}
            </select>

            <label className="label">روش تقسیم</label>
            <select
              className="field"
              value={splitType}
              onChange={(event) => setSplitType(event.target.value as SplitType)}
            >
              {splitTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <div className="split-grid">
              {members.map((member) => {
                const selected = selectedMemberIds.includes(member.userId);
                return (
                  <div key={member.userId} className="split-row">
                    <label className="split-check">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleMember(member.userId)}
                      />
                      <span>{member.nickname}</span>
                    </label>
                    {splitType !== 'EQUAL' && selected ? (
                      <input
                        className="field split-value"
                        type="text"
                        inputMode="decimal"
                        value={memberValues[member.userId] || ''}
                        onChange={(event) =>
                          setMemberValues((prev) => ({
                            ...prev,
                            [member.userId]: formatNumericInput(event.target.value),
                          }))
                        }
                        placeholder={
                          splitType === 'PERCENT'
                            ? 'درصد'
                            : splitType === 'SHARE'
                              ? 'سهم'
                              : 'مبلغ'
                        }
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <button type="submit" className="btn btn-primary" disabled={createExpenseMutation.isPending}>
              {createExpenseMutation.isPending ? 'در حال ثبت...' : 'ثبت هزینه'}
            </button>
          </form>
        ) : (
          <Placeholder label="ابتدا گروه بارگذاری شود." />
        )}
      </Card>

      <Card title="آخرین هزینه‌ها">
        {!expenses?.items.length ? (
          <Placeholder label="هنوز هزینه‌ای ثبت نشده." />
        ) : (
          <div className="stack">
            {expenses.items.map((expense) => (
              <div key={expense.id} className="expense-row">
                <p className="expense-title">{expense.description}</p>
                <p className="expense-sub">
                  {formatMoney(Number(expense.amount), expense.currency)} -{' '}
                  {new Date(expense.date).toLocaleDateString('fa-IR-u-ca-persian')}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="grid-two" style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setExpensesPage((p) => Math.max(1, p - 1))}
            disabled={expensesPage === 1}
          >
            صفحه قبل
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setExpensesPage((p) => p + 1)}
            disabled={!expenses?.hasNext}
          >
            صفحه بعد
          </button>
        </div>
      </Card>

      {formError ? <p style={{ margin: 0, color: '#dc2626' }}>{formError}</p> : null}
    </AppShell>
  );
}
