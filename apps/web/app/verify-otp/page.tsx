import { AppShell, Card, Placeholder } from '../components/ui';

export default function VerifyOtpPage() {
  return (
    <AppShell title="تأیید کد" subtitle="کد پیامک‌شده رو وارد کن.">
      <Card>
        <div className="stack">
          <label className="label">کد تأیید</label>
          <input type="text" placeholder="123456" className="field" disabled />
          <button type="button" className="btn btn-primary" disabled>
            ادامه
          </button>
        </div>
      </Card>
      <Placeholder label="اتصال به verify-otp اینجا انجام می‌شود." />
    </AppShell>
  );
}
