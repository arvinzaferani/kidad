import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from './providers/query-provider';
import { AlertProvider } from './providers/alert-provider';

export const metadata: Metadata = {
  title: 'کی‌داد؟',
  description: 'اپلیکیشن تقسیم هزینه برای دوستا و خانواده – کی‌داد؟'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <AlertProvider>{children}</AlertProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
