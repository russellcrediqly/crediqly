'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { APP_VERSION } from '@/lib/version';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Building2,
  TrendingUp,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Database,
  Search,
  Package,
  Sparkles,
  FileText,
  Activity,
  Settings,
  Landmark,
  DollarSign,
  FileCheck,
  Calendar,
  CreditCard,
  Target,
  Link2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CrediqlyLogo } from '@/components/common/CrediqlyLogo';

export interface AdminLayoutProps {
  children: React.ReactNode;
}

interface AdminSubNavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface AdminNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: AdminSubNavItem[];
}

interface AdminNavGroup {
  title?: string;
  items: AdminNavItem[];
}

const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    items: [
      { href: '/admin', label: 'Overview Dashboard', icon: LayoutDashboard },
      { href: '/admin/activity', label: 'Activity & Audit Log', icon: Activity },
    ],
  },
  {
    title: 'CUSTOMERS & PARTNERS',
    items: [
      { href: '/admin/customers', label: 'Customer Directory', icon: Users },
      { href: '/admin/affiliates', label: 'Affiliates & Referrals', icon: Link2 },
      { href: '/admin/consultations', label: 'Advisory Consultations', icon: Calendar },
    ],
  },
  {
    title: 'READINESS & ROADMAP',
    items: [
      {
        href: '/admin/roadmap',
        label: 'Readiness Engine',
        icon: Target,
        subItems: [
          { href: '/admin/roadmap', label: 'Milestone Roadmap', icon: Target },
          { href: '/admin/readiness', label: '100-Pt Engine & Weights', icon: ShieldCheck },
          { href: '/admin/recommendations', label: 'Action Guidance Rules', icon: Sparkles },
        ],
      },
    ],
  },
  {
    title: 'FUNDING & PRODUCTS',
    items: [
      {
        href: '/admin/funding',
        label: 'Funding & Pipeline',
        icon: DollarSign,
        subItems: [
          { href: '/admin/funding', label: 'Funding Marketplace & Grants', icon: DollarSign },
          { href: '/admin/funding-applications', label: 'Application Pipeline', icon: FileCheck },
          { href: '/admin/products', label: 'Credit Products Catalog', icon: Package },
          { href: '/admin/banks', label: 'Partner Banks & Lenders', icon: Landmark },
        ],
      },
    ],
  },
  {
    title: 'BILLING & PLATFORM',
    items: [
      {
        href: '/admin/billing',
        label: 'Billing & Settings',
        icon: Settings,
        subItems: [
          { href: '/admin/billing', label: 'Subscriptions & Tiers', icon: CreditCard },
          { href: '/admin/payments', label: 'Payments Ledger', icon: DollarSign },
          { href: '/admin/settings/stripe', label: 'Stripe Configuration', icon: ShieldCheck },
          { href: '/admin/settings', label: 'Platform Settings', icon: Settings },
          { href: '/admin/content', label: 'Knowledge Base Content', icon: FileText },
        ],
      },
    ],
  },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [key]: prev[key] !== undefined ? !prev[key] : false,
    }));
  };

  const isMenuExpanded = (item: AdminNavItem) => {
    if (!item.subItems || item.subItems.length === 0) return false;
    if (expandedMenus[item.label] !== undefined) {
      return expandedMenus[item.label];
    }
    const isChildActive = item.subItems.some(
      (sub) => pathname === sub.href || (sub.href !== '/admin' && pathname?.startsWith(sub.href + '/'))
    );
    const isParentActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href + '/'));
    return isChildActive || isParentActive;
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Admin Header */}
      <header className="md:hidden sticky top-0 z-30 bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href="/admin">
          <CrediqlyLogo size="sm" variant="dark" subtitle="Admin" />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Desktop Sidebar / Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand & Console Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <Link href="/admin">
              <CrediqlyLogo size="md" variant="dark" subtitle="Admin Console" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connected Database Pill */}
          <div className="px-4 pt-3 pb-1 shrink-0">
            <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
                <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>dfdvmegzw...</span>
              </div>
              <Badge variant="success" className="text-[9px] px-1.5 py-0">
                Connected
              </Badge>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1">
            {ADMIN_NAV_GROUPS.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-0.5">
                {group.title && (
                  <div className="px-3 pt-1 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    {group.title}
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isExpanded = hasSubItems ? isMenuExpanded(item) : false;

                  const isParentDirectActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname === item.href;

                  const isAnyChildActive = (item.subItems || []).some(
                    (sub) => pathname === sub.href || (sub.href !== '/admin' && pathname?.startsWith(sub.href + '/'))
                  );

                  const isHighlighted = isParentDirectActive || isAnyChildActive;

                  return (
                    <div key={item.href} className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <Link
                          href={item.href}
                          onClick={() => {
                            if (!hasSubItems) setMobileMenuOpen(false);
                          }}
                          className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isParentDirectActive && !hasSubItems
                              ? 'bg-brand-600 text-white shadow-sm font-bold'
                              : isHighlighted && hasSubItems
                              ? 'text-white font-bold bg-slate-800/80'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isHighlighted ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </Link>

                        {hasSubItems && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleMenu(item.label);
                            }}
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
                            aria-label={`Toggle ${item.label} submenu`}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Sub Items Accordion */}
                      {hasSubItems && isExpanded && (
                        <div className="ml-4 pl-3 border-l-2 border-slate-800 space-y-1 py-1">
                          {item.subItems?.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              pathname === sub.href ||
                              (sub.href !== '/admin' && pathname?.startsWith(sub.href + '/'));

                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  isSubActive
                                    ? 'bg-brand-600/30 text-brand-300 font-bold border-l-2 border-brand-500 pl-2'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                                }`}
                              >
                                {SubIcon ? (
                                  <SubIcon
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isSubActive ? 'text-brand-400' : 'text-slate-500'
                                    }`}
                                  />
                                ) : (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      isSubActive ? 'bg-brand-400' : 'bg-slate-600'
                                    }`}
                                  />
                                )}
                                <span className="truncate">{sub.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User Footer & Return to App */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-850 transition-colors"
          >
            <span>Return to User App</span>
            <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-200 truncate">
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-400 truncate">{user?.email}</span>
            </div>
            <Badge variant="warning" className="text-[10px]">
              Admin
            </Badge>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1 pt-1 border-t border-slate-900">
            <span>Crediqly Platform</span>
            <span>v{APP_VERSION}</span>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content View */}
      <main className="flex-1 min-w-0 bg-slate-900 p-4 sm:p-6 lg:p-8 max-w-7xl overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
