'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { APP_VERSION } from '@/lib/version';
import { Button } from '@/components/ui/Button';
import { ConsultationModal } from '@/components/ui/ConsultationModal';
import { CrediqlyLogo } from '@/components/common/CrediqlyLogo';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { useSubscription } from '@/context/SubscriptionContext';
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
  Lock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SubNavItemDef {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  sectionKey?: DashboardSectionKey;
  proBadge?: 'Pro' | 'VIP';
}

interface NavItemDef {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  sectionKey?: DashboardSectionKey;
  proBadge?: 'Pro' | 'VIP';
  subItems?: SubNavItemDef[];
}

interface NavGroupDef {
  title?: string;
  items: NavItemDef[];
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    items: [
      { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
    ],
  },
  {
    title: 'READINESS & JOURNEY',
    items: [
      {
        href: '/readiness',
        label: 'Readiness Journey',
        icon: ShieldCheck,
        sectionKey: 'funding_readiness',
        subItems: [
          { href: '/readiness', label: '0–100 Readiness Audit', icon: ShieldCheck, sectionKey: 'funding_readiness' },
          { href: '/roadmap', label: 'Milestone Roadmap', icon: GitFork, sectionKey: 'roadmap' },
          { href: '/business', label: 'Business Profile', icon: Building2, sectionKey: 'business_profile' },
        ],
      },
    ],
  },
  {
    title: 'CAPITAL & FUNDING',
    items: [
      {
        href: '/funding',
        label: 'Funding Marketplace',
        icon: DollarSign,
        sectionKey: 'funding',
        subItems: [
          { href: '/funding', label: 'Explore & Grants', icon: DollarSign, sectionKey: 'funding' },
          { href: '/funding-tracker', label: 'Application Pipeline', icon: FileCheck, sectionKey: 'funding_tracker' },
        ],
      },
    ],
  },
  {
    title: 'CREDIT BUILDING',
    items: [
      { href: '/products', label: 'Credit Products', icon: CreditCard, sectionKey: 'products', proBadge: 'Pro' },
      { href: '/learn', label: 'Resource Library', icon: BookOpen },
      { href: '/advisory', label: 'VIP Advisory', icon: Headphones, proBadge: 'VIP' },
    ],
  },
  {
    title: 'ACCOUNT & SETTINGS',
    items: [
      {
        href: '/profile',
        label: 'Account & Settings',
        icon: User,
        subItems: [
          { href: '/profile', label: 'Profile & Business Info', icon: User },
          { href: '/pricing', label: 'Plans & Billing', icon: Sparkles },
          { href: '/check-in', label: 'Monthly Check-In', icon: CalendarCheck },
        ],
      },
    ],
  },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { sections } = usePlatformSections();
  const { isPro } = useSubscription();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [key]: prev[key] !== undefined ? !prev[key] : false,
    }));
  };

  const isMenuExpanded = (item: NavItemDef) => {
    if (!item.subItems || item.subItems.length === 0) return false;
    if (expandedMenus[item.label] !== undefined) {
      return expandedMenus[item.label];
    }
    const isChildActive = item.subItems.some(
      (sub) => pathname === sub.href || (sub.href !== '/dashboard' && pathname?.startsWith(sub.href + '/'))
    );
    const isParentActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'));
    return isChildActive || isParentActive;
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  const isConsultationEnabled = sections.consultation !== false;

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
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/dashboard" className="flex items-center gap-2">
          <CrediqlyLogo size="sm" showSubtitle={false} />
        </Link>
        <div className="flex items-center gap-2">
          {isConsultationEnabled && (
            <Link href="/consultation">
              <Button
                size="sm"
                variant="outline"
                className="text-xs py-1 px-2.5 flex items-center gap-1 border-brand-300 text-brand-700 bg-brand-50/60 font-semibold"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Consult</span>
              </Button>
            </Link>
          )}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
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
        {/* Top Branding & Navigation */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <CrediqlyLogo size="md" subtitle="Command Center" />
            </Link>
            <button
              onClick={() => setMobileNavOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1">
            {NAV_GROUPS.map((group, groupIdx) => {
              const visibleItems = group.items.filter((item) => {
                if (!item.sectionKey) return true;
                return sections[item.sectionKey] !== false;
              });

              if (visibleItems.length === 0) return null;

              return (
                <div key={groupIdx} className="space-y-0.5">
                  {group.title && (
                    <div className="px-3 pt-1 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {group.title}
                    </div>
                  )}
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const isExpanded = hasSubItems ? isMenuExpanded(item) : false;

                    const visibleSubItems = (item.subItems || []).filter((sub) => {
                      if (!sub.sectionKey) return true;
                      return sections[sub.sectionKey] !== false;
                    });

                    const isParentDirectActive =
                      item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname === item.href;

                    const isAnyChildActive = visibleSubItems.some(
                      (sub) => pathname === sub.href || (sub.href !== '/dashboard' && pathname?.startsWith(sub.href + '/'))
                    );

                    const isHighlighted = isParentDirectActive || isAnyChildActive;

                    return (
                      <div key={item.href} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <Link
                            href={item.href}
                            onClick={() => {
                              if (!hasSubItems) setMobileNavOpen(false);
                            }}
                            className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                              isParentDirectActive && !hasSubItems
                                ? 'bg-brand-50 text-brand-900 font-bold border-l-4 border-brand-600 pl-2 shadow-2xs'
                                : isHighlighted && hasSubItems
                                ? 'text-brand-900 font-bold bg-brand-50/60'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isHighlighted ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                            {item.proBadge && !isPro && (
                              <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded-md border border-amber-300/60 flex items-center gap-0.5 shrink-0">
                                <Lock className="w-2.5 h-2.5 text-amber-700" />
                                <span>{item.proBadge}</span>
                              </span>
                            )}
                          </Link>

                          {hasSubItems && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleMenu(item.label);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
                              aria-label={`Toggle ${item.label} submenu`}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Sub Items Accordion */}
                        {hasSubItems && isExpanded && (
                          <div className="ml-4 pl-3 border-l-2 border-slate-200/80 space-y-1 py-1">
                            {visibleSubItems.map((sub) => {
                              const SubIcon = sub.icon;
                              const isSubActive =
                                pathname === sub.href ||
                                (sub.href !== '/dashboard' && pathname?.startsWith(sub.href + '/'));

                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={() => setMobileNavOpen(false)}
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    isSubActive
                                      ? 'bg-brand-50 text-brand-900 font-bold border-l-2 border-brand-600 pl-2 shadow-2xs'
                                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                  }`}
                                >
                                  {SubIcon ? (
                                    <SubIcon
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        isSubActive ? 'text-brand-600' : 'text-slate-400'
                                      }`}
                                    />
                                  ) : (
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        isSubActive ? 'bg-brand-600' : 'bg-slate-300'
                                      }`}
                                    />
                                  )}
                                  <span className="truncate">{sub.label}</span>
                                  {sub.proBadge && !isPro && (
                                    <span className="ml-auto text-[9px] font-black uppercase text-amber-800 bg-amber-100 px-1 py-0.2 rounded border border-amber-300/60">
                                      {sub.proBadge}
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 pt-1 border-t border-slate-200/50">
            <span>Crediqly</span>
            <span>v{APP_VERSION}</span>
          </div>
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
