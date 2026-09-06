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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CrediqlyLogo } from '@/components/common/CrediqlyLogo';

export interface AdminLayoutProps {
  children: React.ReactNode;
}

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/affiliates', label: 'Affiliates', icon: Link2 },
  { href: '/admin/roadmap', label: 'Roadmap', icon: Target },
  { href: '/admin/recommendations', label: 'Action Guidance', icon: Sparkles },
  { href: '/admin/funding-applications', label: 'Applications', icon: FileCheck },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/banks', label: 'Banks', icon: Landmark },
  { href: '/admin/funding', label: 'Funding', icon: DollarSign },
  { href: '/admin/consultations', label: 'Advisory Meetings', icon: Calendar },
  { href: '/admin/billing', label: 'Billing & Plans', icon: CreditCard },
  { href: '/admin/payments', label: 'Payments Ledger', icon: DollarSign },
  { href: '/admin/content', label: 'Content', icon: FileText },
  { href: '/admin/activity', label: 'Activity & Audit', icon: Activity },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/settings/stripe', label: 'Stripe Setup', icon: ShieldCheck },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <div>
          {/* Brand & Console Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
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
          <div className="px-4 pt-4 pb-2">
            <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
                <Database className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>dfdvmegzw...</span>
              </div>
              <Badge variant="success" className="text-[9px] px-1.5 py-0">
                Connected
              </Badge>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' && pathname?.startsWith(item.href + '/'));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
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
