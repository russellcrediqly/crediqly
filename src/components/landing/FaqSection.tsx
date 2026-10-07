'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: 'What is Crediqly and how does it help my business?',
      answer:
        'Crediqly is an intelligent business-credit and funding readiness operating system for U.S. small business owners. We help you audit commercial fundability, address lender underwriting gaps, build reporting corporate tradelines under your EIN, and discover pre-matched commercial financing — through a deterministic 14-milestone roadmap.',
    },
    {
      question: 'Does Crediqly require my SSN or personal banking login passwords?',
      answer:
        'Never. Crediqly is built with a zero-sensitive-data architecture. We evaluate your fundability using publicly verifiable commercial entity records (EIN, state SOS filings, operating age, business address, and self-reported deposit tiers). We never ask for, collect, or store your Social Security Number, personal banking passwords, or personal tax returns.',
    },
    {
      question: 'How quickly can my business achieve an 80 Paydex score with Dun & Bradstreet?',
      answer:
        'By following our Tier-1 Net-30 vendor roadmap (opening 3–5 starter trade accounts with vendors like Uline, Grainger, and Quill that report monthly prompt payments to D&B and Experian Commercial), founders typically generate an initial Paydex score within 30 to 60 days.',
    },
    {
      question: 'Can I really get started 100% free with no credit card?',
      answer:
        'Yes. You can create an account 100% free with no credit card required. The free starter tier includes your baseline 0–100 Funding Readiness Score, 21-point fundability compliance audit, Stage 1 roadmap tasks, and access to starter Tier-1 Net-30 vendor application links.',
    },
    {
      question: 'Does Crediqly guarantee loan approvals or specific credit scores?',
      answer:
        'No. Crediqly is an educational readiness and organization platform, not a direct lender, broker, or credit reporting bureau. We never make false approval claims or guarantee score outcomes. Final credit decisions are made solely by independent underwriting financial institutions based on their private criteria.',
    },
    {
      question: 'How does corporate credit protect my personal credit score?',
      answer:
        'When you finance equipment, inventory, or operations using personal credit cards, high utilization severely penalizes your personal consumer score. True commercial credit accounts report strictly to corporate bureaus (D&B, Experian Business, Equifax Commercial) under your company EIN. Your balances remain off your personal credit file, protecting your personal score.',
    },
    {
      question: 'What is the difference between Crediqly Pro and Done-For-You Advisory?',
      answer:
        'Crediqly Pro ($39/mo) gives you full access to our self-directed software suite: all 4 roadmap stages, full tradeline directories, bank underwriting guidelines, pre-qualification simulator, and AI Mentor. Premium Advisory ($499 setup + $149/mo) pairs you with a dedicated commercial credit strategist for monthly 1-on-1 video calls, concierge document preparation, and direct lender introduction audits.',
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-32 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-brand-300">
            <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-extrabold uppercase tracking-wider text-[10px]">
              Frequently Asked Questions
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Clear, candid answers.
          </h2>

          <p className="text-base text-slate-300">
            Everything you need to know about building commercial credit and preparing for funding.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-slate-950 border-brand-500/80 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-white text-sm sm:text-base cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Prompt */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>Have a question about your specific business entity?</span>
          <Link href="/pricing" className="text-brand-300 hover:text-white font-bold flex items-center gap-1">
            <span>Compare Plans &amp; Capabilities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
