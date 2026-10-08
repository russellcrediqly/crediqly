'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { calculateMilestoneReadiness } from '@/lib/readiness/readinessMilestoneEngine';
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
  Award,
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
  sublabel?: string;
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
    title: 'OVERVIEW',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        sublabel: 'Command Center',
        icon: LayoutDashboard,
      },
      {
        href: '/roadmap',
        label: 'My Journey',
        icon: GitFork,
        sectionKey: 'roadmap',
        subItems: [
          { href: '/roadmap', label: 'Credit Roadmap', icon: GitFork, sectionKey: 'roadmap' },
          { href: '/readiness', label: 'Readiness Audit', icon: ShieldCheck, sectionKey: 'funding_readiness' },
        ],
      },
    ],
  },
  {
    title: 'BUILD',
    items: [
      {
        href: '/business',
        label: 'Business Credit',
        icon: Building2,
        sectionKey: 'business_profile',
      },
      {
        href: '/products',
        label: 'Products & Tradelines',
        icon: CreditCard,
        sectionKey: 'products',
        proBadge: 'Pro',
      },
    ],
  },
  {
    title: 'FUNDING',
    items: [
      {
        href: '/funding',
        label: 'Funding Marketplace',
        icon: DollarSign,
        sectionKey: 'funding',
        subItems: [
          { href: '/funding', label: 'Marketplace', icon: DollarSign, sectionKey: 'funding' },
          { href: '/funding-tracker', label: 'Funding Tracker', icon: FileCheck, sectionKey: 'funding_tracker' },
        ],
      },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      {
        href: '/advisory',
        label: 'Advisory & Concierge',
        icon: Headphones,
        proBadge: 'VIP',
      },
      {
        href: '/learn',
        label: 'Knowledge Base',
        icon: BookOpen,
      },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      {
        href: '/profile',
        label: 'Profile & Business',
        icon: User,
        subItems: [
          { href: '/profile', label: 'Profile & Settings', icon: User },
          { href: '/pricing', label: 'Plans & Billing', icon: Sparkles },
          { href: '/check-in', label: 'Monthly Check-In', icon: CalendarCheck },
        ],
      },
    ],
  },
];

