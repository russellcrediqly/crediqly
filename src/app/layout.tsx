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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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

