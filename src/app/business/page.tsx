'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RadioCardGroup } from '@/components/ui/RadioCard';
import { CheckboxCardGroup } from '@/components/ui/CheckboxCardGroup';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionInactiveNotice } from '@/components/common/SectionInactiveNotice';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { calculateReadiness } from '@/lib/scoring';
import { calculateMilestoneReadiness } from '@/lib/readiness/readinessMilestoneEngine';
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
  Building2,
  ShieldCheck,
  CreditCard,
  Target,
  Edit2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export default function BusinessProfilePage() {
  const { business, saveBusinessProfile, loading } = useBusiness();
  const { sections } = usePlatformSections();

  // Section Editing State
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<BusinessProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Compute live readiness scores
  const readiness = calculateReadiness(business);
  const milestoneRes = calculateMilestoneReadiness(business);
  const lastCalculatedText = business?.readinessUpdatedAt || business?.updatedAt
    ? new Date(business.readinessUpdatedAt || business.updatedAt!).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Current Session';

  const startEditing = (section: string) => {
    setSaveMessage(null);
    setSaveError(null);
    setEditingSection(section);
    setEditFormData({ ...(business || {}) });
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditFormData({});
    setSaveError(null);
  };

  const updateEditField = (field: keyof BusinessProfile, value: any) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSection = async () => {
    setIsSaving(true);
    setSaveError(null);

    const res = await saveBusinessProfile(editFormData);
    setIsSaving(false);

    if (res.success) {
      setEditingSection(null);
      setSaveMessage('Section updated successfully.');
      setTimeout(() => setSaveMessage(null), 3500);
    } else {
      setSaveError(res.error || "We couldn't save your information. Please try again.");
    }
  };

  const formatDisplay = (val?: string) => {
    if (!val) return 'Not answered';
    if (val === 'not_sure') return 'Not sure';
    if (val === 'yes') return 'Yes';
    if (val === 'no') return 'No';
    if (val === 'not_applicable') return 'Not applicable';
    return val;
  };

  if (sections.business_profile === false) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <SectionInactiveNotice
            title="Business Profile Temporarily Inactive"
            description="Business profile management is currently disabled by the administrator. Please return to your main dashboard."
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Business Profile
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage and update your business foundation and readiness records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {business?.profileCompleted ? (
                <Badge variant="success" className="px-3 py-1 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Profile Complete
                </Badge>
              ) : (
                <Link href="/onboarding">
                  <Button variant="primary" size="sm">
                    Complete Onboarding
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Alert Messages */}
          {saveMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveMessage}</span>
            </div>
          )}

          {saveError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Privacy Note */}
          <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Privacy Assurance:</strong> Crediqly does not store your SSN, full bank credentials, or tax filings.
            </span>
          </div>

          {/* READINESS SUMMARY SECTION */}
          <Card className="border-brand-200 bg-gradient-to-br from-brand-50/50 via-white to-teal-50/30">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Current Readiness Scores</h3>
                  <p className="text-xs text-slate-500">
                    Automatically recalculated as you update and save your business profile.
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Last calculated: <span className="font-semibold text-slate-600">{lastCalculatedText}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border-2 border-brand-300 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Readiness Journey</span>
                    <span className="text-xl font-black text-brand-600">
                      {milestoneRes.score}%
                    </span>
                  </div>
                  <ProgressBar
                    value={milestoneRes.score}
                    color="brand"
                    showPercentage={false}
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                    <span>Stage: {milestoneRes.currentStage}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">Business Foundation</span>
                    <span className="text-xl font-black text-brand-700">
                      {readiness.businessReadiness.score}%
                    </span>
                  </div>
                  <ProgressBar
                    value={readiness.businessReadiness.score}
                    color="brand"
                    showPercentage={false}
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Level: {readiness.businessReadiness.level}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">Credit Tradelines</span>
                    <span className="text-xl font-black text-emerald-700">
                      {readiness.creditReadiness.score}%
                    </span>
                  </div>
                  <ProgressBar
                    value={readiness.creditReadiness.score}
                    color="emerald"
                    showPercentage={false}
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Level: {readiness.creditReadiness.level}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 1: BUSINESS INFORMATION */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>Core company entity details and age</CardDescription>
                </div>
              </div>

              {editingSection !== 'info' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing('info')}
                  className="gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                    className="gap-1 text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveSection}
                    isLoading={isSaving}
                    className="gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {editingSection === 'info' ? (
                <div className="space-y-4 pt-2">
                  <Input
                    label="Business Name"
                    required
                    value={editFormData.businessName || ''}
                    onChange={(e) => updateEditField('businessName', e.target.value)}
                  />
                  <Select
                    label="Business Structure"
                    value={editFormData.entityType || ''}
                    onChange={(e) => updateEditField('entityType', e.target.value)}
                    options={BUSINESS_STRUCTURES}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="State"
                      value={editFormData.state || ''}
                      onChange={(e) => updateEditField('state', e.target.value)}
                      options={US_STATES}
                    />
                    <Select
                      label="Industry"
                      value={editFormData.industry || ''}
                      onChange={(e) => updateEditField('industry', e.target.value)}
                      options={INDUSTRIES}
                    />
                  </div>
                  <Select
                    label="Business Age"
                    value={editFormData.businessAge || ''}
                    onChange={(e) => updateEditField('businessAge', e.target.value)}
                    options={BUSINESS_AGES}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Business Name</span>
                    <span className="font-semibold text-slate-900">
                      {business?.businessName || 'Not configured'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Legal Structure</span>
                    <span className="font-semibold text-slate-900">
                      {business?.entityType || 'Not configured'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">State</span>
                    <span className="font-semibold text-slate-900">
                      {business?.state || 'Not configured'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Industry</span>
                    <span className="font-semibold text-slate-900">
                      {business?.industry || 'Not configured'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Business Age</span>
                    <span className="font-semibold text-slate-900">
                      {business?.businessAge || 'Not configured'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 2: BUSINESS FOUNDATION */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Business Foundation</CardTitle>
                  <CardDescription>
                    Essential business credit readiness indicators
                  </CardDescription>
                </div>
              </div>

              {editingSection !== 'foundation' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing('foundation')}
                  className="gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                    className="gap-1 text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveSection}
                    isLoading={isSaving}
                    className="gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {editingSection === 'foundation' ? (
                <div className="space-y-5 pt-2">
                  <RadioCardGroup
                    label="Do you have an EIN?"
                    options={TRI_STATE_OPTIONS}
                    value={editFormData.hasEIN || ''}
                    onChange={(v) => updateEditField('hasEIN', v)}
                  />
                  <RadioCardGroup
                    label="Do you have a business bank account?"
                    options={TRI_STATE_OPTIONS}
                    value={editFormData.hasBusinessBankAccount || ''}
                    onChange={(v) => updateEditField('hasBusinessBankAccount', v)}
                  />
                  <RadioCardGroup
                    label="Do you have a business website?"
                    options={TRI_STATE_OPTIONS}
                    value={editFormData.hasWebsite || ''}
                    onChange={(v) => updateEditField('hasWebsite', v)}
                  />
                  <RadioCardGroup
                    label="Do you have a dedicated business phone number?"
                    options={TRI_STATE_OPTIONS}
                    value={editFormData.hasBusinessPhone || ''}
                    onChange={(v) => updateEditField('hasBusinessPhone', v)}
                  />
                  <RadioCardGroup
                    label="Do you have a professional business email?"
                    options={TRI_STATE_OPTIONS}
                    value={editFormData.hasBusinessEmail || ''}
                    onChange={(v) => updateEditField('hasBusinessEmail', v)}
                  />
                  <RadioCardGroup
                    label="Do you have a commercial business address?"
                    options={TRI_STATE_OPTIONS}
                    value={editFormData.hasBusinessAddress || ''}
                    onChange={(v) => updateEditField('hasBusinessAddress', v)}
                  />
                  <RadioCardGroup
                    label="Do you have a required business license?"
                    options={LICENSE_OPTIONS}
                    value={editFormData.hasBusinessLicense || ''}
                    onChange={(v) => updateEditField('hasBusinessLicense', v)}
                  />
                  <RadioCardGroup
                    label="Do you have a D-U-N-S number?"
                    options={TRI_STATE_OPTIONS}
                    value={editFormData.hasDuns || ''}
                    onChange={(v) => updateEditField('hasDuns', v)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Has EIN</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.hasEIN)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Business Bank Account</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.hasBusinessBankAccount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Business Website</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.hasWebsite)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Dedicated Phone Line</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.hasBusinessPhone)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Professional Email</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.hasBusinessEmail)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Commercial Address</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.hasBusinessAddress)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Business License</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.hasBusinessLicense)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">D-U-N-S Number</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.hasDuns)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 3: BUSINESS CREDIT */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Business Credit</CardTitle>
                  <CardDescription>
                    Current credit accounts, reporting status, and history
                  </CardDescription>
                </div>
              </div>

              {editingSection !== 'credit' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing('credit')}
                  className="gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                    className="gap-1 text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveSection}
                    isLoading={isSaving}
                    className="gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {editingSection === 'credit' ? (
                <div className="space-y-5 pt-2">
                  <RadioCardGroup
                    label="Do you currently have a business credit profile?"
                    options={TRI_STATE_OPTIONS}
                    value={editFormData.hasBusinessCreditProfile || ''}
                    onChange={(v) => updateEditField('hasBusinessCreditProfile', v)}
                  />
                  <RadioCardGroup
                    label="Do you know your business credit score?"
                    options={TRI_STATE_OPTIONS}
                    value={editFormData.knowsBusinessCreditScore || ''}
                    onChange={(v) => updateEditField('knowsBusinessCreditScore', v)}
                  />
                  {editFormData.knowsBusinessCreditScore === 'yes' && (
                    <Input
                      label="Self-reported business credit score (Optional)"
                      type="number"
                      value={editFormData.businessCreditScore || ''}
                      onChange={(e) => updateEditField('businessCreditScore', e.target.value)}
                      placeholder="e.g. 75"
                      helperText="For informational tracking only. Crediqly does not represent this as an official bureau score."
                    />
                  )}
                  <RadioCardGroup
                    label="How many business credit accounts do you currently have?"
                    options={CREDIT_ACCOUNT_COUNT_OPTIONS}
                    value={editFormData.businessCreditAccountCount || ''}
                    onChange={(v) => updateEditField('businessCreditAccountCount', v)}
                  />
                  <RadioCardGroup
                    label="Do you currently have accounts that report to credit bureaus?"
                    options={TRI_STATE_OPTIONS}
                    value={editFormData.hasReportingAccounts || ''}
                    onChange={(v) => updateEditField('hasReportingAccounts', v)}
                  />
                  <RadioCardGroup
                    label="Do you currently have a business credit card?"
                    options={TRI_STATE_OPTIONS}
                    value={editFormData.hasBusinessCreditCard || ''}
                    onChange={(v) => updateEditField('hasBusinessCreditCard', v)}
                  />
                  <RadioCardGroup
                    label="Have you ever applied for business funding?"
                    options={TRI_STATE_OPTIONS}
                    value={editFormData.hasFundingHistory || ''}
                    onChange={(v) => updateEditField('hasFundingHistory', v)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Credit Profile Established</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.hasBusinessCreditProfile)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Knows Credit Score</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.knowsBusinessCreditScore)}
                      {business?.businessCreditScore ? ` (${business.businessCreditScore})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Credit Accounts Count</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.businessCreditAccountCount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Reporting Accounts</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.hasReportingAccounts)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Business Credit Card</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.hasBusinessCreditCard)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Funding History</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplay(business?.hasFundingHistory)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 4: FUNDING GOALS */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Funding Goals</CardTitle>
                  <CardDescription>
                    Revenue ranges and target capital purposes
                  </CardDescription>
                </div>
              </div>

              {editingSection !== 'funding' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing('funding')}
                  className="gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                    className="gap-1 text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveSection}
                    isLoading={isSaving}
                    className="gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {editingSection === 'funding' ? (
                <div className="space-y-4 pt-2">
                  <Select
                    label="Annual Business Revenue"
                    value={editFormData.annualRevenueRange || ''}
                    onChange={(e) => updateEditField('annualRevenueRange', e.target.value)}
                    options={ANNUAL_REVENUE_RANGES}
                  />
                  <Select
                    label="Approximate Personal Credit Range"
                    value={editFormData.personalCreditRange || ''}
                    onChange={(e) => updateEditField('personalCreditRange', e.target.value)}
                    options={PERSONAL_CREDIT_RANGES}
                  />
                  <Select
                    label="Desired Funding Amount"
                    value={editFormData.fundingAmount || ''}
                    onChange={(e) => updateEditField('fundingAmount', e.target.value)}
                    options={FUNDING_AMOUNTS}
                  />
                  <CheckboxCardGroup
                    label="Primary Funding Purpose"
                    options={FUNDING_PURPOSES}
                    values={editFormData.fundingPurpose || []}
                    onChange={(vals) => updateEditField('fundingPurpose', vals)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Annual Revenue Range</span>
                    <span className="font-semibold text-slate-800">
                      {business?.annualRevenueRange || 'Not configured'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Personal Credit Range</span>
                    <span className="font-semibold text-slate-800">
                      {business?.personalCreditRange || 'Not configured'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Target Funding Amount</span>
                    <span className="font-semibold text-slate-800">
                      {business?.fundingAmount || 'Not configured'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Funding Purpose</span>
                    <span className="font-semibold text-slate-800">
                      {business?.fundingPurpose && business.fundingPurpose.length > 0
                        ? business.fundingPurpose.join(', ')
                        : 'Not configured'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
