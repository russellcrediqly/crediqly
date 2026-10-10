'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  KeyRound,
  Shield,
  Building2,
  TrendingUp,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  FileText,
  CreditCard,
  DollarSign,
  Mail,
  Calendar,
  Layers,
  Sparkles,
  Lock,
  ExternalLink,
  ChevronRight,
  Briefcase,
  MapPin,
  Phone,
  Globe,
  Award,
  Target,
  RefreshCw,
  Trash2,
  Plus,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getAdminUserDetail,
  updateAdminUserStatus,
  updateAdminUserProfile,
  updateAdminBusinessProfile,
  triggerAdminPasswordReset,
} from '@/lib/supabase/adminService';
import {
  grantAdminPlanAccess,
  revokeAdminPlanAccess,
  extendAdminPlanAccess,
} from '@/lib/supabase/subscriptionService';
import {
  getAdminCustomerNotes,
  addAdminCustomerNote,
  deleteAdminCustomerNote,
} from '@/lib/supabase/adminNoteService';
import { getAllProductsAdmin } from '@/lib/supabase/productService';
import { adminUpdateConsultation } from '@/lib/supabase/consultationService';
import { updateFundingApplication } from '@/lib/supabase/fundingApplicationService';
import { logAdminAction } from '@/lib/supabase/adminAuditService';
import { AdminUserDetail, AdminCustomerNote } from '@/types/admin';
import { UserRole, AccountStatus } from '@/types/user';
import { BusinessProfile } from '@/types/business';
import { Product, RecommendedProduct, CATEGORY_LABELS } from '@/types/product';
import { calculateReadiness, getNextBestAction } from '@/lib/scoring';
import { calculateMilestoneReadiness } from '@/lib/readiness/readinessMilestoneEngine';
import { calculateFundingReadiness } from '@/lib/readiness/fundingEngine';
import { generateRoadmap } from '@/lib/roadmap';
import { getRecommendedProducts } from '@/lib/products/recommendationEngine';
import { getMonthlyCheckIns } from '@/lib/supabase/checkInService';
import { MonthlyCheckInRecord } from '@/types/checkIn';

