import type { Metadata, Viewport } from 'next';
import './globals.css';
import { QueryProvider } from './providers/query-provider';
import { AlertProvider } from './providers/alert-provider';
import { AccountCompletionProvider } from './providers/account-completion-provider';
import { KeyboardDetector } from './components/keyboard-detector';
import { ThemeMetaSync } from './components/theme-meta-sync';
import { PwaKeyboardFix } from './components/pwa-keyboard-fix';

export const metadata: Metadata = {
  title: 'کی‌داد؟',
  description: 'اپلیکیشن تقسیم هزینه برای دوستا و خانواده – کی‌داد؟',
  icons: {
    icon: '/kidad-fav.png',
    apple: '/kidad-fav.png',
  },
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
  themeColor: '#f5f4ef',
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
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('whopaid-theme');var d=document.documentElement;if(t==='dark'){d.classList.add('dark');}else if(t==='light'){d.classList.add('light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <KeyboardDetector />
        <ThemeMetaSync />
        <PwaKeyboardFix />
        <QueryProvider>
          <AlertProvider>
            <AccountCompletionProvider>{children}</AccountCompletionProvider>
          </AlertProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
