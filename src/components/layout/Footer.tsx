import React from 'react';
import Link from 'next/link';
import { APP_VERSION } from '@/lib/version';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-base">
                C
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Crediqly</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Crediqly gives U.S. small-business owners a personalized step-by-step roadmap to build their business credit profile and prepare for potential funding opportunities.
            </p>
            <div className="text-xs text-slate-400 pt-2">
              <span className="text-brand-400 font-semibold">Privacy First:</span> Zero sensitive data requested. No SSN, no bank logins, no KYC required to start.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/business" className="hover:text-white transition-colors">
                  My Business Profile
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing &amp; Plans
                </Link>
              </li>
              <li>
                <Link href="/signin" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-12 pt-8 border-t border-navy-800 text-xs text-slate-400 space-y-3 leading-relaxed">
          <p>
            <strong>Disclaimer:</strong> Crediqly is an educational and business-credit readiness platform. Crediqly is not a lender, credit repair organization, or credit reporting agency. Crediqly does not guarantee funding approval, credit line amounts, or credit score increases. All financial decisions are made solely by prospective lenders and bureaus based on their independent criteria.
          </p>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400">
            <div className="flex items-center gap-2.5">
              <p>© {new Date().getFullYear()} Crediqly. All rights reserved.</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-navy-900 text-slate-400 border border-navy-700/80">
                v{APP_VERSION}
              </span>
            </div>
            <p>Built for U.S. Small-Business Owners.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