type ActiveTab =
  | 'business'
  | 'credit'
  | 'funding'
  | 'roadmap'
  | 'billing'
  | 'advisory'
  | 'applications'
  | 'recommendations'
  | 'notes'
  | 'account'
  | 'dashboard_view';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('business');

  // Form edit states for account
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [status, setStatus] = useState<AccountStatus>('active');

  // Business form edit state
  const [businessData, setBusinessData] = useState<Partial<BusinessProfile>>({});

  // Products catalog for recommendations
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [customerCheckIns, setCustomerCheckIns] = useState<MonthlyCheckInRecord[]>([]);

  // Internal Notes State
  const [notes, setNotes] = useState<AdminCustomerNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Owner Plan & Entitlement Modals
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantPlan, setGrantPlan] = useState<'foundation' | 'guided'>('foundation');
  const [grantType, setGrantType] = useState<'admin_grant' | 'complimentary'>('admin_grant');
  const [grantDuration, setGrantDuration] = useState<number>(3);
  const [grantReason, setGrantReason] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeLoading, setRevokeLoading] = useState(false);

  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendMonths, setExtendMonths] = useState<number>(3);
  const [extendReason, setExtendReason] = useState('');
  const [extendLoading, setExtendLoading] = useState(false);

  const [statusConfirmModalOpen, setStatusConfirmModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AccountStatus>('active');
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  // Action status states
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!userId) return;
    try {
      const [data, products, checkIns, fetchedNotes] = await Promise.all([
        getAdminUserDetail(userId),
        getAllProductsAdmin().catch(() => []),
        getMonthlyCheckIns(userId).catch(() => []),
        getAdminCustomerNotes(userId).catch(() => []),
      ]);
      if (data) {
        setUserDetail(data);
        setFirstName(data.profile.firstName || '');
        setLastName(data.profile.lastName || '');
        setRole(data.profile.role);
        setStatus(data.profile.status);
        if (data.business) {
          setBusinessData(data.business);
        }
      }
      setAllProducts(products || []);
      setCustomerCheckIns(checkIns || []);
      setNotes(fetchedNotes || data?.notes || []);
    } catch (e) {
      console.error('Error fetching admin customer detail:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Handle Save User Profile and Role/Status
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetail) return;
    setSaving(true);
    setFeedback(null);

    try {
      const statusRes = await updateAdminUserStatus(userDetail.profile.userId, role, status);
      if (!statusRes.success) throw new Error(statusRes.error || 'Failed to update user status/role');

      const nameRes = await updateAdminUserProfile(userDetail.profile.userId, {
        firstName,
        lastName,
      });
      if (!nameRes.success) throw new Error(nameRes.error || 'Failed to update user profile information');

      await logAdminAction({
        adminEmail: 'crediqly@gmail.com',
        action: 'UPDATE_USER_PROFILE',
        entityType: 'customer',
        entityId: userDetail.profile.userId,
        entityName: userDetail.profile.email,
        description: `Updated account profile and permissions for ${userDetail.profile.email}`,
        previousValue: { firstName: userDetail.profile.firstName, lastName: userDetail.profile.lastName, role: userDetail.profile.role, status: userDetail.profile.status },
        newValue: { firstName, lastName, role, status },
      });

      setFeedback({
        type: 'success',
        message: 'Account profile and access permissions updated successfully.',
      });
      await fetchDetail();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Business Information
  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetail) return;
    setSaving(true);
    setFeedback(null);

    try {
      const res = await updateAdminBusinessProfile(userDetail.profile.userId, businessData);
      if (!res.success) throw new Error(res.error || 'Failed to update business profile');

      await logAdminAction({
        adminEmail: 'crediqly@gmail.com',
        action: 'UPDATE_BUSINESS_PROFILE',
        entityType: 'customer',
        entityId: userDetail.profile.userId,
        entityName: userDetail.profile.email,
        description: `Updated business profile parameters for ${businessData.businessName || userDetail.profile.email}`,
        newValue: businessData,
      });

      setFeedback({
        type: 'success',
        message: 'Business profile parameters updated successfully.',
      });
      await fetchDetail();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Send Password Reset
  const handleSendPasswordReset = async () => {
    if (!userDetail) return;
    setResettingPassword(true);
    setFeedback(null);

    try {
      const res = await triggerAdminPasswordReset(userDetail.profile.email);
      if (res.success) {
        await logAdminAction({
          adminEmail: 'crediqly@gmail.com',
          action: 'TRIGGER_PASSWORD_RESET',
          entityType: 'customer',
          entityId: userDetail.profile.userId,
          entityName: userDetail.profile.email,
          description: `Dispatched single-use password reset link to ${userDetail.profile.email}`,
        });

        setFeedback({
          type: 'success',
          message: res.message || `Password reset link sent to ${userDetail.profile.email}`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Could not send password reset link',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Password reset failed' });
    } finally {
      setResettingPassword(false);
    }
  };

  // Handle Advisory Meeting Update
  const handleUpdateMeeting = async (meetingId: string, updates: any) => {
    try {
      const res = await adminUpdateConsultation(meetingId, updates);
      if (res) {
        setFeedback({ type: 'success', message: 'Advisory meeting record updated.' });
        await fetchDetail();
      } else {
        setFeedback({ type: 'error', message: 'Failed to update meeting record.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Failed to update meeting' });
    }
  };

  // Handle Funding Application Status Update
  const handleUpdateApplicationStatus = async (appId: string, newStatus: any) => {
    try {
      const res = await updateFundingApplication(appId, { status: newStatus });
      if (res) {
        setFeedback({ type: 'success', message: 'Funding application status updated.' });
        await fetchDetail();
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Failed to update application' });
    }
  };

  // Handle Manual Plan Grant
  const handleGrantPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantReason.trim()) {
      setFeedback({ type: 'error', message: 'A reason for granting access is required.' });
      return;
    }
    setGrantLoading(true);
    try {
      await grantAdminPlanAccess({
        userId,
        plan: grantPlan,
        grantType,
        durationMonths: grantDuration > 0 ? grantDuration : undefined,
        isIndefinite: grantDuration === 0,
        reason: grantReason.trim(),
        adminEmail: 'crediqly@gmail.com',
      });
      setFeedback({
        type: 'success',
        message: `Granted ${grantType === 'complimentary' ? 'Complimentary' : 'Administrative'} ${grantPlan.toUpperCase()} access (${grantDuration === 0 ? 'Indefinite' : `${grantDuration} months`}).`,
      });
      setGrantModalOpen(false);
      setGrantReason('');
      await fetchDetail();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to grant plan access.' });
    } finally {
      setGrantLoading(false);
    }
  };

  // Handle Administrative Access Revocation
  const handleRevokePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeReason.trim()) {
      setFeedback({ type: 'error', message: 'A revocation reason is required.' });
      return;
    }
    setRevokeLoading(true);
    try {
      await revokeAdminPlanAccess({
        userId,
        reason: revokeReason.trim(),
        adminEmail: 'crediqly@gmail.com',
      });
      setFeedback({
        type: 'success',
        message: 'Administrative access revoked. Effective entitlements recalculated.',
      });
      setRevokeModalOpen(false);
      setRevokeReason('');
      await fetchDetail();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to revoke plan access.' });
    } finally {
      setRevokeLoading(false);
    }
  };

  // Handle Administrative Entitlement Extension
  const handleExtendPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendReason.trim()) {
      setFeedback({ type: 'error', message: 'An extension reason is required.' });
      return;
    }
    setExtendLoading(true);
    try {
      await extendAdminPlanAccess({
        userId,
        additionalMonths: extendMonths,
        reason: extendReason.trim(),
        adminEmail: 'crediqly@gmail.com',
      });
      setFeedback({
        type: 'success',
        message: `Plan entitlement successfully extended by ${extendMonths} months.`,
      });
      setExtendModalOpen(false);
      setExtendReason('');
      await fetchDetail();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to extend entitlement.' });
    } finally {
      setExtendLoading(false);
    }
  };

  // Handle Internal Administrative Notes
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    setAddingNote(true);
    try {
      const created = await addAdminCustomerNote({
        userId,
        adminEmail: 'crediqly@gmail.com',
        content: newNoteContent.trim(),
      });
      setNotes((prev) => [created, ...prev]);
      setNewNoteContent('');
      setFeedback({ type: 'success', message: 'Internal administrative note recorded.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save internal note.' });
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteAdminCustomerNote({
        noteId,
        userId,
        adminEmail: 'crediqly@gmail.com',
      });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setFeedback({ type: 'success', message: 'Internal note deleted.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete internal note.' });
    }
  };

  // Handle Account Status Confirmation
  const handleConfirmStatusUpdate = async () => {
    setStatusChangeLoading(true);
    try {
      const res = await updateAdminUserStatus(userId, role, pendingStatus);
      if (res.success) {
        setStatus(pendingStatus);
        setFeedback({
          type: 'success',
          message: `Account status updated to ${pendingStatus.toUpperCase()}.`,
        });
        setStatusConfirmModalOpen(false);
        await fetchDetail();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update status.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Status update failed.' });
    } finally {
      setStatusChangeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState message="Loading customer dossier..." className="text-white" />
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customer Directory</span>
        </Link>
        <Card className="bg-slate-950 border-slate-800 text-white p-8 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Customer Record Not Found</h2>
          <p className="text-xs text-slate-400 mt-1">
            Could not find customer with ID: <span className="font-mono text-slate-300">{userId}</span>
          </p>
          <div className="mt-4">
            <Link href="/admin/customers">
              <Button size="sm" className="text-xs bg-slate-800 hover:bg-slate-700">
                Return to Directory
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate live scores and recommendations
  const bizProfile = userDetail.business;
  const readiness = bizProfile ? calculateReadiness(bizProfile) : null;
  const milestoneRes = bizProfile ? calculateMilestoneReadiness(bizProfile) : null;
  const fundingReadiness = bizProfile ? calculateFundingReadiness(bizProfile) : null;
  const nextBest = bizProfile ? getNextBestAction(bizProfile) : null;
  const userCompletions: Record<string, string> = {};
  userDetail.roadmapProgress?.tasks?.forEach((t: any) => {
    if (t.completed) userCompletions[t.task_id || t.task_key || t.key || t.id] = 'completed';
  });
  const roadmap = generateRoadmap(bizProfile, userCompletions);
  const recommendedProducts = getRecommendedProducts(bizProfile, roadmap, allProducts);

  // Plan detection
  const isGuided =
    userDetail.subscription?.planId === 'guided' ||
    userDetail.subscription?.planId?.toLowerCase().includes('guided') ||
    userDetail.subscription?.planId === 'advisory' ||
    userDetail.subscription?.planId?.toLowerCase().includes('advisory') ||
    userDetail.consultations?.some((c) => c.consultationType === 'Premium Advisory Monthly Meeting');

  const isFoundation =
    !isGuided &&
    (userDetail.subscription?.planId === 'foundation' ||
      userDetail.subscription?.planId?.toLowerCase().includes('foundation') ||
      userDetail.subscription?.planId === 'pro' ||
      userDetail.subscription?.planId?.toLowerCase().includes('pro'));

  const isAdvisory = isGuided;
  const isPro = isFoundation;

  const planLabel = isGuided ? 'Guided Plan' : isFoundation ? 'Foundation Plan' : 'Free Tier';
  const planBadgeClass = isGuided
    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    : isFoundation
    ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
    : 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customer Directory</span>
        </Link>
        <span className="text-[11px] font-mono text-slate-500">
          Customer ID: {userDetail.profile.userId}
        </span>
      </div>

      {/* Header Dossier Summary Card */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 flex items-center justify-center text-white text-2xl font-black shadow-inner flex-shrink-0">
            {userDetail.profile.firstName?.[0] || userDetail.profile.email[0].toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {userDetail.profile.firstName
                  ? `${userDetail.profile.firstName} ${userDetail.profile.lastName || ''}`
                  : userDetail.profile.email}
              </h1>

              {/* Plan Badge */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${planBadgeClass}`}>
                {isAdvisory && <Sparkles className="w-3 h-3 text-purple-400" />}
                {planLabel}
              </span>

              {/* Account Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${
                  userDetail.profile.status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    userDetail.profile.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                {userDetail.profile.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
              <span className="flex items-center gap-1 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {userDetail.profile.email}
              </span>
              {userDetail.business?.businessName && (
                <span className="flex items-center gap-1 text-slate-300 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-teal-400" />
                  {userDetail.business.businessName} ({userDetail.business.entityType || 'Entity'} • {userDetail.business.state || 'US'})
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Joined {new Date(userDetail.profile.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Header KPIs & Actions */}
        <div className="flex items-center gap-3 self-start md:self-center flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Readiness Journey</div>
              <div className="text-base font-extrabold text-emerald-400">
                {milestoneRes?.score ?? 0}
                <span className="text-[10px] text-slate-400 font-normal">/100</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800 mx-1" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Business Score</div>
              <div className="text-base font-extrabold text-teal-400">
                {readiness?.businessReadiness.score ?? userDetail.readinessScore?.businessReadinessScore ?? 0}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800 mx-1" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Credit Score</div>
              <div className="text-base font-extrabold text-indigo-400">
                {readiness?.creditReadiness.score ?? userDetail.readinessScore?.creditReadinessScore ?? 0}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800 mx-1" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Funding Match</div>
              <div className="text-base font-extrabold text-amber-400">
                {fundingReadiness?.score ?? userDetail.fundingReadinessScore?.score ?? 0}
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSendPasswordReset}
            disabled={resettingPassword}
            className="border-slate-700 bg-slate-900 text-amber-300 hover:bg-slate-800 text-xs gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{resettingPassword ? 'Sending...' : 'Reset Password'}</span>
          </Button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 9-Section Dossier Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto text-xs scrollbar-none">
        {[
          { id: 'business', label: '1. Business Info', icon: Building2 },
          { id: 'credit', label: '2. Credit Readiness', icon: TrendingUp },
          { id: 'funding', label: '3. Funding Readiness', icon: DollarSign },
          { id: 'roadmap', label: '4. Roadmap Progress', icon: Target },
          { id: 'billing', label: '5. Plan & Billing', icon: CreditCard },
          { id: 'advisory', label: '6. Advisory Meetings', icon: Calendar },
          { id: 'applications', label: '7. Applications', icon: FileText },
          { id: 'recommendations', label: '8. Product Matches', icon: Sparkles },
          { id: 'notes', label: '9. Internal Notes', icon: FileText },
          { id: 'account', label: '10. Account & Security', icon: Lock },
          { id: 'dashboard_view', label: '11. Command Center View', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`pb-3 px-3 font-semibold transition-all border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'border-brand-500 text-white font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: Business Information */}
      {activeTab === 'business' && (
        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-400" />
              <span>Section 1: Business Entity Profile & Onboarding Parameters</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Review and adjust legal business entity registration, banking status, commercial verification flags, and operational profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveBusiness} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Legal Business Name
                  </label>
                  <input
                    type="text"
                    value={businessData.businessName || ''}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, businessName: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. Apex Transport LLC"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Entity Type
                  </label>
                  <select
                    value={businessData.entityType || ''}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, entityType: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Select Entity Type</option>
                    <option value="LLC">LLC (Limited Liability Company)</option>
                    <option value="Corporation">Corporation (C-Corp / S-Corp)</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    State of Formation
                  </label>
                  <input
                    type="text"
                    value={businessData.state || ''}
                    onChange={(e) => setBusinessData({ ...businessData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. Texas, Delaware"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Industry / Sector
                  </label>
                  <input
                    type="text"
                    value={businessData.industry || ''}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, industry: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. Transportation, Retail, Healthcare"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Business Age / Longevity
                  </label>
                  <select
                    value={businessData.businessAge || ''}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, businessAge: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Select Age</option>
                    <option value="Less than 6 months">Less than 6 months</option>
                    <option value="6–12 months">6–12 months</option>
                    <option value="1–2 years">1–2 years</option>
                    <option value="2–3 years">2–3 years</option>
                    <option value="3+ years">3+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Annual Revenue Range
                  </label>
                  <input
                    type="text"
                    value={businessData.annualRevenueRange || ''}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, annualRevenueRange: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. $100k-$250k"
                  />
                </div>
              </div>

              {/* Foundation Verification Flags */}
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Core Business Foundation Verification Flags
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  {[
                    { key: 'hasEIN', label: 'EIN Issued' },
                    { key: 'hasBusinessBankAccount', label: 'Business Bank Account' },
                    { key: 'hasWebsite', label: 'Commercial Website' },
                    { key: 'hasBusinessPhone', label: 'Dedicated Business Phone' },
                    { key: 'hasBusinessEmail', label: 'Domain Email' },
                    { key: 'hasBusinessAddress', label: 'Commercial Address' },
                    { key: 'hasBusinessLicense', label: 'Business Licenses' },
                    { key: 'hasDuns', label: 'D-U-N-S Number' },
                    { key: 'hasBusinessCreditProfile', label: 'Bureau Profile' },
                    { key: 'hasReportingAccounts', label: 'Reporting Trade Lines' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                    >
                      <span className="text-[11px] font-medium text-slate-300 block">
                        {item.label}
                      </span>
                      <select
                        value={(businessData as any)[item.key] || 'no'}
                        onChange={(e) =>
                          setBusinessData({
                            ...businessData,
                            [item.key]: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-750 rounded-lg text-xs text-white"
                      >
                        <option value="yes">Yes (Verified)</option>
                        <option value="in_progress">In Progress</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Business Details'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* SECTION 2: Credit Readiness */}
      {activeTab === 'credit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <CardTitle className="text-base font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                    <span>Business Entity Legitimacy</span>
                  </span>
                  <Badge variant="success" className="text-xs">
                    {readiness?.businessReadiness.level || userDetail.readinessScore?.businessReadinessLevel || 'Getting Started'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-extrabold text-teal-400">
                    {readiness?.businessReadiness.score ?? userDetail.readinessScore?.businessReadinessScore ?? 0}
                  </span>
                  <span className="text-xs text-slate-400">out of 100 benchmark score</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Evaluates commercial foundation compliance: entity filing in good standing, dedicated EIN, active commercial checking account, domain website, and commercial phone directory listing.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <CardTitle className="text-base font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>Commercial Credit Readiness</span>
                  </span>
                  <Badge variant="info" className="text-xs">
                    {readiness?.creditReadiness.level || userDetail.readinessScore?.creditReadinessLevel || 'Getting Started'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-extrabold text-indigo-400">
                    {readiness?.creditReadiness.score ?? userDetail.readinessScore?.creditReadinessScore ?? 0}
                  </span>
                  <span className="text-xs text-slate-400">out of 100 benchmark score</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Measures Dun & Bradstreet registration, reporting Tier-1 vendor trade lines, business credit card payment history, and commercial bureau profile readiness.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Engine Next Best Action */}
          {nextBest && (
            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <span>Calculated Next Best Action for this Customer</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{nextBest.title}</span>
                    <Badge variant="warning" className="text-[10px] uppercase">
                      Action Recommended
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{nextBest.explanation}</p>
                  <div className="pt-2 text-[11px] text-slate-500 font-mono">
                    Target Route: {nextBest.actionHref} • CTA: {nextBest.actionLabel}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Credit Check-In Records */}
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-400" />
                  <span>Monthly Business Credit Check-In History</span>
                </CardTitle>
                <Badge variant={customerCheckIns.length > 0 ? 'success' : 'neutral'} className="text-xs">
                  {customerCheckIns.length} Logged
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Self-reported monthly recurring audit responses from this business owner.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {customerCheckIns.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No monthly check-ins submitted by this customer yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {customerCheckIns.map((ci) => (
                    <div key={ci.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{ci.monthYear}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-[11px] text-slate-400">
                            Submitted {new Date(ci.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {ci.newScore !== undefined && (
                          <span className="text-xs font-bold text-brand-400">
                            Recorded Score: {ci.newScore}%
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                        <div className="p-2 rounded bg-slate-950/60 border border-slate-850">
                          <span className="text-slate-500 block">New Accounts</span>
                          <span className={`font-semibold ${ci.responses?.openedNewCreditAccounts === 'yes' ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {ci.responses?.openedNewCreditAccounts === 'yes' ? 'Yes' : 'None'}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-slate-950/60 border border-slate-850">
                          <span className="text-slate-500 block">Reporting Tradelines</span>
                          <span className={`font-semibold ${ci.responses?.vendorAccountsReporting === 'yes' ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {ci.responses?.vendorAccountsReporting === 'yes' ? 'Yes, Confirmed' : ci.responses?.vendorAccountsReporting === 'unsure' ? 'Unsure' : 'Not Yet'}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-slate-950/60 border border-slate-850">
                          <span className="text-slate-500 block">Revenue Trend</span>
                          <span className="text-slate-300 font-semibold capitalize">
                            {ci.responses?.revenueChange || 'Steady'}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-slate-950/60 border border-slate-850">
                          <span className="text-slate-500 block">Prior Milestone</span>
                          <span className={`font-semibold ${ci.responses?.completedPreviousAction === 'yes' ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {ci.responses?.completedPreviousAction === 'yes' ? 'Completed' : ci.responses?.completedPreviousAction === 'partially' ? 'Partially' : 'Not Yet'}
                          </span>
                        </div>
                      </div>

                      {ci.responses?.notes && (
                        <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850 text-xs text-slate-300">
                          <span className="text-slate-500 font-semibold block text-[10px] uppercase">Notes:</span>
                          {ci.responses.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SECTION 3: Funding Readiness */}
      {activeTab === 'funding' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-950 border-slate-800 text-white md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-white flex items-center justify-between">
                  <span>Funding Readiness</span>
                  <Badge variant="warning" className="text-xs">
                    {fundingReadiness?.level || userDetail.fundingReadinessScore?.level || 'Getting Started'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-extrabold text-amber-400">
                    {fundingReadiness?.score ?? userDetail.fundingReadinessScore?.score ?? 0}
                  </span>
                  <span className="text-xs text-slate-400">out of 100</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Consolidated capital readiness index assessing business age, annual gross deposits, reporting lines, and overall institutional bankability.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-800 text-white md:col-span-2">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <CardTitle className="text-base font-bold text-white">Underwriting Attributes</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Self-reported underwriting and borrowing profile parameters.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Annual Revenue</span>
                  <div className="text-base font-bold text-white">
                    {bizProfile?.annualRevenueRange || 'Not reported'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Personal Credit Score Range</span>
                  <div className="text-base font-bold text-white">
                    {bizProfile?.personalCreditRange || 'Not reported'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Requested Funding Target</span>
                  <div className="text-base font-bold text-emerald-400">
                    {bizProfile?.fundingAmount ? `$${bizProfile.fundingAmount}` : 'Flexible / Undisclosed'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Business Longevity</span>
                  <div className="text-base font-bold text-white">
                    {bizProfile?.businessAge || 'Not reported'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* SECTION 4: Roadmap Progress */}
      {activeTab === 'roadmap' && (
        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-400" />
                <span>Section 4: Personalized Roadmap Milestones</span>
              </span>
              <span className="text-xs font-normal text-slate-400">
                Completed {roadmap.completedCount} of {roadmap.totalCount} Tasks ({roadmap.percentage}%)
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Interactive stage-by-stage credit building milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${roadmap.percentage}%` }}
              />
            </div>

            {/* Stages Grid */}
            <div className="space-y-4">
              {roadmap.stages.map((stg) => (
                <div key={stg.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{stg.title}</h4>
                      <p className="text-xs text-slate-400">{stg.description}</p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                        stg.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : stg.status === 'in_progress'
                          ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {stg.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {stg.tasks.map((task) => (
                      <div
                        key={task.key}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${
                          task.status === 'completed'
                            ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-300'
                            : 'bg-slate-950 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-semibold text-white">{task.title}</div>
                          <div className="text-[11px] text-slate-400">{task.whyItMatters}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 5: Plan & Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Top Plan & Entitlement Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Active Plan</span>
              <div className="text-xl font-black text-white">{planLabel}</div>
              <p className="text-xs text-slate-400 pt-1">
                {isGuided
                  ? '$147.99/mo (or $997 12-mo) Guided Tier'
                  : isFoundation
                  ? '$47.99/mo Foundation Tier'
                  : 'Free Tier ($0/mo)'}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Access Source</span>
              <div className="pt-1">
                {(() => {
                  const src = userDetail.subscription?.accessSource || (isGuided || isFoundation ? 'stripe_subscription' : 'free');
                  if (src === 'stripe_subscription') {
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CreditCard className="w-3 h-3" />
                        Stripe Recurring Sub
                      </span>
                    );
                  }
                  if (src === 'stripe_onetime') {
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        <Award className="w-3 h-3" />
                        12-Mo Paid ($997)
                      </span>
                    );
                  }
                  if (src === 'admin_grant') {
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        <Shield className="w-3 h-3" />
                        Admin Granted
                      </span>
                    );
                  }
                  if (src === 'complimentary') {
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        <Sparkles className="w-3 h-3" />
                        Complimentary
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Standard Free
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs text-slate-400 pt-1">
                Provider: {userDetail.subscription?.provider || 'Stripe'}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Expiration / Renewal</span>
              <div className="text-sm font-bold text-slate-200 pt-1">
                {(() => {
                  const exp = userDetail.subscription?.expiresAt;
                  const end = userDetail.subscription?.currentPeriodEnd;
                  const src = userDetail.subscription?.accessSource;
                  if (exp) {
                    const isExp = new Date(exp).getTime() < Date.now();
                    return (
                      <span className={isExp ? 'text-rose-400' : 'text-emerald-400'}>
                        {isExp ? 'Expired: ' : 'Expires: '}
                        {new Date(exp).toLocaleDateString()}
                      </span>
                    );
                  }
                  if (end) {
                    return <span className="text-emerald-400">Renews: {new Date(end).toLocaleDateString()}</span>;
                  }
                  if (src === 'admin_grant' || src === 'complimentary') {
                    return <span className="text-blue-300">Indefinite (No Expiration)</span>;
                  }
                  return <span className="text-slate-400">N/A (Free Tier)</span>;
                })()}
              </div>
              <p className="text-xs text-slate-400 pt-1">
                Status: <span className="text-white capitalize">{userDetail.subscription?.status || 'Active'}</span>
              </p>
            </div>
          </div>

          {/* Owner Plan Action Toolbar */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-400" />
                <span>Owner Entitlement Controls</span>
              </h3>
              <p className="text-xs text-slate-400">
                Directly grant plan entitlements, extend existing access, or revoke administrative overrides.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => setGrantModalOpen(true)}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Grant / Upgrade Plan</span>
              </Button>

              {(userDetail.subscription?.accessSource === 'admin_grant' ||
                userDetail.subscription?.accessSource === 'complimentary') && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExtendModalOpen(true)}
                    className="border-brand-500/40 bg-slate-900 text-brand-300 hover:bg-brand-500/10 text-xs gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Extend Duration</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRevokeModalOpen(true)}
                    className="border-rose-500/40 bg-slate-900 text-rose-300 hover:bg-rose-500/10 text-xs gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Revoke Admin Access</span>
                  </Button>
                </>
              )}

              {userDetail.subscription?.stripeCustomerId && (
                <a
                  href={`https://dashboard.stripe.com/customers/${userDetail.subscription.stripeCustomerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-brand-400" />
                  <span>Stripe Customer</span>
                </a>
              )}

              {userDetail.subscription?.stripeSubscriptionId && (
                <a
                  href={`https://dashboard.stripe.com/subscriptions/${userDetail.subscription.stripeSubscriptionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-brand-400" />
                  <span>Stripe Sub</span>
                </a>
              )}
            </div>
          </div>

          {/* Admin Grant Details (if applicable) */}
          {(userDetail.subscription?.accessSource === 'admin_grant' ||
            userDetail.subscription?.accessSource === 'complimentary') && (
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/50 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-blue-300 font-bold">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Administrative Grant Metadata</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300 pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Granted By:</span>
                  <span className="font-mono text-white">{userDetail.subscription.grantedBy || 'Owner / Administrator'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Granted Date:</span>
                  <span className="text-white">
                    {userDetail.subscription.grantedAt
                      ? new Date(userDetail.subscription.grantedAt).toLocaleString()
                      : 'Recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Grant Reason:</span>
                  <span className="text-white italic">&quot;{userDetail.subscription.grantReason || 'Administrative approval'}&quot;</span>
                </div>
              </div>
            </div>
          )}

          {/* Precedence Notice Callout */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-400" />
              <span>Crediqly Entitlement Precedence &amp; Billing Rules</span>
            </div>
            <p className="leading-relaxed">
              1. <strong className="text-slate-200">Active Stripe Subscription</strong> ($47.99/mo Foundation or $147.99/mo Guided) always takes priority.
              <br />
              2. <strong className="text-slate-200">12-Month One-Time Purchase</strong> ($997) provides 12-month Guided access without recurring charges.
              <br />
              3. <strong className="text-slate-200">Owner Admin Grants</strong> allow temporary or complimentary access without generating simulated Stripe transactions.
              <br />
              4. When an admin grant is revoked, access immediately recalculates back to the customer&apos;s active Stripe subscription or the Free default tier.
            </p>
          </div>

          {/* Payment Transactions Table */}
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Verified Payment &amp; Transaction History</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Genuine database-backed payments and subscription transactions for this customer.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {userDetail.payments && userDetail.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Stripe Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {userDetail.payments.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-900/30">
                          <td className="py-3 px-4 text-slate-300">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-medium text-white">{p.description || 'Subscription Payment'}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            ${((p.amount || 0) / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="success" className="text-[10px] capitalize">
                              {p.status || 'succeeded'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                            {p.stripePaymentIntentId || p.stripeCheckoutSessionId || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No payment transactions recorded yet for this customer.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SECTION 6: Advisory & Meetings */}
      {activeTab === 'advisory' && (
        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Section 6: Guided Advisory &amp; Consultation Records</span>
              </span>
              <Link href="/admin/consultations">
                <Button size="sm" variant="outline" className="text-xs border-slate-700 bg-slate-900 text-white hover:text-white hover:bg-slate-800 font-bold shadow-xs">
                  Open Advisory Central
                </Button>
              </Link>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Monthly 1-on-1 advisor strategy sessions and consultation appointments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {userDetail.consultations && userDetail.consultations.length > 0 ? (
              <div className="space-y-4">
                {userDetail.consultations.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{c.consultation_type || c.consultationType}</span>
                          <Badge variant="info" className="text-[10px]">
                            {c.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Requested for {c.preferred_date || c.preferredDate} at {c.preferred_time || c.preferredTime}
                        </div>
                      </div>

                      {/* Meeting Status Quick Actions */}
                      <div className="flex items-center gap-2">
                        {c.status === 'Requested' && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleUpdateMeeting(c.id, {
                                status: 'Confirmed',
                                confirmedDate: c.preferred_date || c.preferredDate,
                                confirmedTime: c.preferred_time || c.preferredTime,
                              })
                            }
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7"
                          >
                            Confirm Date
                          </Button>
                        )}
                        {c.status === 'Confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateMeeting(c.id, { status: 'Completed' })}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs h-7"
                          >
                            Mark Completed
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Customer & Advisor Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-semibold text-slate-400 block mb-1">Customer Goals / Notes:</span>
                        <p className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                          {c.customer_message || c.customerMessage || 'No specific agenda submitted.'}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400 block mb-1">Advisor Notes / Meeting Link:</span>
                        <p className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                          {c.admin_message || c.adminMessage || 'No advisor notes recorded.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No advisory meetings scheduled yet for this customer.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION 7: Funding Applications */}
      {activeTab === 'applications' && (
        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                <span>Section 7: Tracked Funding Applications</span>
              </span>
              <Link href="/admin/funding-applications">
                <Button size="sm" variant="outline" className="text-xs border-slate-700 bg-slate-900 text-white hover:text-white hover:bg-slate-800 font-bold shadow-xs">
                  Open Funding Central
                </Button>
              </Link>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Applications actively tracked in the customer&apos;s Funding Tracker.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {userDetail.fundingApplications && userDetail.fundingApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Provider</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Requested</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Quick Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {userDetail.fundingApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-900/30">
                        <td className="py-3 px-4 font-semibold text-white">{app.provider_name || app.providerName}</td>
                        <td className="py-3 px-4 text-slate-300">{app.product_name || app.productName}</td>
                        <td className="py-3 px-4 text-slate-400 capitalize">{app.category || 'General'}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          ${(app.requested_amount || app.requestedAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="info" className="text-[10px]">
                            {app.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={app.status}
                            onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                            className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                          >
                            <option value="Interested">Interested</option>
                            <option value="Applied">Applied</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Approved">Approved</option>
                            <option value="Funded">Funded</option>
                            <option value="Declined">Declined</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No funding applications tracked yet for this customer.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION 8: Product Recommendations */}
      {activeTab === 'recommendations' && (
        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Section 8: Algorithmic Product & Trade Line Recommendations</span>
              </span>
              <span className="text-xs text-slate-400">
                {recommendedProducts.length} Matches Evaluated
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Deterministic rule-based recommendations generated for this customer profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {recommendedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendedProducts.slice(0, 8).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{rec.name}</h4>
                      <Badge
                        variant={
                          rec.matchLabel === 'Strong Match'
                            ? 'success'
                            : rec.matchLabel === 'Potential Match'
                            ? 'info'
                            : 'neutral'
                        }
                        className="text-[10px]"
                      >
                        {rec.matchLabel}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400 capitalize">
                      {CATEGORY_LABELS[rec.category] || rec.category.replace(/_/g, ' ')}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      {rec.recommendationReason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No active products in catalog. Add products under &quot;Products&quot; in admin panel.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION 9: Internal Administrative Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-400" />
                    <span>Section 9: Confidential Internal Notes &amp; Activity Log</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-1">
                    Internal notes are strictly restricted to application owners and administrators. Customers cannot view this section.
                  </CardDescription>
                </div>
                <Badge variant="neutral" className="text-[10px] font-mono">
                  {notes.length} {notes.length === 1 ? 'Note' : 'Notes'} Recorded
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Record New Administrative Note
                </label>
                <textarea
                  rows={3}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Record onboarding observations, customer call summaries, VIP arrangement details, or verification notes..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-brand-400" />
                    Encrypted internal audit record
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={addingNote || !newNoteContent.trim()}
                    className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{addingNote ? 'Saving...' : 'Add Internal Note'}</span>
                  </Button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Historical Internal Notes
                </h4>
                {notes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                    No administrative notes recorded yet for this customer.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">
                              {note.adminEmail || 'Owner / Administrator'}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(note.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SECTION 10: Account & Security */}
      {activeTab === 'account' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <CardTitle className="text-base font-bold text-white">Account Roles & Operational Status</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Manage user credentials, administration tier, and access privileges.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address (Auth Identifier)
                    </label>
                    <input
                      type="email"
                      value={userDetail.profile.email}
                      disabled
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      >
                        <option value="user">User (Customer Access)</option>
                        <option value="staff">Staff (Support Specialist)</option>
                        <option value="admin">Admin (Full Console Access)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as AccountStatus)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      >
                        <option value="active">Active (Full Access)</option>
                        <option value="disabled">Disabled (Blocked from login)</option>
                        <option value="suspended">Suspended (Under Review)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      {status !== 'suspended' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPendingStatus('suspended');
                            setStatusConfirmModalOpen(true);
                          }}
                          className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Suspend Account</span>
                        </Button>
                      )}
                      {status !== 'active' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPendingStatus('active');
                            setStatusConfirmModalOpen(true);
                          }}
                          className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-xs gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reactivate Account</span>
                        </Button>
                      )}
                      {status !== 'disabled' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPendingStatus('disabled');
                            setStatusConfirmModalOpen(true);
                          }}
                          className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Disable Account</span>
                        </Button>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-400" />
                  <span>Credential Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs text-slate-400">
                <p>
                  Passwords are securely hashed via bcrypt in Supabase Auth. Click below to email a single-use password reset link to the customer.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendPasswordReset}
                  disabled={resettingPassword}
                  className="w-full border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs"
                >
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                  <span>{resettingPassword ? 'Sending...' : 'Trigger Password Reset'}</span>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <CardTitle className="text-sm font-bold text-white">System Timestamps</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-2.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Profile ID:</span>
                  <span className="font-mono text-slate-300">{userDetail.profile.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-slate-300">
                    {new Date(userDetail.profile.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="text-slate-300">
                    {new Date(userDetail.profile.updatedAt).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 10. Live Command Center Inspector Tab */}
      {activeTab === 'dashboard_view' && (
        <div className="space-y-6">
          {/* Admin Notice Banner */}
          <div className="p-4 rounded-xl bg-slate-900 border border-brand-500/30 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Client Command Center Mirror
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Administrative live inspection of customer <strong className="text-white">{userDetail.profile.email}</strong>&apos;s personal dashboard view, real-time readiness scores, prioritized next steps, and matched credit opportunities.
                </p>
              </div>
            </div>
            <Link
              href={`/admin/customers`}
              className="text-xs text-brand-400 hover:text-brand-300 underline whitespace-nowrap self-center"
            >
              Return to Customers
            </Link>
          </div>

          {/* Core Command Center Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Readiness & What Should I Do Next */}
            <div className="lg:col-span-2 space-y-6">
              {/* Readiness Hero Card */}
              <Card className="bg-slate-950 border-slate-800 text-white">
                <CardContent className="p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                        Real-Time Funding Readiness
                      </span>
                      <h2 className="text-2xl font-black text-white mt-1">
                        {fundingReadiness?.score ?? 0}
                        <span className="text-sm font-normal text-slate-400"> / 100 Overall Score</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Computed from {bizProfile?.businessName || 'Business'}&apos;s profile attributes, compliance data, and Bureau trade-lines.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          (fundingReadiness?.score ?? 0) >= 80
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : (fundingReadiness?.score ?? 0) >= 50
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {(fundingReadiness?.score ?? 0) >= 80
                          ? 'Funding Ready'
                          : (fundingReadiness?.score ?? 0) >= 50
                          ? 'Progressing'
                          : 'Needs Foundation'}
                      </span>
                    </div>
                  </div>

                  {/* 4 Readiness Category Breakdown Bars */}
                  {fundingReadiness?.categories && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-900">
                      {Object.values(fundingReadiness.categories).map((cat) => (
                        <div key={cat.category} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium truncate">{cat.label}</span>
                            <span className="font-bold text-white font-mono">
                              {cat.score} / {cat.maxScore} ({cat.percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                cat.percentage >= 80
                                  ? 'bg-emerald-400'
                                  : cat.percentage >= 50
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                              }`}
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* "What Should I Do Next?" Focus Card Mirror */}
              <Card className="bg-slate-950 border-brand-500/30 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-400" />
                      <CardTitle className="text-sm font-bold text-white">
                        Customer&apos;s Active Focus (&ldquo;What Should I Do Next?&rdquo;)
                      </CardTitle>
                    </div>
                    {fundingReadiness?.nextBestAction?.priority && (
                      <Badge variant="warning" className="text-[10px] uppercase tracking-wider">
                        {fundingReadiness.nextBestAction.priority} Priority
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {nextBest ? (
                    <div>
                      <h4 className="text-base font-bold text-white">{nextBest.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{nextBest.explanation}</p>
                      {nextBest.actionLabel && (
                        <div className="mt-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-brand-400 text-xs font-semibold">
                            <span>Recommended CTA: {nextBest.actionLabel}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({nextBest.actionHref})</span>
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                      <p>All core readiness tasks completed for this customer profile!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 5-Stage Roadmap Progress Bar */}
              <Card className="bg-slate-950 border-slate-800 text-white">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-brand-400" />
                      <span>5-Stage Roadmap Status</span>
                    </CardTitle>
                    <span className="text-xs font-mono text-slate-400">
                      {roadmap.completedCount} / {roadmap.totalCount} Tasks Complete
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500"
                      style={{
                        width: `${roadmap.totalCount > 0 ? (roadmap.completedCount / roadmap.totalCount) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
                    {roadmap.stages.map((stage) => {
                      const isFinished = stage.totalCount > 0 && stage.completedCount === stage.totalCount;
                      return (
                        <div
                          key={stage.id}
                          className={`p-2.5 rounded-xl border text-center space-y-1 ${
                            isFinished
                              ? 'bg-emerald-950/30 border-emerald-800/60'
                              : stage.completedCount > 0
                              ? 'bg-slate-900 border-brand-500/40'
                              : 'bg-slate-900/40 border-slate-800'
                          }`}
                        >
                          <div className="text-[10px] font-bold text-slate-400 uppercase truncate">
                            Stage {stage.order}
                          </div>
                          <div className="text-xs font-bold text-white truncate">{stage.title}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {stage.completedCount}/{stage.totalCount}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Funding Opportunities & Profile Snapshot */}
            <div className="space-y-6">
              {/* Business Profile Snapshot Card */}
              <Card className="bg-slate-950 border-slate-800 text-white">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-brand-400" />
                    <span>Business Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Legal Entity:</span>
                    <span className="font-semibold text-white">{bizProfile?.entityType || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Industry:</span>
                    <span className="font-semibold text-white">{bizProfile?.industry || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Time in Business:</span>
                    <span className="font-semibold text-white">
                      {bizProfile?.businessAge || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Annual Revenue:</span>
                    <span className="font-semibold text-brand-400 font-mono">
                      {bizProfile?.annualRevenueRange || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Business Bank:</span>
                    <span className="font-semibold text-white">
                      {bizProfile?.hasBusinessBankAccount === 'yes' ? 'Commercial Account Active' : 'Not linked'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">D-U-N-S Number:</span>
                    <span className="font-mono text-slate-300">
                      {bizProfile?.hasDuns === 'yes' ? 'Registered' : 'None'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Matched Funding Opportunities */}
              <Card className="bg-slate-950 border-slate-800 text-white">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-brand-400" />
                      <span>Matched Opportunities</span>
                    </CardTitle>
                    <Badge variant="neutral" className="text-[10px]">
                      {recommendedProducts.length} Matches
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5">
                  {recommendedProducts.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No funding matches found yet for current profile attributes.
                    </p>
                  ) : (
                    recommendedProducts.slice(0, 4).map((rec, i) => (
                      <div
                        key={rec.id || i}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate max-w-[170px]">
                            {rec.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              rec.matchScore >= 80
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {rec.matchScore}% Match
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{CATEGORY_LABELS[rec.category] || rec.category}</span>
                          <span className="font-mono text-brand-400 font-semibold">{rec.matchLabel}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Grant Plan Access Modal */}
      {grantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-brand-400">
                <Shield className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Grant Plan Access (Owner Override)</h3>
              </div>
              <button
                type="button"
                onClick={() => setGrantModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGrantPlan} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Manually grant Foundation or Guided plan entitlements to{' '}
                <strong className="text-white">{userDetail.profile.email}</strong>.
                This provides full application features without charging a credit card or generating fake Stripe payments.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Plan</label>
                  <select
                    value={grantPlan}
                    onChange={(e) => setGrantPlan(e.target.value as 'foundation' | 'guided')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="foundation">Foundation ($47.99/mo value)</option>
                    <option value="guided">Guided ($147.99/mo / $997 value)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Grant Category</label>
                  <select
                    value={grantType}
                    onChange={(e) => setGrantType(e.target.value as 'admin_grant' | 'complimentary')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="admin_grant">Admin Override</option>
                    <option value="complimentary">Complimentary / VIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Entitlement Duration</label>
                <select
                  value={grantDuration}
                  onChange={(e) => setGrantDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months (1 Year)</option>
                  <option value={0}>Indefinite (No Expiration)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reason for Grant <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="e.g. Approved VIP access for pilot partner; billing dispute resolution; scholarship grant"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGrantModalOpen(false)}
                  disabled={grantLoading}
                  className="border-slate-750 text-slate-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={grantLoading || !grantReason.trim()}
                  className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
                >
                  {grantLoading ? 'Granting Access...' : 'Confirm Plan Grant'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Plan Access Modal */}
      {revokeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Revoke Administrative Plan Access</h3>
              </div>
              <button
                type="button"
                onClick={() => setRevokeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRevokePlan} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Revoking administrative access will remove manual overrides for{' '}
                <strong className="text-white">{userDetail.profile.email}</strong>.
              </p>

              <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl text-xs text-rose-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Automatic Precedence Recalculation</span>
                </div>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">
                  If this customer has an active paid Stripe subscription, access will immediately restore to that subscription. Otherwise, the customer will revert to the standard Free tier. Active Stripe subscriptions and payment records are NOT deleted.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Revocation Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Promotional entitlement period ended; requested by customer; account review"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRevokeModalOpen(false)}
                  disabled={revokeLoading}
                  className="border-slate-750 text-slate-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={revokeLoading || !revokeReason.trim()}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  {revokeLoading ? 'Revoking Access...' : 'Confirm Revocation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Entitlement Modal */}
      {extendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-brand-400">
                <Clock className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Extend Entitlement Duration</h3>
              </div>
              <button
                type="button"
                onClick={() => setExtendModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExtendPlan} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Add additional duration to the active administrative grant for{' '}
                <strong className="text-white">{userDetail.profile.email}</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Additional Duration</label>
                <select
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value={1}>+1 Additional Month</option>
                  <option value={3}>+3 Additional Months</option>
                  <option value={6}>+6 Additional Months</option>
                  <option value={12}>+12 Additional Months (1 Year)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Extension Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="e.g. Extended for client satisfaction, continuation of coaching program"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExtendModalOpen(false)}
                  disabled={extendLoading}
                  className="border-slate-750 text-slate-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={extendLoading || !extendReason.trim()}
                  className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
                >
                  {extendLoading ? 'Extending...' : 'Confirm Extension'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Status Confirmation Modal */}
      {statusConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Confirm Account Status Change</h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusConfirmModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Are you sure you want to change account status for{' '}
                <strong className="text-white">{userDetail.profile.email}</strong> to{' '}
                <strong className="text-amber-300 uppercase">{pendingStatus}</strong>?
              </p>
              {pendingStatus === 'suspended' && (
                <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl text-amber-200 text-xs">
                  <strong>Notice:</strong> The user will be temporarily prevented from accessing the platform and generating new assessment reports while under review.
                </div>
              )}
              {pendingStatus === 'disabled' && (
                <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl text-rose-200 text-xs">
                  <strong>Notice:</strong> The account will be completely disabled. All active sessions and login attempts will be rejected.
                </div>
              )}
              {pendingStatus === 'active' && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-emerald-200 text-xs">
                  <strong>Notice:</strong> The account will be restored to active status with full platform access.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStatusConfirmModalOpen(false)}
                disabled={statusChangeLoading}
                className="border-slate-750 text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmStatusUpdate}
                disabled={statusChangeLoading}
                className={`text-white text-xs font-bold ${
                  pendingStatus === 'disabled'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : pendingStatus === 'suspended'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {statusChangeLoading ? 'Updating Status...' : `Set as ${pendingStatus.toUpperCase()}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
