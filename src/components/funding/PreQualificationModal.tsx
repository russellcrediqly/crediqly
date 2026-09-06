'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RotateCcw,
  DollarSign,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { BusinessProfile } from '@/types/business';

export interface PrequalCriteria {
  fundingAmount: string;
  annualRevenue: string;
  businessAge: string;
  industry: string;
  creditProfile: string;
  fundingPurpose: string;
}

interface PreQualificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Partial<BusinessProfile> | null;
  onApplyCriteria: (criteria: PrequalCriteria) => void;
  onResetCriteria?: () => void;
  currentCriteria?: PrequalCriteria | null;
}

export const PreQualificationModal: React.FC<PreQualificationModalProps> = ({
  isOpen,
  onClose,
  profile,
  onApplyCriteria,
  onResetCriteria,
  currentCriteria,
}) => {
  // Prepopulate from existing profile or current criteria
  const [fundingAmount, setFundingAmount] = useState<string>(
    currentCriteria?.fundingAmount || profile?.fundingAmount || '$25K–$50K'
  );
  const [annualRevenue, setAnnualRevenue] = useState<string>(
    currentCriteria?.annualRevenue || profile?.annualRevenueRange || '$50,000–$100,000'
  );
  const [businessAge, setBusinessAge] = useState<string>(
    currentCriteria?.businessAge || profile?.businessAge || '1–2 years'
  );
  const [industry, setIndustry] = useState<string>(
    currentCriteria?.industry || profile?.industry || 'General'
  );
  const [creditProfile, setCreditProfile] = useState<string>(
    currentCriteria?.creditProfile || profile?.personalCreditRange || '650–699'
  );
  const [fundingPurpose, setFundingPurpose] = useState<string>(
    currentCriteria?.fundingPurpose ||
      (Array.isArray(profile?.fundingPurpose) ? profile.fundingPurpose[0] : 'Working Capital') ||
      'Working Capital'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyCriteria({
      fundingAmount,
      annualRevenue,
      businessAge,
      industry,
      creditProfile,
      fundingPurpose,
    });
    onClose();
  };

  const handleReset = () => {
    if (onResetCriteria) onResetCriteria();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>ZERO HARD INQUIRY • PRE-QUALIFICATION</span>
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Check Your Preliminary Funding Matches
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Answer basic parameters to estimate which institutional financing options, lines of credit, and grants fit your profile.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Transparency Callout */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Safe Assessment:</strong> No hard credit pull is ever performed. Final approval is determined by each independent funding provider.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Funding Amount Needed */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Funding Target Needed
              </label>
              <select
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <option value="Under $10K">Under $10,000 (Micro-Capital)</option>
                <option value="$10K–$25K">$10,000 – $25,000</option>
                <option value="$25K–$50K">$25,000 – $50,000</option>
                <option value="$50K–$100K">$50,000 – $100,000</option>
                <option value="$100K+">$100,000+ (Commercial Scale)</option>
              </select>
            </div>

            {/* 2. Annual Revenue */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Estimated Annual Revenue
              </label>
              <select
                value={annualRevenue}
                onChange={(e) => setAnnualRevenue(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <option value="Pre-revenue">Pre-revenue / Under $10K</option>
                <option value="$10,000–$50,000">$10,000 – $50,000</option>
                <option value="$50,000–$100,000">$50,000 – $100,000</option>
                <option value="$100,000–$250,000">$100,000 – $250,000</option>
                <option value="$250,000+">$250,000+ (Established Cash Flow)</option>
              </select>
            </div>

            {/* 3. Business Age */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Time in Business
              </label>
              <select
                value={businessAge}
                onChange={(e) => setBusinessAge(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <option value="Less than 6 months">Less than 6 months</option>
                <option value="6–12 months">6–12 months</option>
                <option value="1–2 years">1–2 years</option>
                <option value="2–5 years">2–5 years</option>
                <option value="5+ years">5+ years (Seasoned)</option>
              </select>
            </div>

            {/* 4. Personal Credit Score Tier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Personal Credit Score Range
              </label>
              <select
                value={creditProfile}
                onChange={(e) => setCreditProfile(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <option value="Under 600">Under 600 (Rebuilding)</option>
                <option value="600–649">600–649 (Fair)</option>
                <option value="650–699">650–699 (Good)</option>
                <option value="700+">700+ (Excellent / Prime)</option>
              </select>
            </div>

            {/* 5. Industry */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Primary Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <option value="General">General Commercial / Services</option>
                <option value="Retail / E-commerce">Retail / E-commerce</option>
                <option value="Construction / Trades">Construction / Trades</option>
                <option value="Trucking / Logistics">Trucking / Transportation</option>
                <option value="Healthcare / Professional">Healthcare / Professional</option>
                <option value="Restaurant / Hospitality">Restaurant / Hospitality</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* 6. Purpose of Funding */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Primary Capital Purpose
              </label>
              <select
                value={fundingPurpose}
                onChange={(e) => setFundingPurpose(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <option value="Working Capital">Working Capital / Cash Flow</option>
                <option value="Equipment">Equipment / Machinery</option>
                <option value="Expansion">Expansion / Growth</option>
                <option value="Inventory">Inventory / Supplies</option>
                <option value="Payroll">Payroll Buffer</option>
                <option value="Debt Refinancing">Debt Refinancing</option>
                <option value="Everyday Expenses">Everyday Operating Expenses</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {currentCriteria && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Profile Defaults</span>
              </button>
            )}
            <div className="flex items-center gap-2.5 w-full sm:w-auto ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs font-semibold w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs gap-1.5 w-full sm:w-auto shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Check My Options</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
