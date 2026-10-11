'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  User,
  ShieldCheck,
  Mail,
  Edit2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  Building2,
  CreditCard,
  Target,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Loader2,
  Calendar,
  Building,
} from 'lucide-react';
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

type ProfileTab = 'owner' | 'business' | 'credit' | 'billing';

export default function UserProfilePage() {
  const { user, updateProfile, changePassword, signOut } = useAuth();
  const { business, saveBusinessProfile, loading: businessLoading } = useBusiness();
  const {
    subscription,
    isFoundation,
    isGuided,
    isPro,
    isAdvisory,
    openCustomerPortal,
    upgradeToFoundation,
    upgradeToGuided,
  } = useSubscription();

  const hasFoundation = isFoundation || isPro;
  const hasGuided = isGuided || isAdvisory;

  const [activeTab, setActiveTab] = useState<ProfileTab>('owner');

  // --- 1. Owner Information State ---
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSavingOwner, setIsSavingOwner] = useState(false);
  const [ownerSuccess, setOwnerSuccess] = useState<string | null>(null);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [ownerFieldErrors, setOwnerFieldErrors] = useState<{ firstName?: string; lastName?: string }>({});

  // --- 2. Password Change State ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // --- 3. Business Foundation State ---
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [bizFormData, setBizFormData] = useState<Partial<BusinessProfile>>({});
  const [isSavingBiz, setIsSavingBiz] = useState(false);
  const [bizSuccess, setBizSuccess] = useState<string | null>(null);
  const [bizError, setBizError] = useState<string | null>(null);
  const [bizFieldErrors, setBizFieldErrors] = useState<Record<string, string>>({});

  // --- 4. Credit & Goals State ---
  const [isEditingCredit, setIsEditingCredit] = useState(false);
  const [creditFormData, setCreditFormData] = useState<Partial<BusinessProfile>>({});
  const [isSavingCredit, setIsSavingCredit] = useState(false);
  const [creditSuccess, setCreditSuccess] = useState<string | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);

  // Derive initial names from user
  const getDerivedNames = () => {
    if (user?.firstName || user?.lastName) {
      return {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      };
    }
    const parts = (user?.name || '').trim().split(/\s+/);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    };
  };

  useEffect(() => {
    const derived = getDerivedNames();
    setFirstName(derived.firstName);
    setLastName(derived.lastName);
  }, [user]);

  useEffect(() => {
    if (business) {
      setBizFormData({
        businessName: business.businessName || '',
        entityType: business.entityType || '',
        state: business.state || '',
        industry: business.industry || '',
        businessAge: business.businessAge || '',
        hasEIN: business.hasEIN,
        hasBusinessBankAccount: business.hasBusinessBankAccount,
        hasWebsite: business.hasWebsite,
        hasBusinessPhone: business.hasBusinessPhone,
        hasBusinessEmail: business.hasBusinessEmail,
        hasBusinessAddress: business.hasBusinessAddress,
        hasBusinessLicense: business.hasBusinessLicense,
        hasDuns: business.hasDuns,
      });

      setCreditFormData({
        hasBusinessCreditProfile: business.hasBusinessCreditProfile,
        knowsBusinessCreditScore: business.knowsBusinessCreditScore,
        businessCreditScore: business.businessCreditScore || '',
        businessCreditAccountCount: business.businessCreditAccountCount,
        hasReportingAccounts: business.hasReportingAccounts,
        annualRevenueRange: business.annualRevenueRange || '',
        personalCreditRange: business.personalCreditRange || '',
        fundingAmount: business.fundingAmount || '',
        fundingPurpose: business.fundingPurpose || [],
      });
    }
  }, [business]);

  // Handler: Save Owner Info
  const handleSaveOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError(null);
    setOwnerSuccess(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    const errors: { firstName?: string; lastName?: string } = {};
    if (!trimmedFirst) {
      errors.firstName = 'First name is required.';
    } else if (trimmedFirst.length > 50) {
      errors.firstName = 'First name must be 50 characters or less.';
    }

    if (!trimmedLast) {
      errors.lastName = 'Last name is required.';
    } else if (trimmedLast.length > 50) {
      errors.lastName = 'Last name must be 50 characters or less.';
    }

    if (Object.keys(errors).length > 0) {
      setOwnerFieldErrors(errors);
      return;
    }

    setOwnerFieldErrors({});
    setIsSavingOwner(true);

    try {
      if (!updateProfile) {
        throw new Error('Profile update service is not available.');
      }

      const result = await updateProfile({
        firstName: trimmedFirst,
        lastName: trimmedLast,
      });

      if (result.success) {
        setIsEditingOwner(false);
        setOwnerSuccess('Owner information updated and saved successfully.');
        setTimeout(() => setOwnerSuccess(null), 4000);
      } else {
        setOwnerError(result.error || 'Unable to save changes. Please try again.');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setOwnerError(err.message || 'Unable to save changes. Please try again.');
    } finally {
      setIsSavingOwner(false);
    }
  };

  // Handler: Save Password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError('Password must contain both letters and numbers.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    if (!changePassword) {
      setPasswordError('Password change service is unavailable.');
      return;
    }

    setPasswordSaving(true);
    const res = await changePassword(newPassword);
    setPasswordSaving(false);

    if (!res.success) {
      setPasswordError(res.error || 'Failed to update password.');
    } else {
      setPasswordSuccess('Password updated successfully.');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    }
  };

  // Handler: Save Business Foundation
  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setBizError(null);
    setBizSuccess(null);

    const errors: Record<string, string> = {};
    if (bizFormData.businessName !== undefined && !bizFormData.businessName.trim()) {
      errors.businessName = 'Business name cannot be empty.';
    }

    if (Object.keys(errors).length > 0) {
      setBizFieldErrors(errors);
      return;
    }

    setBizFieldErrors({});
    setIsSavingBiz(true);

    try {
      const res = await saveBusinessProfile(bizFormData);
      if (res.success) {
        setIsEditingBusiness(false);
        setBizSuccess('Business foundation information updated and saved successfully.');
        setTimeout(() => setBizSuccess(null), 4000);
      } else {
        setBizError(res.error || 'Failed to save business details.');
      }
    } catch (err: any) {
      setBizError(err.message || 'Failed to save business details.');
    } finally {
      setIsSavingBiz(false);
    }
  };

  // Handler: Save Credit & Funding
  const handleSaveCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreditError(null);
    setCreditSuccess(null);
    setIsSavingCredit(true);

    try {
      const res = await saveBusinessProfile(creditFormData);
      if (res.success) {
        setIsEditingCredit(false);
        setCreditSuccess('Credit assessment and funding goals saved successfully.');
        setTimeout(() => setCreditSuccess(null), 4000);
      } else {
        setCreditError(res.error || 'Failed to save assessment information.');
      }
    } catch (err: any) {
      setCreditError(err.message || 'Failed to save assessment information.');
    } finally {
      setIsSavingCredit(false);
    }
  };

  const formatDisplay = (val?: string) => {
    if (!val) return '—';
    if (val === 'not_sure') return 'Not sure';
    if (val === 'yes') return 'Yes';
    if (val === 'no') return 'No';
    if (val === 'not_applicable') return 'Not applicable';
    return val;
  };

  const currentNames = getDerivedNames();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl pb-12">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Account &amp; Business Profile
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage your personal credentials, business entity information, credit underwriting records, and subscription plan.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="text-xs font-semibold text-slate-700">
                  <span>Back to Dashboard</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Tab Navigation Strip */}
          <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('owner')}
              className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'owner'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Owner &amp; Security</span>
            </button>

            <button
              onClick={() => setActiveTab('business')}
              className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'business'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Business Foundation</span>
            </button>

            <button
              onClick={() => setActiveTab('credit')}
              className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'credit'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Credit &amp; Funding Goals</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'billing'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Plan &amp; Billing</span>
            </button>
          </div>

          {/* =========================================================================
              TAB 1: OWNER & SECURITY
             ========================================================================= */}
          {activeTab === 'owner' && (
            <div className="space-y-6">
              {ownerSuccess && (
                <div role="alert" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold">{ownerSuccess}</p>
                </div>
              )}

              {ownerError && (
                <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold">{ownerError}</p>
                </div>
              )}

              {/* Owner Information Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-brand-600" />
                      Owner &amp; Contact Details
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Personal identity and primary login credentials for this account.
                    </CardDescription>
                  </div>
                  {!isEditingOwner && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingOwner(true)}
                      className="text-xs font-semibold gap-1.5 border-slate-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="pt-6">
                  {!isEditingOwner ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          First Name
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{currentNames.firstName || '—'}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Last Name
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{currentNames.lastName || '—'}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Account Email
                        </span>
                        <div className="font-bold text-slate-900 text-sm truncate">{user?.email || '—'}</div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">Primary Login Identifier</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Account Role &amp; Security
                        </span>
                        <div className="font-bold text-emerald-700 capitalize text-sm">
                          {user?.role === 'admin' ? 'Platform Administrator' : 'Standard User Account'}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">Row-level database security enabled</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveOwner} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="First Name"
                          id="firstName"
                          name="firstName"
                          required
                          maxLength={50}
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            if (ownerFieldErrors.firstName) {
                              setOwnerFieldErrors((prev) => ({ ...prev, firstName: undefined }));
                            }
                          }}
                          placeholder="e.g. John"
                          error={ownerFieldErrors.firstName}
                          disabled={isSavingOwner}
                        />

                        <Input
                          label="Last Name"
                          id="lastName"
                          name="lastName"
                          required
                          maxLength={50}
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value);
                            if (ownerFieldErrors.lastName) {
                              setOwnerFieldErrors((prev) => ({ ...prev, lastName: undefined }));
                            }
                          }}
                          placeholder="e.g. Smith"
                          error={ownerFieldErrors.lastName}
                          disabled={isSavingOwner}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                          <span>Account Email</span>
                          <span className="flex items-center gap-1 text-xs text-slate-400 font-normal">
                            <Lock className="w-3 h-3" /> Read-only login ID
                          </span>
                        </label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ''}
                          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm bg-slate-100/70 text-slate-500 cursor-not-allowed select-none"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={isSavingOwner}
                          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                        >
                          {isSavingOwner ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5 mr-1.5" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditingOwner(false);
                            const derived = getDerivedNames();
                            setFirstName(derived.firstName);
                            setLastName(derived.lastName);
                          }}
                          disabled={isSavingOwner}
                          className="text-xs font-semibold"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Password & Security Card */}
              <Card>
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-600" />
                    Security & Password
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Change your account password. Must be at least 8 characters and contain both letters and numbers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {passwordSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}
                  {passwordError && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                  <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md">
                    <Input
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-type new password"
                      required
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={passwordSaving}
                      disabled={passwordSaving || !newPassword || !confirmNewPassword}
                      className="text-xs font-bold mt-1"
                    >
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* =========================================================================
              TAB 2: BUSINESS FOUNDATION & ENTITY
             ========================================================================= */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              {bizSuccess && (
                <div role="alert" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold">{bizSuccess}</p>
                </div>
              )}

              {bizError && (
                <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold">{bizError}</p>
                </div>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-brand-600" />
                      Business Entity &amp; Compliance Details
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Commercial formation and foundational business compliance parameters.
                    </CardDescription>
                  </div>
                  {!isEditingBusiness ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingBusiness(true)}
                      className="text-xs font-semibold gap-1.5 border-slate-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Business Details</span>
                    </Button>
                  ) : null}
                </CardHeader>

                <CardContent className="pt-6">
                  {!isEditingBusiness ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Business Legal Name
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{business?.businessName || '—'}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Entity Structure
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{business?.entityType || '—'}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          State of Formation
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{business?.state || '—'}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Industry Classification
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{business?.industry || '—'}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Operating Age
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{business?.businessAge || '—'}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Federal EIN
                        </span>
                        <div className="font-bold text-slate-900 text-sm capitalize">{formatDisplay(business?.hasEIN)}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Business Bank Account
                        </span>
                        <div className="font-bold text-slate-900 text-sm capitalize">{formatDisplay(business?.hasBusinessBankAccount)}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Commercial Address
                        </span>
                        <div className="font-bold text-slate-900 text-sm capitalize">{formatDisplay(business?.hasBusinessAddress)}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Business Phone
                        </span>
                        <div className="font-bold text-slate-900 text-sm capitalize">{formatDisplay(business?.hasBusinessPhone)}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Professional Email
                        </span>
                        <div className="font-bold text-slate-900 text-sm capitalize">{formatDisplay(business?.hasBusinessEmail)}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Company Website
                        </span>
                        <div className="font-bold text-slate-900 text-sm capitalize">{formatDisplay(business?.hasWebsite)}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          D-U-N-S Number
                        </span>
                        <div className="font-bold text-slate-900 text-sm capitalize">{formatDisplay(business?.hasDuns)}</div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveBusiness} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Business Legal Name"
                          value={bizFormData.businessName || ''}
                          onChange={(e) => setBizFormData({ ...bizFormData, businessName: e.target.value })}
                          placeholder="e.g. Acme Logistics LLC"
                          required
                          error={bizFieldErrors.businessName}
                        />

                        <Select
                          label="Entity Structure"
                          value={bizFormData.entityType || ''}
                          onChange={(e) => setBizFormData({ ...bizFormData, entityType: e.target.value })}
                          options={BUSINESS_STRUCTURES}
                        />

                        <Select
                          label="State of Formation"
                          value={bizFormData.state || ''}
                          onChange={(e) => setBizFormData({ ...bizFormData, state: e.target.value })}
                          options={US_STATES}
                        />

                        <Select
                          label="Industry Classification"
                          value={bizFormData.industry || ''}
                          onChange={(e) => setBizFormData({ ...bizFormData, industry: e.target.value })}
                          options={INDUSTRIES}
                        />

                        <Select
                          label="Operating Age"
                          value={bizFormData.businessAge || ''}
                          onChange={(e) => setBizFormData({ ...bizFormData, businessAge: e.target.value })}
                          options={BUSINESS_AGES}
                        />

                        <Select
                          label="Federal EIN Obtained?"
                          value={bizFormData.hasEIN || ''}
                          onChange={(e) => setBizFormData({ ...bizFormData, hasEIN: e.target.value as any })}
                          options={TRI_STATE_OPTIONS}
                        />

                        <Select
                          label="Commercial Bank Account?"
                          value={bizFormData.hasBusinessBankAccount || ''}
                          onChange={(e) => setBizFormData({ ...bizFormData, hasBusinessBankAccount: e.target.value as any })}
                          options={TRI_STATE_OPTIONS}
                        />

                        <Select
                          label="Commercial Physical Address?"
                          value={bizFormData.hasBusinessAddress || ''}
                          onChange={(e) => setBizFormData({ ...bizFormData, hasBusinessAddress: e.target.value as any })}
                          options={TRI_STATE_OPTIONS}
                        />

                        <Select
                          label="Dedicated Business Phone?"
                          value={bizFormData.hasBusinessPhone || ''}
                          onChange={(e) => setBizFormData({ ...bizFormData, hasBusinessPhone: e.target.value as any })}
                          options={TRI_STATE_OPTIONS}
                        />

                        <Select
                          label="Company Website?"
                          value={bizFormData.hasWebsite || ''}
                          onChange={(e) => setBizFormData({ ...bizFormData, hasWebsite: e.target.value as any })}
                          options={TRI_STATE_OPTIONS}
                        />

                        <Select
                          label="D-U-N-S Number?"
                          value={bizFormData.hasDuns || ''}
                          onChange={(e) => setBizFormData({ ...bizFormData, hasDuns: e.target.value as any })}
                          options={TRI_STATE_OPTIONS}
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-3">
                        <Button
                          type="submit"
                          disabled={isSavingBiz}
                          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                        >
                          {isSavingBiz ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5 mr-1.5" />
                              <span>Save Business Details</span>
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditingBusiness(false)}
                          disabled={isSavingBiz}
                          className="text-xs font-semibold"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* =========================================================================
              TAB 3: CREDIT & FUNDING GOALS
             ========================================================================= */}
          {activeTab === 'credit' && (
            <div className="space-y-6">
              {creditSuccess && (
                <div role="alert" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold">{creditSuccess}</p>
                </div>
              )}

              {creditError && (
                <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold">{creditError}</p>
                </div>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-brand-600" />
                      Credit Standing &amp; Funding Targets
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Commercial tradelines depth, annual revenue, and target capital requirements.
                    </CardDescription>
                  </div>
                  {!isEditingCredit ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingCredit(true)}
                      className="text-xs font-semibold gap-1.5 border-slate-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Targets</span>
                    </Button>
                  ) : null}
                </CardHeader>

                <CardContent className="pt-6">
                  {!isEditingCredit ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Commercial Credit Profile
                        </span>
                        <div className="font-bold text-slate-900 text-sm capitalize">{formatDisplay(business?.hasBusinessCreditProfile)}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Reporting Tradelines Count
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{business?.businessCreditAccountCount || '0'}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Annual Business Revenue
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{business?.annualRevenueRange || 'Pre-revenue'}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Personal Credit Tier
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{business?.personalCreditRange || '—'}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Capital Target Amount
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{business?.fundingAmount || '—'}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Primary Funding Purpose
                        </span>
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {Array.isArray(business?.fundingPurpose) && business.fundingPurpose.length > 0
                            ? business.fundingPurpose.join(', ')
                            : 'Working capital'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveCredit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                          label="Commercial Bureau Credit Profile?"
                          value={creditFormData.hasBusinessCreditProfile || ''}
                          onChange={(e) => setCreditFormData({ ...creditFormData, hasBusinessCreditProfile: e.target.value as any })}
                          options={TRI_STATE_OPTIONS}
                        />

                        <Select
                          label="Reporting Accounts / Tradelines"
                          value={creditFormData.businessCreditAccountCount || ''}
                          onChange={(e) => setCreditFormData({ ...creditFormData, businessCreditAccountCount: e.target.value as any })}
                          options={CREDIT_ACCOUNT_COUNT_OPTIONS}
                        />

                        <Select
                          label="Annual Revenue Range"
                          value={creditFormData.annualRevenueRange || ''}
                          onChange={(e) => setCreditFormData({ ...creditFormData, annualRevenueRange: e.target.value })}
                          options={ANNUAL_REVENUE_RANGES}
                        />

                        <Select
                          label="Personal Credit Score Range"
                          value={creditFormData.personalCreditRange || ''}
                          onChange={(e) => setCreditFormData({ ...creditFormData, personalCreditRange: e.target.value })}
                          options={PERSONAL_CREDIT_RANGES}
                        />

                        <Select
                          label="Target Funding Amount"
                          value={creditFormData.fundingAmount || ''}
                          onChange={(e) => setCreditFormData({ ...creditFormData, fundingAmount: e.target.value })}
                          options={FUNDING_AMOUNTS}
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-3">
                        <Button
                          type="submit"
                          disabled={isSavingCredit}
                          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                        >
                          {isSavingCredit ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5 mr-1.5" />
                              <span>Save Assessment Details</span>
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditingCredit(false)}
                          disabled={isSavingCredit}
                          className="text-xs font-semibold"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* =========================================================================
              TAB 4: PLAN & BILLING ENTITLEMENTS
             ========================================================================= */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-brand-600" />
                      Current Plan &amp; Billing Entitlements
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Verified subscription details, payment sources, and renewal terms.
                    </CardDescription>
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${
                      hasGuided
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : hasFoundation
                        ? 'bg-brand-50 text-brand-900 border border-brand-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {hasGuided ? 'Guided Member' : hasFoundation ? 'Foundation Member' : 'Free Starter'}
                  </span>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Active Membership Tier
                      </span>
                      <div className="font-bold text-slate-900 text-sm">
                        {hasGuided
                          ? subscription?.accessSource === 'stripe_onetime'
                            ? 'Guided 12-Month ($997 One-Time)'
                            : 'Guided ($147.99/mo)'
                          : hasFoundation
                          ? 'Foundation ($47.99/mo)'
                          : 'Free Starter ($0)'}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        {hasGuided
                          ? 'Full platform + monthly strategy consultation'
                          : hasFoundation
                          ? 'Self-service funding readiness roadmap & tradelines'
                          : 'Introductory compliance audit & score preview'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Access Source
                      </span>
                      <div className="font-bold text-slate-900 text-sm capitalize">
                        {subscription?.accessSource === 'stripe_subscription'
                          ? 'Stripe Subscription'
                          : subscription?.accessSource === 'stripe_onetime'
                          ? '12-Month Program (One-Time)'
                          : subscription?.accessSource === 'admin_grant'
                          ? 'Administrative Grant'
                          : subscription?.accessSource === 'complimentary'
                          ? 'Complimentary Access'
                          : 'Standard Free Tier'}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Billing Status: <span className="font-semibold text-slate-700 capitalize">{subscription?.status || 'Active'}</span>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Term &amp; Renewal Date
                      </span>
                      <div className="font-bold text-slate-900 text-sm">
                        {subscription?.expiresAt
                          ? `Expires ${new Date(subscription.expiresAt).toLocaleDateString()}`
                          : subscription?.currentPeriodEnd
                          ? `${subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                          : 'Ongoing Access'}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Verified via server-side authorization
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Manage payment methods, view invoices, or change your membership plan.
                    </span>

                    <div className="flex items-center gap-2.5">
                      {subscription?.stripeCustomerId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openCustomerPortal}
                          className="text-xs font-semibold gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                          <span>Manage Billing in Stripe</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Button>
                      )}

                      <Link href="/pricing">
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
                        >
                          {hasGuided ? 'View All Plan Benefits' : 'Upgrade Plan'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
