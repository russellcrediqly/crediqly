'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';

const faqs = [
  {
    question: 'What is Crediqly and how does it help my business?',
    answer:
      'Crediqly is a business funding readiness platform for U.S. small business owners. We audit your commercial fundability across 14 deterministic milestones, help you address lender underwriting gaps, guide you through building reporting corporate tradelines under your EIN, and surface pre-matched commercial financing options.',
  },
  {
    question: 'Does Crediqly require my SSN or personal banking login?',
    answer:
      'Never. Crediqly uses a zero-sensitive-data architecture. We evaluate your fundability using publicly verifiable commercial entity records: EIN, state SOS filings, operating age, business address, and self-reported deposit tiers. We never ask for, collect, or store your Social Security Number, banking passwords, or personal tax returns.',
  },
  {
    question: 'How quickly can my business achieve an 80 Paydex score?',
    answer:
      'Following our Tier-1 Net-30 vendor roadmap — opening 3–5 starter trade accounts with vendors like Uline, Grainger, and Quill that report monthly prompt payments to D&B and Experian — founders typically generate an initial Paydex score within 30 to 60 days of account opening.',
  },
  {
    question: 'Can I really get started 100% free with no credit card?',
    answer:
      'Yes. The Free plan includes your baseline 0–100 Funding Readiness Score, Stage 1 roadmap preview, and access to the Tier-1 Net-30 vendor catalog — all with no credit card required. Meaningful advanced analysis and full roadmap access become available with the Foundation plan.',
  },
  {
    question: 'What is the difference between Foundation and Guided?',
    answer:
      'Foundation ($39.99/mo) gives you full platform access: all 4 roadmap stages, complete tradeline directories, bank underwriting guidelines, AI Mentor, and 17+ lender marketplace. Guided ($149.99/mo) adds a monthly personal strategy session with an expert, priority support, and guided strategy review to keep you accountable and on track.',
  },
  {
    question: 'Does Crediqly guarantee loan approvals or credit score improvements?',
    answer:
      'No. Crediqly is an educational readiness platform, not a lender, credit repair organization, or credit reporting bureau. We never make approval claims or guarantee score outcomes. All credit decisions are made solely by independent financial institutions based on their own underwriting criteria.',
  },
  {
    question: 'How does corporate credit protect my personal credit score?',
    answer:
      'True commercial credit accounts report strictly to corporate bureaus (D&B, Experian Business, Equifax Commercial) under your company EIN. Business balances stay off your personal credit file, so high utilization, late payments, or large balances on your business credit never appear on your personal consumer report.',
  },
];

export const FaqSection: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-32 bg-slate-900 text-white relative overflow-hidden border-t border-white/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">Frequently Asked Questions</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Clear, candid answers.
          </h2>
          <p className="text-base text-slate-400">
            Everything you need to know about building business credit and preparing for commercial funding.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = open === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  isOpen
                    ? 'border-brand-500/40 bg-white/4'
                    : 'border-white/6 bg-white/2 hover:border-white/10 hover:bg-white/3'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="w-full px-5 py-4 sm:px-6 sm:py-5 text-left flex items-center justify-between gap-4 group"
                  aria-expanded={isOpen}
                >
                  <span className={`text-sm sm:text-base font-medium ${isOpen ? 'text-white' : 'text-slate-300 group-hover:text-white'} transition-colors`}>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-400' : 'text-slate-600'
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer prompt */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white/3 border border-white/6 text-sm">
          <span className="text-slate-400">Have a question about your specific business?</span>
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 text-brand-300 hover:text-white font-medium transition-colors shrink-0"
          >
            Compare Plans & Capabilities
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
