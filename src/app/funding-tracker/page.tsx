'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Building2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  FileText,
  Calendar,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { SectionInactiveNotice } from '@/components/common/SectionInactiveNotice';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { useAuth } from '@/context/AuthContext';
import {
  getUserFundingApplications,
  createFundingApplication,
  updateFundingApplication,
  deleteFundingApplication,
} from '@/lib/supabase/fundingApplicationService';
import {
  getFundingProducts,
  resolveFundingProductOutboundUrl,
  recordFundingProductClick,
} from '@/lib/supabase/fundingProductService';
import {
  FundingApplication,
  FundingApplicationStatus,
  getStatusGuidance,
} from '@/types/fundingApplication';
import { FundingProduct } from '@/types/fundingProduct';

const STATUS_LIST: FundingApplicationStatus[] = [
  'Interested',
  'Planning to Apply',
  'Applied',
  'Documents Requested',
  'Submitted',
  'Approved',
  'Declined',
  'Funded',
];

export default function FundingTrackerPage() {
  const { user } = useAuth();
  const { sections } = usePlatformSections();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<FundingApplication[]>([]);
  const [fundingProducts, setFundingProducts] = useState<FundingProduct[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<FundingApplication | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    fundingProductId: '',
    requestedAmount: 0,
    status: 'Interested' as FundingApplicationStatus,
    applicationDate: '',
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [userApps, prods] = await Promise.all([
        getUserFundingApplications(user.id),
        getFundingProducts(),
      ]);
      setApplications(userApps);
      setFundingProducts(prods);
    } catch (err) {
      console.warn('Failed to load tracker applications:', err);
      showToast('Error loading application tracker');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (selectedStatusFilter !== 'all' && app.status !== selectedStatusFilter) {
        return false;
      }
      return true;
    });
  }, [applications, selectedStatusFilter]);

  const stats = useMemo(() => {
    const total = applications.length;
    const inProgress = applications.filter((a) =>
      ['Planning to Apply', 'Applied', 'Documents Requested', 'Submitted'].includes(
        a.status
      )
    ).length;
    const approvedOrFunded = applications.filter((a) =>
      ['Approved', 'Funded'].includes(a.status)
    ).length;
    return { total, inProgress, approvedOrFunded };
  }, [applications]);

  const handleOpenAddModal = () => {
    const defaultProduct = fundingProducts[0];
    setFormData({
      fundingProductId: defaultProduct ? defaultProduct.id : '',
      requestedAmount: defaultProduct?.minFundingAmount || 10000,
      status: 'Interested',
      applicationDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setAddModalOpen(true);
  };

  const handleOpenEditModal = (app: FundingApplication) => {
    setEditingApp(app);
    setFormData({
      fundingProductId: app.fundingProductId,
      requestedAmount: app.requestedAmount || 0,
      status: app.status,
      applicationDate: app.applicationDate || '',
      notes: app.notes || '',
    });
    setEditModalOpen(true);
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.fundingProductId) return;

    const selectedProduct = fundingProducts.find(
      (p) => p.id === formData.fundingProductId
    );
    if (!selectedProduct) return;

    setSaving(true);
    try {
      const created = await createFundingApplication(
        {
          fundingProductId: selectedProduct.id,
          providerName: selectedProduct.provider,
          productName: selectedProduct.name,
          category: selectedProduct.category,
          requestedAmount: Number(formData.requestedAmount) || 0,
          status: formData.status,
          applicationDate: formData.applicationDate,
          notes: formData.notes,
        },
        user.id
      );

      setApplications((prev) => {
        const existing = prev.find((a) => a.id === created.id);
        if (existing) return prev;
        return [created, ...prev];
      });

      showToast(`Added "${selectedProduct.name}" to your tracker`);
      setAddModalOpen(false);
    } catch (err) {
      showToast('Failed to add application to tracker');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    setSaving(true);
    try {
      const updated = await updateFundingApplication(editingApp.id, {
        requestedAmount: Number(formData.requestedAmount) || 0,
        status: formData.status,
        applicationDate: formData.applicationDate,
        notes: formData.notes,
      });

      if (updated) {
        setApplications((prev) =>
          prev.map((a) => (a.id === editingApp.id ? { ...a, ...updated } : a))
        );
        showToast('Application updated successfully');
      }
      setEditModalOpen(false);
    } catch (err) {
      showToast('Failed to update application');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const ok = await deleteFundingApplication(id);
      if (ok) {
        setApplications((prev) => prev.filter((a) => a.id !== id));
        showToast('Application removed from tracker');
      }
    } catch (err) {
      showToast('Failed to remove application');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleContinueToProvider = (app: FundingApplication) => {
    const product = fundingProducts.find((p) => p.id === app.fundingProductId);
    if (product) {
      recordFundingProductClick(product.id, user?.id);
      const url = resolveFundingProductOutboundUrl(product);
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (app.websiteUrl) {
      window.open(app.websiteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getStatusBadge = (status: FundingApplicationStatus) => {
    const guidance = getStatusGuidance(status);
    let variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' = 'neutral';

    if (guidance.color === 'brand' || guidance.color === 'info') variant = 'info';
    else if (guidance.color === 'warning') variant = 'warning';
    else if (guidance.color === 'success') variant = 'success';
    else if (guidance.color === 'danger') variant = 'danger';

    return <Badge variant={variant}>{status}</Badge>;
  };

  if (sections.funding_tracker === false) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <SectionInactiveNotice
            title="Funding Tracker Temporarily Inactive"
            description="The funding application tracker is currently disabled by the administrator. Please return to your main dashboard or check back soon."
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-[400px] flex items-center justify-center">
            <LoadingState message="Loading your funding tracker..." />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Toast feedback */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-in fade-in slide-in-from-bottom-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
                  Opportunity Tracker
                </span>
                <span className="text-xs text-slate-400">Personal Commercial Pipeline</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <FileCheck className="w-7 h-7 text-brand-600" />
                <span>Funding Tracker</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Track and manage your commercial funding opportunities and application milestones.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link href="/funding">
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <span>Browse Funding Options</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddModal}
                className="text-xs gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Track New Opportunity</span>
              </Button>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-200/80 bg-white">
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Tracked
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Building2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white">
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    In Progress
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-brand-600 mt-1">
                    {stats.inProgress}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                  <Clock className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white">
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Approved / Funded
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                    {stats.approvedOrFunded}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedStatusFilter === 'all'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Applications ({applications.length})
              </button>

              {STATUS_LIST.map((status) => {
                const count = applications.filter((a) => a.status === status).length;
                if (count === 0 && selectedStatusFilter !== status) return null;
                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedStatusFilter === status
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* APPLICATIONS LIST / CARDS */}
          {filteredApplications.length === 0 ? (
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-8 sm:p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto text-slate-400">
                  <FileCheck className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-slate-900">
                    No Tracked Funding Applications Yet
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Explore recommended funding options tailored to your business profile and track your progress through the application process.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Link href="/funding">
                    <Button variant="primary" size="sm" className="text-xs gap-1.5 shadow-sm">
                      <span>Explore Funding Options</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAddModal}
                    className="text-xs gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Manually</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => {
                const guidance = getStatusGuidance(app.status);

                return (
                  <Card
                    key={app.id}
                    className="border-slate-200/90 bg-white hover:border-slate-300 transition-colors shadow-xs overflow-hidden"
                  >
                    <CardContent className="p-5 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {app.providerName}
                            </span>
                            {app.category && (
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {app.category}
                              </span>
                            )}
                            {getStatusBadge(app.status)}
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                            {app.productName}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(app)}
                            className="text-xs gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Status</span>
                          </Button>

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleContinueToProvider(app)}
                            className="text-xs gap-1.5 shadow-xs"
                          >
                            <span>Continue to Provider</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>

                          <button
                            onClick={() => setDeleteConfirmId(app.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors"
                            title="Remove from tracker"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Detail Metrics Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Requested Amount
                          </span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {app.requestedAmount && app.requestedAmount > 0
                              ? `$${app.requestedAmount.toLocaleString()}`
                              : 'Not specified'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Application Date
                          </span>
                          <span className="font-semibold text-slate-700">
                            {app.applicationDate ? app.applicationDate : 'Not submitted yet'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Added to Tracker
                          </span>
                          <span className="font-medium text-slate-600">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Last Updated
                          </span>
                          <span className="font-medium text-slate-600">
                            {new Date(app.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Guidance Next Step */}
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-50/60 border border-brand-100 text-xs">
                        <Sparkles className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-brand-900">Next Action: </span>
                          <span className="text-brand-800">{guidance.nextAction}</span>
                        </div>
                      </div>

                      {/* Notes Section (if any) */}
                      {app.notes && (
                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs text-slate-600">
                          <span className="font-bold text-slate-700 block mb-0.5">Your Notes:</span>
                          <p className="whitespace-pre-line leading-relaxed">{app.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Statutory Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>Commercial Funding Disclaimer</span>
            </div>
            <p>
              Crediqly is an educational credit management and tracking platform. Crediqly does not originate, underwrite, or process commercial loans or financial applications directly. Application status is tracked by you for informational purposes and may need to be verified with the funding provider. We do not collect or store sensitive application documents or financial login credentials.
            </p>
          </div>
        </div>

        {/* ADD FUNDING MODAL */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Track a Funding Opportunity
                </h3>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateApplication} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Select Funding Option *
                  </label>
                  <select
                    required
                    value={formData.fundingProductId}
                    onChange={(e) => setFormData({ ...formData, fundingProductId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {fundingProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.provider} — {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Requested Amount ($)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={formData.requestedAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, requestedAmount: Number(e.target.value) })
                      }
                      placeholder="e.g. 25000"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as FundingApplicationStatus,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      {STATUS_LIST.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Application Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.applicationDate}
                    onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Personal Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g., Rep contact info, questions to ask, documents needed..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAddModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={saving}>
                    {saving ? 'Adding...' : 'Add to Tracker'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT APPLICATION MODAL */}
        {editModalOpen && editingApp && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Update Application Status
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingApp.providerName} — {editingApp.productName}
                  </p>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateApplication} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as FundingApplicationStatus,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {STATUS_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Requested Amount ($)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={formData.requestedAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, requestedAmount: Number(e.target.value) })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Application Date
                    </label>
                    <input
                      type="date"
                      value={formData.applicationDate}
                      onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Personal Notes & Next Steps
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Update on correspondence, lender request notes, follow-up dates..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-bold text-slate-900">Remove from Tracker?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove this opportunity from your tracker? This will only delete your personal tracking record — the funding option remains available in Crediqly.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmId(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs"
                >
                  Yes, Remove
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
