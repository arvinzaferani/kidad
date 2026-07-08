import type { Metadata, Viewport } from 'next';
import './globals.css';
import { QueryProvider } from './providers/query-provider';
import { AlertProvider } from './providers/alert-provider';

export const metadata: Metadata = {
  title: 'کی‌داد؟',
  description: 'اپلیکیشن تقسیم هزینه برای دوستا و خانواده – کی‌داد؟',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'کی‌داد؟',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <QueryProvider>
          <AlertProvider>{children}</AlertProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
