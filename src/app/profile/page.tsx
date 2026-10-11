'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  Loader2,
  CreditCard,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useSubscription } from '@/context/SubscriptionContext';

export default function UserProfilePage() {
  const { user, updateProfile, changePassword, signOut } = useAuth();
  const { business } = useBusiness();
  const {
    subscription,
    isFoundation,
    isGuided,
    isPro,
    isAdvisory,
    openCustomerPortal,
  } = useSubscription();

  const hasFoundation = isFoundation || isPro;
  const hasGuided = isGuided || isAdvisory;

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string }>({});

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
    }
  };

  // Derive initial first and last names from user object
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

  const handleStartEdit = () => {
    const derived = getDerivedNames();
    setFirstName(derived.firstName);
    setLastName(derived.lastName);
    setFieldErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    const derived = getDerivedNames();
    setFirstName(derived.firstName);
    setLastName(derived.lastName);
    setFieldErrors({});
    setErrorMessage(null);
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    // Validation
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
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSaving(true);

    try {
      if (!updateProfile) {
        throw new Error('Profile update service is not available.');
      }

      const result = await updateProfile({
        firstName: trimmedFirst,
        lastName: trimmedLast,
      });

      if (result.success) {
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully.');
      } else {
        setErrorMessage(result.error || 'Unable to save changes. Please try again.');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrorMessage(err.message || 'Unable to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentNames = getDerivedNames();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-3xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Account Profile
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your personal login credentials, owner details, and account preferences.
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div 
              role="alert" 
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">{successMessage}</p>
                <p className="text-xs text-emerald-700 mt-0.5">Your owner information has been saved and updated across your dashboard.</p>
              </div>
              <button 
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-500 hover:text-emerald-700 text-xs font-semibold px-1"
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div 
              role="alert" 
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-900">Update Failed</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
              <button 
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 text-xs font-semibold px-1"
                aria-label="Close error notification"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Account Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <CardTitle className="truncate">{user?.name || 'Account Holder'}</CardTitle>
                  <CardDescription className="truncate">{user?.email}</CardDescription>
                </div>
              </div>
              {!isEditing && (
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={handleStartEdit}
                  className="flex-shrink-0 flex items-center gap-2 border-brand-200 text-brand-700 hover:bg-brand-50"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Owner Information</span>
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* OWNER INFORMATION SECTION */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <User className="w-4 h-4 text-brand-600" />
                      Owner Information
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Personal identity and primary contact details for this account.
                    </p>
                  </div>
                  {isEditing && (
                    <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                      Editing Mode
                    </span>
                  )}
                </div>

                {!isEditing ? (
                  /* VIEW MODE */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-4">
                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        First Name
                      </div>
                      <div className="font-bold text-slate-900">
                        {currentNames.firstName || '—'}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Last Name
                      </div>
                      <div className="font-bold text-slate-900">
                        {currentNames.lastName || '—'}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Account Email
                      </div>
                      <div className="font-bold text-slate-900 truncate">
                        {user?.email || '—'}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Primary Login Identifier</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Security & Role
                      </div>
                      <div className="font-bold text-emerald-700 capitalize">
                        {user?.role === 'admin' ? 'Platform Administrator' : 'Active Account (Protected)'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Row-level security active
                      </div>
                    </div>

                    {business?.businessName && (
                      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 sm:col-span-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          <Building2 className="w-3.5 h-3.5 text-brand-600" />
                          Linked Business Entity
                        </div>
                        <div className="font-bold text-slate-900">
                          {business.businessName}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* EDIT MODE */
                  <form onSubmit={handleSave} className="pt-4 space-y-4">
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
                          if (fieldErrors.firstName) {
                            setFieldErrors((prev) => ({ ...prev, firstName: undefined }));
                          }
                        }}
                        placeholder="e.g. Jane"
                        error={fieldErrors.firstName}
                        disabled={isSaving}
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
                          if (fieldErrors.lastName) {
                            setFieldErrors((prev) => ({ ...prev, lastName: undefined }));
                          }
                        }}
                        placeholder="e.g. Doe"
                        error={fieldErrors.lastName}
                        disabled={isSaving}
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
                      <p className="mt-1.5 text-xs text-slate-400">
                        Your account email is tied to your login credentials and authentication tokens.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-3">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link href="/business">
                  <Button variant="outline" size="sm">
                    View Business Profile
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut} 
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SUBSCRIPTION & BILLING ENTITLEMENTS */}
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brand-600" />
                  <CardTitle className="text-base font-bold text-slate-900">
                    Plan &amp; Billing Entitlements
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      hasGuided
                        ? 'bg-indigo-100 text-indigo-800'
                        : hasFoundation
                        ? 'bg-brand-100 text-brand-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {hasGuided ? 'Guided Plan' : hasFoundation ? 'Foundation Plan' : 'Free Starter'}
                  </span>
                </div>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Manage your membership tier, commercial funding entitlements, and Stripe billing invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Current Plan
                  </span>
                  <div className="font-bold text-slate-900 text-sm">
                    {hasGuided ? 'Guided ($147.99/mo)' : hasFoundation ? 'Foundation ($47.99/mo)' : 'Free ($0)'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {hasGuided
                      ? 'Full platform + monthly strategy consultation & priority review'
                      : hasFoundation
                      ? 'Self-service funding readiness roadmap & score tracking'
                      : 'Introductory funding readiness preview'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Access Source
                  </span>
                  <div className="font-bold text-slate-900 capitalize">
                    {subscription?.accessSource === 'stripe_subscription'
                      ? 'Stripe Subscription'
                      : subscription?.accessSource === 'stripe_onetime'
                      ? '12-Month Program (One-Time)'
                      : subscription?.accessSource === 'admin_grant'
                      ? 'Owner Administrative Grant'
                      : subscription?.accessSource === 'complimentary'
                      ? 'Complimentary Access'
                      : 'Standard Free Member'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Billing Status: <span className="font-medium text-slate-700 capitalize">{subscription?.status || 'Active'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Entitlement Term
                  </span>
                  <div className="font-bold text-slate-900">
                    {subscription?.expiresAt
                      ? `Expires ${new Date(subscription.expiresAt).toLocaleDateString()}`
                      : subscription?.currentPeriodEnd
                      ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      : 'Ongoing Access'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Verified through trusted server authorization
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Need to change payment methods or download invoices?
                </div>
                <div className="flex items-center gap-2">
                  {subscription?.stripeCustomerId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openCustomerPortal}
                      className="text-xs font-semibold gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-brand-600" />
                      <span>Manage Billing in Stripe</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Button>
                  ) : null}
                  <Link href="/pricing">
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white"
                    >
                      {hasGuided ? 'Compare Plans' : 'Upgrade Plan'}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Password Card */}
          <Card className="border border-slate-200/80 shadow-2xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-600" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Security & Password
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Update your account password. Must contain at least 8 characters with letters and numbers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  className="mt-1"
                >
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
