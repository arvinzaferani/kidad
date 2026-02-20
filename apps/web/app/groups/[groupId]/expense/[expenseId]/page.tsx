import { AppShell, Card, Placeholder } from '../../../../components/ui';

interface ExpenseDetailsPageProps {
  params: { groupId: string; expenseId: string };
}

export default function ExpenseDetailsPage({ params }: ExpenseDetailsPageProps) {
  return (
    <AppShell title={`جزئیات هزینه ${params.expenseId}#`} subtitle={`گروه ${params.groupId}#`}>
      <Card title="شرح هزینه">
        <Placeholder label="جزئیات، ویرایش و حذف اینجا مدیریت می‌شود." />
      </Card>
    </AppShell>
  );
}
