'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Landmark,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Link as LinkIcon,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getAllBanksAdmin,
  createBankAdmin,
  updateBankAdmin,
  deleteBankAdmin,
  updateBankAffiliate,
  resolveBankOutboundUrl,
} from '@/lib/supabase/bankService';
import { Bank, BankStatus } from '@/types/bank';

const STAGES = [
  { id: 'foundation', label: 'Business Foundation' },
  { id: 'credit_foundation', label: 'Credit Foundation' },
  { id: 'building', label: 'Credit Building' },
  { id: 'optimization', label: 'Credit Optimization' },
  { id: 'funding', label: 'Funding Preparation' },
];

export default function AdminBanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [affiliateModalOpen, setAffiliateModalOpen] = useState(false);
  const [affiliateBank, setAffiliateBank] = useState<Bank | null>(null);
  const [affiliateUrlInput, setAffiliateUrlInput] = useState('');
  const [affiliateEnabledInput, setAffiliateEnabledInput] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadBanks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllBanksAdmin();
      setBanks(data);
    } catch (err) {
      console.error('Failed to load banks:', err);
      showToast('Failed to load commercial banks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanks();
  }, [loadBanks]);

  // Filtered banks
  const filteredBanks = useMemo(() => {
    return banks.filter((b) => {
      if (selectedStatus !== 'all' && b.status !== selectedStatus) return false;
      if (selectedPriority !== 'all' && b.priority !== Number(selectedPriority)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.name.toLowerCase().includes(q);
        const matchSlug = b.slug.toLowerCase().includes(q);
        const matchDesc = (b.shortDescription || '').toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchDesc) return false;
      }
      return true;
    });
  }, [banks, selectedStatus, selectedPriority, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = banks.length;
    const active = banks.filter((b) => b.status === 'active').length;
    const affiliate = banks.filter((b) => b.affiliateEnabled && b.affiliateUrl).length;
    const featured = banks.filter((b) => b.featured).length;
    return { total, active, affiliate, featured };
  }, [banks]);

  // Handlers
  const handleToggleStatus = async (bank: Bank) => {
    const nextStatus: BankStatus = bank.status === 'active' ? 'inactive' : 'active';
    const res = await updateBankAdmin(bank.id, { status: nextStatus });
    if (res.success && res.bank) {
      setBanks((prev) => prev.map((b) => (b.id === bank.id ? res.bank! : b)));
      showToast(`${bank.name} set to ${nextStatus.toUpperCase()}`);
    } else {
      showToast('Failed to toggle status');
    }
  };

  const handleToggleFeatured = async (bank: Bank) => {
    const nextFeatured = !bank.featured;
    const res = await updateBankAdmin(bank.id, { featured: nextFeatured });
    if (res.success && res.bank) {
      setBanks((prev) => prev.map((b) => (b.id === bank.id ? res.bank! : b)));
      showToast(`${bank.name} ${nextFeatured ? 'marked as Featured' : 'removed from Featured'}`);
    }
  };

  const handleOpenAffiliateModal = (bank: Bank) => {
    setAffiliateBank(bank);
    setAffiliateUrlInput(bank.affiliateUrl || '');
    setAffiliateEnabledInput(Boolean(bank.affiliateEnabled));
    setAffiliateModalOpen(true);
  };

  const handleSaveAffiliate = async () => {
    if (!affiliateBank) return;
    setSaving(true);
    const res = await updateBankAffiliate(affiliateBank.id, affiliateUrlInput, affiliateEnabledInput);
    setSaving(false);
    if (res.success && res.bank) {
      setBanks((prev) => prev.map((b) => (b.id === affiliateBank.id ? res.bank! : b)));
      setAffiliateModalOpen(false);
      showToast(`Affiliate settings updated for ${affiliateBank.name}`);
    } else {
      showToast('Failed to update affiliate settings');
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    const res = await deleteBankAdmin(id);
    setSaving(false);
    setDeleteConfirmId(null);
    if (res.success) {
      setBanks((prev) => prev.filter((b) => b.id !== id));
      showToast('Bank deleted successfully');
    } else {
      showToast('Failed to delete bank');
    }
  };

  const handleOpenCreate = () => {
    setEditingBank({
      id: '',
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      websiteUrl: '',
      affiliateUrl: '',
      affiliateEnabled: false,
      featured: false,
      status: 'active',
      priority: 2,
      displayOrder: banks.length + 1,
      recommendedStage: 'foundation',
      minDeposit: '$0',
      monthlyFee: '$0',
      features: ['No account maintenance fees', 'Seamless accounting software integration'],
    });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (bank: Bank) => {
    setEditingBank({ ...bank });
    setEditModalOpen(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBank) return;
    if (!editingBank.name || !editingBank.slug || !editingBank.websiteUrl) {
      showToast('Please fill in required fields (Name, Slug, Website URL)');
      return;
    }

    setSaving(true);
    try {
      if (!editingBank.id) {
        // Create new
        const { id, createdAt, updatedAt, ...rest } = editingBank;
        const res = await createBankAdmin(rest);
        if (res.success && res.bank) {
          setBanks((prev) => [res.bank!, ...prev]);
          setEditModalOpen(false);
          showToast(`Bank "${res.bank.name}" created successfully`);
        } else {
          showToast(res.error || 'Failed to create bank');
        }
      } else {
        // Update existing
        const res = await updateBankAdmin(editingBank.id, editingBank);
        if (res.success && res.bank) {
          setBanks((prev) => prev.map((b) => (b.id === editingBank.id ? res.bank! : b)));
          setEditModalOpen(false);
          showToast(`Bank "${res.bank.name}" updated successfully`);
        } else {
          showToast(res.error || 'Failed to update bank');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Commercial Banks</h1>
            <Badge variant="info" className="bg-brand-900/50 text-brand-300 border-brand-800">
              Admin Control
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage recommended business checking accounts, referral links, and priority placement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBanks}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Bank
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Banks</div>
            <div className="text-2xl font-bold text-white mt-1">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Customers See</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.active}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Affiliate Enabled</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.affiliate}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Featured Banks</div>
            <div className="text-2xl font-bold text-brand-400 mt-1">{metrics.featured}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-slate-800/60 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search banks by name, slug, or features..."
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Priorities</option>
                <option value="1">Priority 1 (High)</option>
                <option value="2">Priority 2 (Standard)</option>
                <option value="3">Priority 3 (Low)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banks Table */}
      {loading ? (
        <Card className="bg-slate-800/60 border-slate-700 p-12">
          <LoadingState message="Loading commercial banks catalog..." />
        </Card>
      ) : filteredBanks.length === 0 ? (
        <Card className="bg-slate-800/60 border-slate-700 p-12 text-center">
          <Landmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No banks found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery || selectedStatus !== 'all'
              ? 'No commercial banks matched your active filters. Try clearing your search.'
              : 'Get started by creating your first commercial bank recommendation.'}
          </p>
          <Button onClick={handleOpenCreate} className="mt-4 bg-brand-600 hover:bg-brand-700 text-white" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Bank
          </Button>
        </Card>
      ) : (
        <Card className="bg-slate-800/60 border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/70 border-b border-slate-700 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Bank Name & Details</th>
                  <th className="py-3 px-4">Stage & Priority</th>
                  <th className="py-3 px-4">Pricing</th>
                  <th className="py-3 px-4">Affiliate Status</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                {filteredBanks.map((bank) => {
                  const outbound = resolveBankOutboundUrl(bank);
                  return (
                    <tr key={bank.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleFeatured(bank)}
                            className="mt-0.5 text-slate-500 hover:text-amber-400 transition-colors"
                            title={bank.featured ? 'Featured bank (Click to unfeature)' : 'Click to feature'}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                bank.featured ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                              }`}
                            />
                          </button>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {bank.name}
                              {bank.featured && (
                                <Badge variant="warning" className="text-[10px] py-0 px-1.5 font-bold">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                              {bank.shortDescription || bank.description}
                            </p>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              /{bank.slug} • Order #{bank.displayOrder}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stage & Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {STAGES.find((s) => s.id === bank.recommendedStage)?.label || bank.recommendedStage}
                          </Badge>
                          <div>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                                bank.priority === 1
                                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                                  : bank.priority === 3
                                  ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                  : 'bg-blue-950/80 text-blue-300 border border-blue-800'
                              }`}
                            >
                              Priority {bank.priority} {bank.priority === 1 ? '(High)' : bank.priority === 3 ? '(Low)' : '(Standard)'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <div className="text-slate-300 font-medium">Deposit: {bank.minDeposit}</div>
                        <div className="text-slate-400 text-[11px]">Fee: {bank.monthlyFee}</div>
                      </td>

                      {/* Affiliate Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenAffiliateModal(bank)}
                            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                              bank.affiliateEnabled && bank.affiliateUrl
                                ? 'bg-amber-950/70 text-amber-300 border border-amber-800 hover:bg-amber-900/60'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                            }`}
                            title="Configure Affiliate Destination"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            {bank.affiliateEnabled && bank.affiliateUrl ? 'Affiliate Partner' : 'Direct Link'}
                          </button>

                          <a
                            href={outbound.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700"
                            title={`Test destination: ${outbound.url}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(bank)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            bank.status === 'active'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900/60'
                          }`}
                          title={`Click to switch to ${bank.status === 'active' ? 'inactive' : 'active'}`}
                        >
                          {bank.status === 'active' ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-400" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-rose-400" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(bank)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                            title="Edit Bank Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(bank.id)}
                            className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50"
                            title="Delete Bank"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Quick Affiliate Configuration Modal */}
      {affiliateModalOpen && affiliateBank && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Affiliate Routing: {affiliateBank.name}</h3>
              </div>
              <button
                onClick={() => setAffiliateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Default Website URL
                </label>
                <input
                  type="text"
                  disabled
                  value={affiliateBank.websiteUrl}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-slate-400 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1">
                  Affiliate / Referral Destination URL
                </label>
                <input
                  type="url"
                  value={affiliateUrlInput}
                  onChange={(e) => setAffiliateUrlInput(e.target.value)}
                  placeholder="https://partner-network.com/click?offer_id=...&aff_id=crediqly"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Paste your full affiliate tracking or referral link here.
                </p>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-800/60 rounded-lg border border-slate-700">
                <div>
                  <div className="font-semibold text-white text-sm">Route Clicks to Affiliate Link</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    When enabled, customer outbound clicks redirect through your partner tracking link.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={affiliateEnabledInput}
                    onChange={(e) => setAffiliateEnabledInput(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold">Active Destination Preview: </span>
                <span className="text-amber-400 font-mono break-all">
                  {affiliateEnabledInput && affiliateUrlInput.trim()
                    ? affiliateUrlInput.trim()
                    : affiliateBank.websiteUrl}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAffiliateModalOpen(false)}
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAffiliate}
                disabled={saving}
                className="bg-brand-600 hover:bg-brand-700 text-white font-medium"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Bank Full Modal */}
      {editModalOpen && editingBank && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-bold text-white">
                  {editingBank.id ? `Edit Bank: ${editingBank.name}` : 'Add New Commercial Bank'}
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Bank Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBank.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                      setEditingBank((prev) => ({
                        ...prev!,
                        name,
                        slug: prev!.id ? prev!.slug : slug,
                      }));
                    }}
                    placeholder="e.g. Relay Financial"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Slug identifier <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBank.slug}
                    onChange={(e) => setEditingBank((prev) => ({ ...prev!, slug: e.target.value }))}
                    placeholder="relay-financial"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Short Description</label>
                <input
                  type="text"
                  value={editingBank.shortDescription || ''}
                  onChange={(e) => setEditingBank((prev) => ({ ...prev!, shortDescription: e.target.value }))}
                  placeholder="One-line summary for bank recommendation card"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Description</label>
                <textarea
                  rows={3}
                  value={editingBank.description}
                  onChange={(e) => setEditingBank((prev) => ({ ...prev!, description: e.target.value }))}
                  placeholder="Detailed explanation of features, sub-accounts, debit cards, and suitability..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Website URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={editingBank.websiteUrl}
                    onChange={(e) => setEditingBank((prev) => ({ ...prev!, websiteUrl: e.target.value }))}
                    placeholder="https://relayfi.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Affiliate / Partner URL</label>
                  <input
                    type="url"
                    value={editingBank.affiliateUrl || ''}
                    onChange={(e) => setEditingBank((prev) => ({ ...prev!, affiliateUrl: e.target.value }))}
                    placeholder="https://relayfi.com/?via=crediqly"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Recommended Stage</label>
                  <select
                    value={editingBank.recommendedStage}
                    onChange={(e) => setEditingBank((prev) => ({ ...prev!, recommendedStage: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
                  <select
                    value={editingBank.priority}
                    onChange={(e) => setEditingBank((prev) => ({ ...prev!, priority: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={1}>1 (High Priority)</option>
                    <option value={2}>2 (Standard)</option>
                    <option value={3}>3 (Low Priority)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Minimum Deposit</label>
                  <input
                    type="text"
                    value={editingBank.minDeposit}
                    onChange={(e) => setEditingBank((prev) => ({ ...prev!, minDeposit: e.target.value }))}
                    placeholder="$0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Monthly Fee</label>
                  <input
                    type="text"
                    value={editingBank.monthlyFee}
                    onChange={(e) => setEditingBank((prev) => ({ ...prev!, monthlyFee: e.target.value }))}
                    placeholder="$0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Features (One per line)
                </label>
                <textarea
                  rows={3}
                  value={editingBank.features.join('\n')}
                  onChange={(e) =>
                    setEditingBank((prev) => ({
                      ...prev!,
                      features: e.target.value
                        .split('\n')
                        .map((f) => f.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="No account fees&#10;Up to 20 checking accounts&#10;QuickBooks Online integration"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingBank.status === 'active'}
                    onChange={(e) =>
                      setEditingBank((prev) => ({
                        ...prev!,
                        status: e.target.checked ? 'active' : 'inactive',
                      }))
                    }
                    className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs font-medium text-slate-200">Active (Visible)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingBank.featured}
                    onChange={(e) =>
                      setEditingBank((prev) => ({
                        ...prev!,
                        featured: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs font-medium text-slate-200">Featured Card</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingBank.affiliateEnabled}
                    onChange={(e) =>
                      setEditingBank((prev) => ({
                        ...prev!,
                        affiliateEnabled: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs font-medium text-slate-200">Enable Affiliate Link</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  className="border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-medium"
                >
                  {saving ? 'Saving...' : editingBank.id ? 'Save Changes' : 'Create Bank'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-white">Delete Commercial Bank</h3>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to permanently delete this commercial bank from Crediqly? Customers will no longer see it recommended.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={saving}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                {saving ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
