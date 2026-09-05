'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RadioCardGroup } from '@/components/ui/RadioCard';
import { CheckboxCardGroup } from '@/components/ui/CheckboxCardGroup';
import { Card, CardContent } from '@/components/ui/Card';
import {
  US_STATES,
  BUSINESS_STRUCTURES,
  INDUSTRIES,
  BUSINESS_AGES,
  TRI_STATE_OPTIONS,
  LICENSE_OPTIONS,
  CREDIT_ACCOUNT_COUNT_OPTIONS,
  ANNUAL_REVENUE_RANGES,
  PERSONAL_CREDIT_RANGES,
  FUNDING_AMOUNTS,
  FUNDING_PURPOSES,
} from '@/lib/constants';
import { BusinessProfile } from '@/types/business';
import {
  Building,
  ShieldCheck,
  CreditCard,
  Target,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Info,
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Business', label: 'Business Details', icon: Building },
  { id: 2, name: 'Foundation', label: 'Foundation Check', icon: ShieldCheck },
  { id: 3, name: 'Credit', label: 'Business Credit', icon: CreditCard },
  { id: 4, name: 'Funding', label: 'Funding Goals', icon: Target },
  { id: 5, name: 'Finish', label: 'Review & Complete', icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { business, loading: businessLoading, saveBusinessProfile, saveDraft, getDraft } = useBusiness();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Prevent completed customers and admins from being forced through onboarding
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
        return;
      }
      if (!businessLoading && business && business.profileCompleted) {
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, business, businessLoading, router]);

  // Form State
  const [formData, setFormData] = useState<Partial<BusinessProfile>>({
    businessName: '',
    entityType: '',
    state: '',
    industry: '',
    businessAge: '',

    hasEIN: undefined,
    hasBusinessBankAccount: undefined,
    hasWebsite: undefined,
    hasBusinessPhone: undefined,
    hasBusinessEmail: undefined,
    hasBusinessAddress: undefined,
    hasBusinessLicense: undefined,
    hasDuns: undefined,

    hasBusinessCreditProfile: undefined,
    knowsBusinessCreditScore: undefined,
    businessCreditScore: '',
    businessCreditAccountCount: undefined,
    hasReportingAccounts: undefined,
    hasBusinessCreditCard: undefined,
    hasFundingHistory: undefined,

    annualRevenueRange: '',
    personalCreditRange: '',
    fundingAmount: '',
    fundingPurpose: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize draft or existing business data on mount
  useEffect(() => {
    const draft = getDraft();
    if (draft) {
      setFormData((prev) => ({ ...prev, ...draft }));
    } else if (business) {
      setFormData((prev) => ({ ...prev, ...business }));
    }
  }, [business, getDraft]);

  const updateField = (field: keyof BusinessProfile, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      saveDraft(next);
      return next;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.businessName?.trim()) {
      newErrors.businessName = 'Please enter your business name.';
    }
    if (!formData.entityType) {
      newErrors.entityType = 'Please select a business structure.';
    }
    if (!formData.state) {
      newErrors.state = 'Please select your state.';
    }
    if (!formData.industry) {
      newErrors.industry = 'Please select your industry.';
    }
    if (!formData.businessAge) {
      newErrors.businessAge = 'Please select your business age.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setSaveError(null);
    if (currentStep === 1) {
      if (!validateStep1()) return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep((prev) => Math.min(5, prev + 1));
  };

  const handleBack = () => {
    setSaveError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleComplete = async () => {
    setSubmitting(true);
    setSaveError(null);

    const result = await saveBusinessProfile({
      ...formData,
      profileCompleted: true,
      profileCompletedAt: new Date().toISOString(),
    });

    if (result.success) {
      router.push('/dashboard');
    } else {
      setSubmitting(false);
      setSaveError(result.error || "We couldn't save your information. Please try again.");
    }
  };

  // Helper counts for review screen (all answered questions count)
  const foundationCompletedCount = [
    formData.hasEIN,
    formData.hasBusinessBankAccount,
    formData.hasWebsite,
    formData.hasBusinessPhone,
    formData.hasBusinessEmail,
    formData.hasBusinessAddress,
    formData.hasBusinessLicense,
    formData.hasDuns,
  ].filter(Boolean).length;

  const creditCompletedCount = [
    formData.hasBusinessCreditProfile,
    formData.knowsBusinessCreditScore,
    formData.businessCreditAccountCount,
    formData.hasReportingAccounts,
    formData.hasBusinessCreditCard,
    formData.hasFundingHistory,
  ].filter(Boolean).length;

  const fundingCompletedCount = [
    formData.annualRevenueRange,
    formData.personalCreditRange,
    formData.fundingAmount,
    formData.fundingPurpose && formData.fundingPurpose.length > 0,
  ].filter(Boolean).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header & Logo with direct Return to Dashboard option */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-base shadow-xs">
                C
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-lg tracking-tight block">
                  Crediqly
                </span>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Business Onboarding Wizard
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Save &amp; Return to Dashboard
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>Step {currentStep} of 5</span>
              <span className="text-brand-700 font-bold">
                {STEPS[currentStep - 1].label}
              </span>
            </div>

            {/* Stepper Bar */}
            <div className="grid grid-cols-5 gap-2">
              {STEPS.map((step) => {
                const isCurrent = currentStep === step.id;
                const isPassed = currentStep > step.id;
                return (
                  <div key={step.id} className="flex flex-col gap-1.5">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isPassed
                          ? 'bg-emerald-500'
                          : isCurrent
                          ? 'bg-brand-600'
                          : 'bg-slate-200'
                      }`}
                    />
                    <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <span className={isCurrent ? 'text-brand-800 font-bold' : ''}>
                        {step.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {saveError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {saveError}
            </div>
          )}

          {/* STEP 1: BUSINESS INFORMATION */}
          {currentStep === 1 && (
            <Card className="shadow-sm">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Tell us about your business
                  </h1>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    Let&apos;s start with a few basic details so Crediqly can build your personalized business-credit roadmap.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <Input
                    label="Business Name"
                    required
                    value={formData.businessName || ''}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    placeholder="e.g. Acme Logistics LLC"
                    error={errors.businessName}
                    helperText="Enter the official or operating name of your business."
                  />

                  <Select
                    label="Business Structure"
                    required
                    value={formData.entityType || ''}
                    onChange={(e) => updateField('entityType', e.target.value)}
                    options={BUSINESS_STRUCTURES}
                    error={errors.entityType}
                    placeholder="Select legal entity structure"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="State"
                      required
                      value={formData.state || ''}
                      onChange={(e) => updateField('state', e.target.value)}
                      options={US_STATES}
                      error={errors.state}
                      placeholder="Select primary state"
                    />

                    <Select
                      label="Industry"
                      required
                      value={formData.industry || ''}
                      onChange={(e) => updateField('industry', e.target.value)}
                      options={INDUSTRIES}
                      error={errors.industry}
                      placeholder="Select your industry"
                    />
                  </div>

                  <Select
                    label="Business Age"
                    required
                    value={formData.businessAge || ''}
                    onChange={(e) => updateField('businessAge', e.target.value)}
                    options={BUSINESS_AGES}
                    error={errors.businessAge}
                    placeholder="Select how long your business has been operating"
                    helperText="No exact incorporation date needed initially."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: BUSINESS FOUNDATION */}
          {currentStep === 2 && (
            <Card className="shadow-sm">
              <CardContent className="p-6 sm:p-8 space-y-7">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>No Sensitive Data Requested</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Let&apos;s check your business foundation
                  </h1>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    These basic business details can affect your ability to establish business credit and evaluate funding options.
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  <div>
                    <RadioCardGroup
                      label="Do you have an EIN?"
                      description="We only need to know whether you have one. Do NOT enter your actual EIN."
                      options={TRI_STATE_OPTIONS}
                      value={formData.hasEIN || ''}
                      onChange={(v) => updateField('hasEIN', v)}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <RadioCardGroup
                      label="Do you have a business bank account?"
                      description="A dedicated commercial checking account separate from your personal finances."
                      options={TRI_STATE_OPTIONS}
                      value={formData.hasBusinessBankAccount || ''}
                      onChange={(v) => updateField('hasBusinessBankAccount', v)}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <RadioCardGroup
                      label="Do you have a business website?"
                      description="A public website or online landing page representing your business."
                      options={TRI_STATE_OPTIONS}
                      value={formData.hasWebsite || ''}
                      onChange={(v) => updateField('hasWebsite', v)}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <RadioCardGroup
                      label="Do you have a dedicated business phone number?"
                      description="A commercial phone line listed in directory assistance."
                      options={TRI_STATE_OPTIONS}
                      value={formData.hasBusinessPhone || ''}
                      onChange={(v) => updateField('hasBusinessPhone', v)}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <RadioCardGroup
                      label="Do you have a professional business email?"
                      description="e.g. name@yourbusiness.com rather than a personal @gmail.com address."
                      options={TRI_STATE_OPTIONS}
                      value={formData.hasBusinessEmail || ''}
                      onChange={(v) => updateField('hasBusinessEmail', v)}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <RadioCardGroup
                      label="Do you have a commercial business address?"
                      description="A physical commercial location, office, or registered commercial address."
                      options={TRI_STATE_OPTIONS}
                      value={formData.hasBusinessAddress || ''}
                      onChange={(v) => updateField('hasBusinessAddress', v)}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <RadioCardGroup
                      label="Do you have a business license if your industry/state requires one?"
                      description="State, county, or municipal permits necessary for legal operations."
                      options={LICENSE_OPTIONS}
                      value={formData.hasBusinessLicense || ''}
                      onChange={(v) => updateField('hasBusinessLicense', v)}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <RadioCardGroup
                      label="Do you have a D-U-N-S number?"
                      description="Dun & Bradstreet identifier. We do not need your actual number yet."
                      options={TRI_STATE_OPTIONS}
                      value={formData.hasDuns || ''}
                      onChange={(v) => updateField('hasDuns', v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: BUSINESS CREDIT */}
          {currentStep === 3 && (
            <Card className="shadow-sm">
              <CardContent className="p-6 sm:p-8 space-y-7">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Let&apos;s understand your current business credit
                  </h1>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    Don&apos;t worry if you don&apos;t know the answers. You can select &ldquo;Not sure.&rdquo;
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  <div>
                    <RadioCardGroup
                      label="Do you currently have a business credit profile?"
                      options={TRI_STATE_OPTIONS}
                      value={formData.hasBusinessCreditProfile || ''}
                      onChange={(v) => updateField('hasBusinessCreditProfile', v)}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <RadioCardGroup
                      label="Do you know your business credit score?"
                      options={TRI_STATE_OPTIONS}
                      value={formData.knowsBusinessCreditScore || ''}
                      onChange={(v) => updateField('knowsBusinessCreditScore', v)}
                    />

                    {formData.knowsBusinessCreditScore === 'yes' && (
                      <div className="mt-3 p-4 rounded-xl bg-brand-50/60 border border-brand-200 space-y-2">
                        <Input
                          label="Enter your score if you know it (Optional)"
                          type="number"
                          value={formData.businessCreditScore || ''}
                          onChange={(e) => updateField('businessCreditScore', e.target.value)}
                          placeholder="e.g. 75"
                        />
                        <p className="text-[11px] text-slate-500 italic flex items-start gap-1">
                          <Info className="w-3.5 h-3.5 text-brand-600 flex-shrink-0 mt-0.5" />
                          <span>
                            Your entered score is for informational purposes only. Crediqly does not verify or represent this as an official bureau score.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <RadioCardGroup
                      label="How many business credit accounts do you currently have?"
                      options={CREDIT_ACCOUNT_COUNT_OPTIONS}
                      value={formData.businessCreditAccountCount || ''}
                      onChange={(v) => updateField('businessCreditAccountCount', v)}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <RadioCardGroup
                      label="Do you currently have accounts that report to business credit bureaus?"
                      description="Vendor credit, net-30 suppliers, or commercial lenders that report payment history."
                      options={TRI_STATE_OPTIONS}
                      value={formData.hasReportingAccounts || ''}
                      onChange={(v) => updateField('hasReportingAccounts', v)}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <RadioCardGroup
                      label="Do you currently have a business credit card?"
                      options={TRI_STATE_OPTIONS}
                      value={formData.hasBusinessCreditCard || ''}
                      onChange={(v) => updateField('hasBusinessCreditCard', v)}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <RadioCardGroup
                      label="Have you ever applied for business funding?"
                      options={TRI_STATE_OPTIONS}
                      value={formData.hasFundingHistory || ''}
                      onChange={(v) => updateField('hasFundingHistory', v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4: FUNDING INFORMATION */}
          {currentStep === 4 && (
            <Card className="shadow-sm">
              <CardContent className="p-6 sm:p-8 space-y-7">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Tell us about your funding goals
                  </h1>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    This helps Crediqly understand what you&apos;re working toward.
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  <Select
                    label="Annual Business Revenue"
                    value={formData.annualRevenueRange || ''}
                    onChange={(e) => updateField('annualRevenueRange', e.target.value)}
                    options={ANNUAL_REVENUE_RANGES}
                    placeholder="Select approximate annual revenue range"
                    helperText="Estimates only. No exact financial statements needed."
                  />

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <Select
                      label="Approximate Personal Credit Range"
                      value={formData.personalCreditRange || ''}
                      onChange={(e) => updateField('personalCreditRange', e.target.value)}
                      options={PERSONAL_CREDIT_RANGES}
                      placeholder="Select your general credit tier"
                      helperText="Crediqly does not request your actual credit report or SSN."
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Select
                      label="How much funding are you looking for?"
                      value={formData.fundingAmount || ''}
                      onChange={(e) => updateField('fundingAmount', e.target.value)}
                      options={FUNDING_AMOUNTS}
                      placeholder="Select desired funding amount"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <CheckboxCardGroup
                      label="What is the primary purpose of the funding?"
                      description="Select all that apply to help us tailor your roadmap."
                      options={FUNDING_PURPOSES}
                      values={formData.fundingPurpose || []}
                      onChange={(vals) => updateField('fundingPurpose', vals)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5: REVIEW & COMPLETE */}
          {currentStep === 5 && (
            <Card className="shadow-sm">
              <CardContent className="p-6 sm:p-8 space-y-7">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Your business profile is almost ready
                  </h1>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    Review your details below. You can edit any of this information anytime from your Business Profile.
                  </p>
                </div>

                {/* Profile Summary Card */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs font-medium text-slate-500 block">Business Name</span>
                      <span className="font-bold text-slate-900 text-base">
                        {formData.businessName || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-slate-500 block">Structure</span>
                      <span className="font-semibold text-slate-800">
                        {formData.entityType || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-slate-500 block">State</span>
                      <span className="font-semibold text-slate-800">
                        {formData.state || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-slate-500 block">Industry</span>
                      <span className="font-semibold text-slate-800">
                        {formData.industry || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-slate-500 block">Business Age</span>
                      <span className="font-semibold text-slate-800">
                        {formData.businessAge || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-slate-500 block">Annual Revenue</span>
                      <span className="font-semibold text-slate-800">
                        {formData.annualRevenueRange || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-slate-500 block">Funding Goal</span>
                      <span className="font-semibold text-slate-800">
                        {formData.fundingAmount || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-slate-500 block">Funding Purpose</span>
                      <span className="font-semibold text-slate-800">
                        {formData.fundingPurpose && formData.fundingPurpose.length > 0
                          ? formData.fundingPurpose.join(', ')
                          : 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Completion Indicators (Not final scoring!) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Profile Completion Check
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="text-xs font-semibold text-slate-600 mb-1">
                        Business Foundation
                      </div>
                      <div className="text-lg font-extrabold text-brand-700">
                        {foundationCompletedCount} of 8 completed
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="text-xs font-semibold text-slate-600 mb-1">
                        Business Credit
                      </div>
                      <div className="text-lg font-extrabold text-brand-700">
                        {creditCompletedCount} of 6 completed
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="text-xs font-semibold text-slate-600 mb-1">
                        Funding Profile
                      </div>
                      <div className="text-lg font-extrabold text-brand-700">
                        {fundingCompletedCount} of 4 completed
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center italic">
                    These are profile completion indicators, not your credit score.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons: Back, Continue / Complete */}
          <div className="mt-6 flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {currentStep < 5 ? (
                <Button variant="primary" onClick={handleNext} className="gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  isLoading={submitting}
                  size="lg"
                  className="px-8 shadow-md"
                >
                  Complete My Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
