import React from 'react';
import Link from 'next/link';
import { APP_VERSION } from '@/lib/version';
import { CrediqlyLogo } from '@/components/common/CrediqlyLogo';

const platformLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/business', label: 'My Business Profile' },
  { href: '/roadmap', label: 'Credit Roadmap' },
  { href: '/pricing', label: 'Pricing & Plans' },
  { href: '/signin', label: 'Sign In' },
  { href: '/signup', label: 'Create Account' },
];

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <CrediqlyLogo size="md" variant="dark" showSubtitle={false} />
            </Link>
            <p className="text-sm text-slate-500 max-w-md leading-relaxed">
              Crediqly gives U.S. small-business owners a personalized step-by-step roadmap to build their business credit profile and prepare for potential funding opportunities.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="text-brand-500 font-medium">Privacy First:</span>{' '}
              Zero sensitive data requested. No SSN, no bank logins, no KYC required to start.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Trust & Legal
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer + Copyright */}
        <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
            <strong className="text-slate-500">Disclaimer:</strong> Crediqly is an educational and business-credit readiness platform.
            Crediqly is not a lender, credit repair organization, or credit reporting agency.
            Crediqly does not guarantee funding approval, credit line amounts, or credit score increases.
            All financial decisions are made solely by prospective lenders and bureaus based on their independent criteria.
          </p>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <span>© {new Date().getFullYear()} Crediqly. All rights reserved.</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/4 text-slate-600 border border-white/6">
                v{APP_VERSION}
              </span>
            </div>
            <span>Built for U.S. Small-Business Owners.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
