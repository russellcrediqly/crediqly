import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { BusinessProvider } from '@/context/BusinessContext';
import { RoadmapProvider } from '@/context/RoadmapContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';

export const metadata: Metadata = {
  title: 'Crediqly — Build Business Credit. Become Funding Ready.',
  description:
    'Crediqly gives U.S. small-business owners a personalized step-by-step roadmap to build business credit and prepare for potential funding opportunities.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0b132b" />
      </head>
      <body className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen">
        <AuthProvider>
          <SubscriptionProvider>
            <BusinessProvider>
              <RoadmapProvider>{children}</RoadmapProvider>
            </BusinessProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

