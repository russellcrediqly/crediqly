'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { ConsultationModal } from '@/components/ui/ConsultationModal';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { DashboardSectionKey } from '@/types/settings';
import {
  LayoutDashboard,
  Building2,
  GitFork,
  DollarSign,
  FileCheck,
  User,
  LogOut,
  Menu,
  X,
  CalendarCheck,
  ShieldCheck,
  CreditCard,
  BookOpen,
  Shield,
  Sparkles,
  Headphones,
} from 'lucide-react';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/business', label: 'My Business', icon: Building2 },
  { href: '/roadmap', label: 'Credit Roadmap', icon: GitFork },
  { href: '/funding-readiness', label: 'Funding Readiness', icon: ShieldCheck },
  { href: '/funding', label: 'Funding', icon: DollarSign },
  { href: '/products', label: 'Credit Products', icon: CreditCard },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/funding-tracker', label: 'Funding Tracker', icon: FileCheck },
  { href: '/advisory', label: 'Premium Advisory', icon: Headphones },
  { href: '/pricing', label: 'Plans & Pricing', icon: Sparkles },
  { href: '/profile', label: 'Profile', icon: User },
];

const ROUTE_SECTION_MAP: Partial<Record<string, DashboardSectionKey>> = {
  '/business': 'business_profile',
  '/roadmap': 'roadmap',
  '/funding-readiness': 'funding_readiness',
  '/funding': 'funding',
  '/products': 'products',
  '/funding-tracker': 'funding_tracker',
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { sections } = usePlatformSections();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  const isConsultationEnabled = sections.consultation !== false;

  // Filter navigation items based on active platform settings
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    const secKey = ROUTE_SECTION_MAP[item.href];
    if (!secKey) return true;
    return sections[secKey] !== false;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={consultationOpen}
        onClose={() => setConsultationOpen(false)}
        userEmail={user?.email}
        userName={user?.name}
      />

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-sm">
            C
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-lg">Crediqly</span>
        </Link>
        <div className="flex items-center gap-2">
          {isConsultationEnabled && (
            <Link href="/consultation">
              <Button
                size="sm"
                variant="outline"
                className="text-xs py-1.5 px-2.5 flex items-center gap-1 border-brand-300 text-brand-700 bg-brand-50/60"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Consult</span>
              </Button>
            </Link>
          )}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar / Mobile Nav Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-navy-900 flex items-center justify-center text-white font-black text-base shadow-sm">
                C
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 font-sans">
                  Crediqly
                </span>
                <span className="text-[10px] font-semibold tracking-wide uppercase text-brand-700 -mt-1">
                  Business Hub
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileNavOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-800 font-semibold border-l-4 border-brand-600 pl-2.5 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Prominent CTA: Book a Consultation */}
          {isConsultationEnabled && (
            <div className="px-4 py-3">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50/70 border border-brand-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-900">
                  <CalendarCheck className="w-4 h-4 text-brand-600" />
                  <span>Need 1-on-1 Advice?</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Speak directly with a business-credit and funding readiness specialist.
                </p>
                <Link href="/consultation" onClick={() => setMobileNavOpen(false)}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs font-semibold py-2 bg-brand-600 hover:bg-brand-700 shadow-sm"
                  >
                    Book a Consultation
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Info & Sign Out Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">
                {user?.name || 'Business Owner'}
              </span>
              <span className="text-[11px] text-slate-500 truncate">{user?.email}</span>
            </div>
            <div title="Zero Sensitive Data Stored">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            </div>
          </div>
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="w-full mb-2 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-brand-600" />
              <span>Admin Console</span>
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 border border-slate-200/70 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl">
        {children}
      </main>
    </div>
  );
};
