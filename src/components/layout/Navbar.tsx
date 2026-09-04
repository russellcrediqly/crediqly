'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Menu, X, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-navy-900 flex items-center justify-center text-white font-black text-lg shadow-sm">
              C
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 font-sans">
                Crediqly
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase text-brand-700 -mt-1">
                Business Credit & Funding
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How It Works
            </Link>
            <Link href="#foundation" className="hover:text-slate-900 transition-colors">
              Credit Foundation
            </Link>
            <Link href="#readiness" className="hover:text-slate-900 transition-colors">
              Funding Readiness
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Sensitive Data</span>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>
                <Button variant="primary" size="sm">
                  {user.role === 'admin' ? 'Admin Console' : 'Go to Dashboard'}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              How It Works
            </Link>
            <Link
              href="#foundation"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Credit Foundation
            </Link>
            <Link
              href="#readiness"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Funding Readiness
            </Link>
          </div>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  {user.role === 'admin' ? 'Admin Console' : 'Go to Dashboard'}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
