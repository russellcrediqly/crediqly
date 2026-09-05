'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Link as LinkIcon,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  MousePointerClick,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Tag,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getAffiliatesAdmin,
  createAffiliateAdmin,
  updateAffiliateAdmin,
  deleteAffiliateAdmin,
  AffiliatePartner,
  AffiliateCategory,
  AffiliateDisplayLocation,
} from '@/lib/supabase/affiliateService';
import { logAdminAction } from '@/lib/supabase/adminAuditService';

const CATEGORY_OPTIONS: { id: AffiliateCategory; label: string }[] = [
  { id: 'tradeline', label: 'Vendor Tradeline' },
  { id: 'banking', label: 'Commercial Banking' },
  { id: 'funding', label: 'Lending & Capital' },
  { id: 'monitoring', label: 'Credit Monitoring' },
  { id: 'credit_repair', label: 'Compliance & Entity' },
  { id: 'legal', label: 'Legal & Accounting' },
  { id: 'general', label: 'General Business' },
];

const LOCATION_OPTIONS: { id: AffiliateDisplayLocation; label: string }[] = [
  { id: 'dashboard_banner', label: 'Dashboard Banner' },
  { id: 'products_directory', label: 'Products Directory' },
  { id: 'funding_matches', label: 'Funding Matches' },
  { id: 'roadmap_tool', label: 'Roadmap Guidance' },
  { id: 'sidebar', label: 'Sidebar Placement' },
];

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AffiliatePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<AffiliatePartner | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [category, setCategory] = useState<AffiliateCategory>('tradeline');
  const [displayLocation, setDisplayLocation] = useState<AffiliateDisplayLocation>('dashboard_banner');
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [featured, setFeatured] = useState(false);
  const [ctaText, setCtaText] = useState('Learn More & Apply');
  const [notes, setNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAffiliates = useCallback(async () => {
    try {
      const data = await getAffiliatesAdmin();
      setAffiliates(data);
    } catch (err) {
      console.error('Failed to load affiliate partners:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAffiliates();
  }, [loadAffiliates]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAffiliates();
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAffiliate(null);
    setName('');
    setDescription('');
    setAffiliateUrl('');
    setTrackingUrl('');
    setLogoUrl('');
    setCategory('tradeline');
    setDisplayLocation('dashboard_banner');
    setPriority(1);
    setStatus('active');
    setFeatured(false);
    setCtaText('Learn More & Apply');
    setNotes('');
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (partner: AffiliatePartner) => {
    setEditingAffiliate(partner);
    setName(partner.name);
    setDescription(partner.description);
    setAffiliateUrl(partner.affiliateUrl);
    setTrackingUrl(partner.trackingUrl || '');
    setLogoUrl(partner.logoUrl || '');
    setCategory(partner.category);
    setDisplayLocation(partner.displayLocation);
    setPriority(partner.priority);
    setStatus(partner.status);
    setFeatured(partner.featured);
    setCtaText(partner.ctaText);
    setNotes(partner.notes || '');
    setModalOpen(true);
  };

  // Save Partner (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !affiliateUrl.trim()) {
      showToast('Error: Name and Affiliate Destination URL are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        affiliateUrl: affiliateUrl.trim(),
        trackingUrl: trackingUrl.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        category,
        displayLocation,
        priority: Number(priority),
        status,
        featured,
        ctaText: ctaText.trim() || 'Learn More',
        notes: notes.trim() || undefined,
      };

      if (editingAffiliate) {
        await updateAffiliateAdmin(editingAffiliate.id, payload);
        await logAdminAction({
          adminEmail: 'crediqly@gmail.com',
          action: 'UPDATE_AFFILIATE',
          entityType: 'affiliate',
          entityId: editingAffiliate.id,
          entityName: payload.name,
          description: `Updated affiliate partner "${payload.name}" (${payload.category})`,
          previousValue: { name: editingAffiliate.name, status: editingAffiliate.status },
          newValue: payload,
        });
        showToast(`Affiliate "${payload.name}" successfully updated.`);
      } else {
        const created = await createAffiliateAdmin(payload);
        await logAdminAction({
          adminEmail: 'crediqly@gmail.com',
          action: 'CREATE_AFFILIATE',
          entityType: 'affiliate',
          entityId: created.id,
          entityName: created.name,
          description: `Created new affiliate partner "${created.name}"`,
          newValue: payload,
        });
        showToast(`New affiliate partner "${payload.name}" created.`);
      }

      setModalOpen(false);
      await loadAffiliates();
    } catch (err) {
      console.error('Failed to save affiliate:', err);
      showToast('Error saving affiliate partner.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (partner: AffiliatePartner) => {
    const newStatus = partner.status === 'active' ? 'inactive' : 'active';
    try {
      await updateAffiliateAdmin(partner.id, { status: newStatus });
      await logAdminAction({
        adminEmail: 'crediqly@gmail.com',
        action: 'UPDATE_AFFILIATE',
        entityType: 'affiliate',
        entityId: partner.id,
        entityName: partner.name,
        description: `Toggled affiliate partner "${partner.name}" status to ${newStatus}`,
        previousValue: { status: partner.status },
        newValue: { status: newStatus },
      });
      setAffiliates((prev) =>
        prev.map((a) => (a.id === partner.id ? { ...a, status: newStatus } : a))
      );
      showToast(`Partner "${partner.name}" is now ${newStatus}.`);
    } catch (err) {
      showToast('Failed to update status.');
    }
  };

  // Delete Partner
  const handleDelete = async (id: string) => {
    const partner = affiliates.find((a) => a.id === id);
    try {
      await deleteAffiliateAdmin(id);
      if (partner) {
        await logAdminAction({
          adminEmail: 'crediqly@gmail.com',
          action: 'DELETE_AFFILIATE',
          entityType: 'affiliate',
          entityId: id,
          entityName: partner.name,
          description: `Deleted affiliate partner "${partner.name}"`,
        });
      }
      setDeleteConfirmId(null);
      showToast('Affiliate partner removed.');
      await loadAffiliates();
    } catch (err) {
      showToast('Failed to delete affiliate partner.');
    }
  };

  // Filtered list
  const filteredAffiliates = useMemo(() => {
    return affiliates.filter((a) => {
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (locationFilter !== 'all' && a.displayLocation !== locationFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = a.name.toLowerCase().includes(q);
        const matchDesc = a.description.toLowerCase().includes(q);
        const matchNotes = a.notes ? a.notes.toLowerCase().includes(q) : false;
        const matchUrl = a.affiliateUrl.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchNotes && !matchUrl) return false;
      }
      return true;
    });
  }, [affiliates, search, categoryFilter, locationFilter, statusFilter]);

  // Metrics
  const activeCount = affiliates.filter((a) => a.status === 'active').length;
  const featuredCount = affiliates.filter((a) => a.featured).length;
  const totalClicks = affiliates.reduce((sum, a) => sum + (a.clicksCount || 0), 0);

  if (loading) {
    return <LoadingState message="Loading Affiliate Control Center..." className="text-white min-h-[400px]" />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-950 border border-brand-500/50 text-white shadow-2xl flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-brand-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Affiliate Management Center
            </h1>
            <Badge variant="info" className="text-[11px] font-bold">
              Control Hub
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Manage commercial affiliate partners, tracking parameters, display placements across the client dashboard, and click-through performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs font-bold text-slate-300 border-slate-700 hover:bg-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="text-xs font-black bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Affiliate Partner
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
              Total Partners
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {affiliates.length}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">Configured commercial accounts</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
              Active In Dashboard
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {activeCount}
            </div>
            <span className="text-[11px] text-emerald-300/80 block mt-1">Currently displaying to users</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
              Featured Partners
            </span>
            <div className="text-2xl sm:text-3xl font-black text-brand-400 mt-1">
              {featuredCount}
            </div>
            <span className="text-[11px] text-brand-300/80 block mt-1">Priority spotlight display</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
              Tracked Click Volume
            </span>
            <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-1">
              {totalClicks}
            </div>
            <span className="text-[11px] text-sky-300/80 block mt-1">Verified outbound referrals</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search partner, description, URL..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Categories</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Placements</option>
                {LOCATION_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Statuses ({affiliates.length})</option>
                <option value="active">Active Only ({activeCount})</option>
                <option value="inactive">Inactive Only ({affiliates.length - activeCount})</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Showing <strong>{filteredAffiliates.length}</strong> of <strong>{affiliates.length}</strong> partners
            </span>
            {(search || categoryFilter !== 'all' || locationFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
                  setLocationFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs text-brand-400 hover:text-brand-300 underline font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Affiliates Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 w-1/3">Partner / Program</th>
                <th className="py-3.5 px-4">Placement &amp; Category</th>
                <th className="py-3.5 px-4 text-center">Priority</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Clicks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAffiliates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-300">No affiliate partners found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search or add a new affiliate partner.</p>
                  </td>
                </tr>
              ) : (
                filteredAffiliates.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-400 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                          {partner.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{partner.name}</span>
                            {partner.featured && (
                              <Badge variant="warning" className="text-[10px] font-black uppercase">
                                ⭐ Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {partner.description}
                          </p>
                          <a
                            href={partner.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 mt-1 truncate max-w-sm"
                          >
                            <LinkIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate">{partner.affiliateUrl}</span>
                            <ArrowUpRight className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                          {CATEGORY_OPTIONS.find((c) => c.id === partner.category)?.label || partner.category}
                        </span>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {LOCATION_OPTIONS.find((l) => l.id === partner.displayLocation)?.label || partner.displayLocation}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] ${partner.priority === 1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black' : 'bg-slate-800 text-slate-300'}`}>
                        P{partner.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(partner)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-all border ${
                          partner.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${partner.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span>{partner.status === 'active' ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-400">
                      <div className="flex items-center justify-center gap-1">
                        <MousePointerClick className="w-3.5 h-3.5 text-slate-500" />
                        <span>{partner.clicksCount || 0}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(partner)}
                          className="text-xs text-slate-300 hover:text-white p-1.5"
                          aria-label="Edit partner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(partner.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 p-1.5"
                          aria-label="Delete partner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingAffiliate ? 'Edit Affiliate Partner' : 'Add New Affiliate Partner'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure partner details, referral tracking, and dashboard display placement.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Partner Program Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nav Prime Business Credit"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Description / Benefit Summary</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain why this partner benefit matters to a business founder..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Destination Affiliate URL *</label>
                  <input
                    type="url"
                    required
                    value={affiliateUrl}
                    onChange={(e) => setAffiliateUrl(e.target.value)}
                    placeholder="https://partner.com/signup?ref=crediqly"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Internal Tracking URL (Optional)</label>
                  <input
                    type="text"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://crediqly.com/out/partner-name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Placement & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Display Placement *</label>
                  <select
                    value={displayLocation}
                    onChange={(e) => setDisplayLocation(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    {LOCATION_OPTIONS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Button CTA Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="e.g. Apply for Net-30 Terms"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Priority, Status, Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  >
                    <option value={1}>P1 — Highest Priority</option>
                    <option value={2}>P2 — Standard Priority</option>
                    <option value={3}>P3 — Secondary</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="featured-toggle"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="featured-toggle" className="font-bold text-slate-300 cursor-pointer">
                    Featured Spotlight
                  </label>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Internal Admin Notes (Underwriting, commission rules, etc.)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Reports to D&B only. Requires $100 initial order for tradeline creation."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="text-xs text-slate-300 border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  className="text-xs font-black bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
                >
                  {saving ? 'Saving...' : editingAffiliate ? 'Update Partner' : 'Create Partner'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-white">Delete Affiliate Partner?</h3>
            </div>
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete this affiliate partner? Outbound links will no longer resolve from the customer portal.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs text-slate-300 border-slate-700"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
