import Link from 'next/link';

const highlights = [
  {
    title: 'تقسیم هزینه‌ها',
    description: 'خرج‌های سفر، مهمانی و زندگی مشترک را در چند ثانیه ثبت کن.',
  },
  {
    title: 'مانده‌های شفاف',
    description: 'ببین چه کسی بدهکار است و چه کسی طلبکار، بدون حساب‌وکتاب دستی.',
  },
  {
    title: 'دسترسی ساده',
    description: 'از وب وارد شو، گروه بساز و همه چیز را از هر دستگاهی دنبال کن.',
  },
];

const steps = ['گروه بساز', 'هزینه ثبت کن', 'تسویه را ببین'];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <div className="landing-badge">کی‌داد؟ · نسخه وب</div>
        <h1 className="landing-title">خرج‌های مشترک را ساده و شفاف مدیریت کن.</h1>
        <p className="landing-copy">
          برای سفرها، خانه و جمع‌های دوستانه؛ هزینه‌ها را ثبت کن، مانده‌ها را ببین و
          بدون دردسر تسویه کن.
        </p>

        <div className="landing-actions">
          <Link href="/login" className="btn btn-primary landing-cta">
            شروع کن
          </Link>
          <Link href="/dashboard" className="btn btn-secondary landing-cta">
            دیدن داشبورد
          </Link>
        </div>

        <ul className="landing-steps" aria-label="مراحل استفاده">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>

      <section className="landing-grid" aria-label="ویژگی‌ها">
        {highlights.map((item) => (
          <article key={item.title} className="landing-card card">
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
