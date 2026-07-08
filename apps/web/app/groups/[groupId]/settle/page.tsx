'use client';

import { AppShell, Card, Placeholder } from '../../../components/ui';
import { ArrowLeftIcon } from '../../../components/icons';
import { useAuthMe } from '../../../../lib/auth/hooks';
import {
  useGroup,
  useSettlementSuggestions,
  useCreateSettlement,
} from '../../../../lib/groups/hooks';
import { useAlert } from '../../../providers/alert-provider';

interface SettlePageProps {
  params: { groupId: string };
}

const formatMoney = (value: number, currency: 'TOMAN' | 'RIAL') =>
  `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} ${currency === 'TOMAN' ? 'تومان' : 'ریال'}`;

export default function SettlePage({ params }: SettlePageProps) {
  const { showAlert } = useAlert();
  const { data: me } = useAuthMe();
  const { data: group, isLoading: groupLoading } = useGroup(params.groupId, me?.id);
  const { data: suggestions, isLoading: suggestionsLoading } = useSettlementSuggestions(params.groupId);
  const createSettlementMutation = useCreateSettlement();

  const members = group?.members ?? [];
  const getMemberName = (memberId: string) =>
    members.find((m) => m.id === memberId)?.nickname ?? 'کاربر';

  const handleSettle = async (from: string, to: string, amount: number) => {
    if (!group || !me) return;
    try {
      await createSettlementMutation.mutateAsync({
        groupId: group.id,
        payerMemberId: from,
        receiverMemberId: to,
        amount,
        method: 'CASH',
        status: 'SETTLED',
      });
      showAlert('پرداخت ثبت شد.', 'success');
    } catch (error) {
      showAlert('خطا در ثبت پرداخت.', 'error');
    }
  };

  return (
    <AppShell
      title={`تسویه ${group?.name ?? `گروه ${params.groupId}#`}`}
      subtitle="پیشنهاد پرداخت‌ها"
    >
      <Card title="پیشنهادهای تسویه">
        {groupLoading || suggestionsLoading ? (
          <div className="stack">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
        ) : !suggestions?.length ? (
          <Placeholder label="همه تسویه‌اند! بدهی یا طلبی وجود ندارد." />
        ) : (
          <div className="stack">
            {suggestions.map((s, i) => (
              <div key={`${s.from}-${s.to}`} className="settlement-suggestion">
                <div className="settlement-suggestion-row">
                  <div>
                    <span className="settlement-suggestion-name">{getMemberName(s.from)}</span>
                    <span className="settlement-suggestion-pays"> باید بدهد به </span>
                    <span className="settlement-suggestion-name">{getMemberName(s.to)}</span>
                  </div>
                  <div className="settlement-suggestion-arrow">
                    <ArrowLeftIcon size={18} />
                  </div>
                </div>
                <div className="settlement-suggestion-row">
                  <span className="settlement-suggestion-amount-value">
                    {formatMoney(s.amount, group?.currency ?? 'TOMAN')}
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary member-settle-btn"
                    disabled={createSettlementMutation.isPending}
                    onClick={() => handleSettle(s.from, s.to, s.amount)}
                  >
                    {createSettlementMutation.isPending ? '...' : 'پرداخت شد'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
