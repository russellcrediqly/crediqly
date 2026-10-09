'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { CrediqlyLogo } from '@/components/common/CrediqlyLogo';
import { Menu, X } from 'lucide-react';

export interface NavbarProps {
  variant?: 'light' | 'dark';
}

export const Navbar: React.FC<NavbarProps> = ({ variant = 'light' }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isDark = variant === 'dark';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/#features', label: 'Platform' },
    { href: '/#route-map', label: 'Roadmap' },
    { href: '/pricing', label: 'Pricing', highlight: true },
  ];

  return (
    <nav
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isDark
          ? scrolled
            ? 'bg-slate-950/98 border-b border-slate-800/80 shadow-xl shadow-slate-950/40'
            : 'bg-slate-950/80 border-b border-transparent'
          : scrolled
          ? 'bg-white/98 border-b border-slate-200 shadow-sm'
          : 'bg-white/90 border-b border-transparent'
      } backdrop-blur-md`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <CrediqlyLogo
              size="md"
              variant={isDark ? 'dark' : 'light'}
              showSubtitle={false}
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  link.highlight
                    ? isDark
                      ? 'text-brand-300 hover:text-white hover:bg-slate-800 font-semibold'
                      : 'text-brand-700 hover:text-brand-900 hover:bg-brand-50 font-semibold'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-brand-600 hover:bg-brand-500 text-white font-semibold"
                >
                  {user.role === 'admin' ? 'Admin Console' : 'Go to Dashboard'}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={
                      isDark
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    }
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-5 shadow-sm shadow-brand-600/30"
                  >
                    Start Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden border-t ${
            isDark
              ? 'bg-slate-950 border-slate-800'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  link.highlight
                    ? isDark
                      ? 'text-brand-300 bg-brand-950/40 hover:bg-brand-950/70'
                      : 'text-brand-700 bg-brand-50 hover:bg-brand-100'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div
            className={`px-4 pb-5 pt-2 border-t flex flex-col gap-2 ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}
          >
            {user ? (
              <Link
                href={user.role === 'admin' ? '/admin' : '/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="primary" className="w-full">
                  {user.role === 'admin' ? 'Admin Console' : 'Go to Dashboard'}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className={`w-full ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : ''}`}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="primary"
                    className="w-full bg-brand-600 hover:bg-brand-500"
                  >
                    Start Free — No Card Required
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