// Flattened navigation items for programmatic access and test filtering
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { business } = useBusiness();
  const { sections } = usePlatformSections();
  const { isPro, isAdvisory } = useSubscription();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Real authoritative readiness calculation for global top bar
  const milestoneReadiness = useMemo(() => {
    return calculateMilestoneReadiness(business);
  }, [business]);

  // Context titles for header breadcrumb
  const { sectionTitle, pageTitle } = useMemo(() => {
    if (!pathname) return { sectionTitle: 'Overview', pageTitle: 'Command Center' };
    if (pathname === '/dashboard') return { sectionTitle: 'Overview', pageTitle: 'Command Center' };
    if (pathname.startsWith('/roadmap')) return { sectionTitle: 'Overview', pageTitle: 'My Journey' };
    if (pathname.startsWith('/readiness')) return { sectionTitle: 'Overview', pageTitle: 'Readiness Audit' };
    if (pathname.startsWith('/business')) return { sectionTitle: 'Build', pageTitle: 'Business Credit' };
    if (pathname.startsWith('/products')) return { sectionTitle: 'Build', pageTitle: 'Products & Tradelines' };
    if (pathname.startsWith('/funding-tracker')) return { sectionTitle: 'Funding', pageTitle: 'Funding Tracker' };
    if (pathname.startsWith('/funding')) return { sectionTitle: 'Funding', pageTitle: 'Funding Marketplace' };
    if (pathname.startsWith('/advisory')) return { sectionTitle: 'Support', pageTitle: 'Advisory & Concierge' };
    if (pathname.startsWith('/consultation')) return { sectionTitle: 'Support', pageTitle: 'Consultation' };
    if (pathname.startsWith('/learn')) return { sectionTitle: 'Support', pageTitle: 'Knowledge Base' };
    if (pathname.startsWith('/profile') || pathname.startsWith('/account')) return { sectionTitle: 'Account', pageTitle: 'Profile & Settings' };
    if (pathname.startsWith('/pricing')) return { sectionTitle: 'Account', pageTitle: 'Plans & Billing' };
    if (pathname.startsWith('/check-in')) return { sectionTitle: 'Account', pageTitle: 'Monthly Check-In' };
    return { sectionTitle: 'Crediqly', pageTitle: 'Platform' };
  }, [pathname]);

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

  // Initials for avatar
  const userInitials = useMemo(() => {
    if (!user?.name) return 'CO';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }, [user?.name]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased">
      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={consultationOpen}
        onClose={() => setConsultationOpen(false)}
        userEmail={user?.email}
        userName={user?.name}
      />

      {/* ===================================================================== */}
      {/* DESKTOP SIDEBAR / MOBILE NAVIGATION DRAWER                            */}
      {/* ===================================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0 print:hidden ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding & Navigation */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <CrediqlyLogo size="md" subtitle="Command Center" />
            </Link>
            <button
              onClick={() => setMobileNavOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-4 overflow-y-auto flex-1">
            {NAV_GROUPS.map((group, groupIdx) => {
              const visibleItems = group.items.filter((item) => {
                if (!item.sectionKey) return true;
                return sections[item.sectionKey] !== false;
              });

              if (visibleItems.length === 0) return null;

              return (
                <div key={groupIdx} className="space-y-1">
                  {group.title && (
                    <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
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
                                ? 'bg-slate-900 text-white shadow-2xs font-bold'
                                : isHighlighted && hasSubItems
                                ? 'text-slate-900 font-bold bg-slate-100'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isParentDirectActive && !hasSubItems
                                  ? 'text-white'
                                  : isHighlighted
                                  ? 'text-slate-900'
                                  : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                            {item.proBadge && !isPro && !isAdvisory && (
                              <span className="ml-auto text-[9px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5 shrink-0">
                                <Lock className="w-2.5 h-2.5 text-slate-500" />
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
                          <div className="ml-4 pl-3 border-l border-slate-200 space-y-0.5 py-1">
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
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                    isSubActive
                                      ? 'text-slate-900 font-bold bg-slate-100/90'
                                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                                  }`}
                                >
                                  {SubIcon ? (
                                    <SubIcon
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        isSubActive ? 'text-slate-900' : 'text-slate-400'
                                      }`}
                                    />
                                  ) : (
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        isSubActive ? 'bg-slate-900' : 'bg-slate-300'
                                      }`}
                                    />
                                  )}
                                  <span className="truncate">{sub.label}</span>
                                  {sub.proBadge && !isPro && !isAdvisory && (
                                    <span className="ml-auto text-[9px] font-black uppercase text-slate-600 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
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

          {/* Quiet Support / Advisory Card */}
          {isConsultationEnabled && (
            <div className="p-3.5 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Headphones className="w-3.5 h-3.5 text-slate-700" />
                  <span>Private Advisory</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  1-on-1 strategy with a dedicated business credit specialist.
                </p>
                <div className="pt-1">
                  <Link href="/consultation" onClick={() => setMobileNavOpen(false)}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs font-semibold py-1.5 h-auto bg-white hover:bg-slate-100 border-slate-200 text-slate-800"
                    >
                      Book Session
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Info & Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-white">
          <div className="flex items-center justify-between gap-2.5 px-1 py-1 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {userInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'Business Owner'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {user?.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="w-full mb-2 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-slate-600" />
              <span>Admin Console</span>
            </Link>
          )}

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 pt-1 border-t border-slate-100">
            <span>Crediqly SaaS</span>
            <span>v{APP_VERSION}</span>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden print:hidden backdrop-blur-2xs"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ===================================================================== */}
      {/* MAIN VIEWPORT (TOP HEADER BAR + PAGE CANVAS)                         */}
      {/* ===================================================================== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Institutional Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between print:hidden">
          {/* Left: Section Context Breadcrumb */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="font-semibold text-slate-400 hidden sm:inline">{sectionTitle}</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-bold text-slate-900 truncate">{pageTitle}</span>
          </div>

          {/* Right: Status Indicators & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Live Authoritative Readiness Indicator */}
            <Link
              href="/readiness"
              title="View full Readiness Audit"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="hidden sm:inline text-slate-500 font-medium">Readiness:</span>
              <strong className="font-mono text-slate-900 font-bold">{milestoneReadiness.score}/100</strong>
            </Link>

            {/* Plan Tier Badge */}
            {isAdvisory ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
                Advisory
              </span>
            ) : isPro ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                Pro
              </span>
            ) : (
              <Link
                href="/pricing"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span>Free Tier</span>
                <span className="text-[10px] text-brand-600 font-extrabold uppercase">Upgrade</span>
              </Link>
            )}

            {/* Consultation Quick Trigger */}
            {isConsultationEnabled && (
              <Link href="/consultation" className="hidden lg:inline-block">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs py-1 px-3 h-auto border-slate-300 text-slate-700 hover:text-slate-900"
                >
                  <CalendarCheck className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  <span>Consult</span>
                </Button>
              </Link>
            )}

            {/* Profile Avatar Shortcut */}
            <Link
              href="/profile"
              title="Account & Settings"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center transition-colors border border-slate-200/80"
            >
              {userInitials}
            </Link>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation drawer"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full print:p-0 print:max-w-none print:w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
