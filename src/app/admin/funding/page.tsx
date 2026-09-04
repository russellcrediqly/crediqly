'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DollarSign,
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
  Briefcase,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getAllFundingProductsAdmin,
  createFundingProduct,
  updateFundingProduct,
  deleteFundingProduct,
  toggleFundingProductStatus,
  resolveFundingProductOutboundUrl,
} from '@/lib/supabase/fundingProductService';
import {
  FundingProduct,
  FundingProductStatus,
  FundingCategory,
  BusinessCreditRequiredOption,
} from '@/types/fundingProduct';

const FUNDING_CATEGORIES: FundingCategory[] = [
  'Business Line of Credit',
  'Term Loan',
  'Equipment Financing',
  'Working Capital',
  'SBA-related Financing',
  'Business Credit Card',
  'Vehicle Financing',
  'Revenue-based Financing',
  'Other',
];

const PURPOSE_OPTIONS = [
  'Working Capital',
  'Equipment',
  'Expansion',
  'Inventory',
  'Payroll',
  'Marketing',
  'Vehicle',
  'Debt Refinancing',
  'Business Acquisition',
  'Other',
];

const REVENUE_OPTIONS = [
  '$0',
  '$25,000',
  '$50,000',
  '$100,000',
  '$250,000+',
];

const CREDIT_OPTIONS = [
  'None',
  '600+',
  '625+',
  '650+',
  '680+',
  '700+',
];

const AGE_OPTIONS = [
  { label: 'No minimum', value: 0 },
  { label: '3 months', value: 3 },
  { label: '6 months', value: 6 },
  { label: '12 months (1 year)', value: 12 },
  { label: '24 months (2 years)', value: 24 },
];

export default function AdminFundingPage() {
  const [products, setProducts] = useState<FundingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FundingProduct | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    category: 'Business Line of Credit' as FundingCategory,
    description: '',
    websiteUrl: '',
    affiliateUrl: '',
    affiliateEnabled: false,
    status: 'active' as FundingProductStatus,
    featured: false,
    priority: 2,
    minBusinessAgeMonths: 6,
    minAnnualRevenue: '$50,000',
    minPersonalCredit: 'None',
    businessCreditRequired: 'not_specified' as BusinessCreditRequiredOption,
    minFundingAmount: 5000,
    maxFundingAmount: 150000,
    fundingPurposes: ['Working Capital'] as string[],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllFundingProductsAdmin();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load funding products:', err);
      showToast('Failed to load funding products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedPriority !== 'all' && p.priority !== Number(selectedPriority)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchProvider = p.provider.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        if (!matchName && !matchProvider && !matchDesc) return false;
      }
      return true;
    });
  }, [products, selectedStatus, selectedCategory, selectedPriority, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      provider: '',
      category: 'Business Line of Credit',
      description: '',
      websiteUrl: '',
      affiliateUrl: '',
      affiliateEnabled: false,
      status: 'active',
      featured: false,
      priority: 2,
      minBusinessAgeMonths: 6,
      minAnnualRevenue: '$50,000',
      minPersonalCredit: 'None',
      businessCreditRequired: 'not_specified',
      minFundingAmount: 5000,
      maxFundingAmount: 150000,
      fundingPurposes: ['Working Capital'],
    });
    setEditModalOpen(true);
  };

  const handleOpenEditModal = (product: FundingProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      provider: product.provider,
      category: product.category,
      description: product.description,
      websiteUrl: product.websiteUrl,
      affiliateUrl: product.affiliateUrl || '',
      affiliateEnabled: product.affiliateEnabled,
      status: product.status,
      featured: product.featured,
      priority: product.priority,
      minBusinessAgeMonths: product.minBusinessAgeMonths,
      minAnnualRevenue: product.minAnnualRevenue,
      minPersonalCredit: product.minPersonalCredit,
      businessCreditRequired: product.businessCreditRequired,
      minFundingAmount: product.minFundingAmount || 0,
      maxFundingAmount: product.maxFundingAmount || 0,
      fundingPurposes: product.fundingPurposes || [],
    });
    setEditModalOpen(true);
  };

  const handleToggleStatus = async (product: FundingProduct) => {
    const newStatus: FundingProductStatus =
      product.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await toggleFundingProductStatus(product.id, newStatus);
      if (updated) {
        setProducts((prev) =>
          prev.map((item) => (item.id === product.id ? updated : item))
        );
        showToast(
          `${product.name} is now ${newStatus === 'active' ? 'ACTIVE (visible to customers)' : 'INACTIVE (hidden from customers)'}`
        );
      }
    } catch (err) {
      showToast('Failed to update status');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.provider.trim() || !formData.websiteUrl.trim()) {
      showToast('Please fill in Name, Provider, and Website URL');
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        // Update
        const updated = await updateFundingProduct(editingProduct.id, formData);
        if (updated) {
          setProducts((prev) =>
            prev.map((item) => (item.id === editingProduct.id ? updated : item))
          );
          showToast(`Updated "${formData.name}" successfully`);
        }
      } else {
        // Create
        const created = await createFundingProduct(formData);
        setProducts((prev) => [created, ...prev]);
        showToast(`Created "${formData.name}" successfully`);
      }
      setEditModalOpen(false);
    } catch (err) {
      showToast('Error saving funding product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const ok = await deleteFundingProduct(id);
      if (ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast('Funding option permanently deleted');
      }
    } catch (err) {
      showToast('Failed to delete funding option');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handlePurposeToggle = (purpose: string) => {
    setFormData((prev) => {
      const current = prev.fundingPurposes || [];
      if (current.includes(purpose)) {
        return { ...prev, fundingPurposes: current.filter((p) => p !== purpose) };
      } else {
        return { ...prev, fundingPurposes: [...current, purpose] };
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
              Admin Console
            </span>
            <span className="text-xs text-slate-400">Real-time Recommendation Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-emerald-500" />
            <span>Funding Options Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Control which commercial funding options Crediqly recommends to customers without editing code.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadProducts}
            className="text-xs gap-1.5 border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Funding Option</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Options</span>
            <p className="text-2xl font-black text-white">{products.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active for Customers</span>
            <p className="text-2xl font-black text-emerald-400">
              {products.filter((p) => p.status === 'active').length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Affiliate Enabled</span>
            <p className="text-2xl font-black text-brand-400">
              {products.filter((p) => p.affiliateEnabled && p.affiliateUrl).length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Featured</span>
            <p className="text-2xl font-black text-amber-400">
              {products.filter((p) => p.featured).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, provider, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              {FUNDING_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Priorities</option>
              <option value="1">Priority 1 (High)</option>
              <option value="2">Priority 2 (Normal)</option>
              <option value="3">Priority 3 (Low)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Directory Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Funding Option & Provider</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Affiliate Routing</th>
                <th className="py-3 px-4">Requirements Summary</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <LoadingState message="Loading funding options catalog..." />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No funding options found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isAffiliateActive =
                    product.affiliateEnabled &&
                    Boolean(product.affiliateUrl && product.affiliateUrl.trim().length > 0);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Provider */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold text-xs mt-0.5">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs">
                                {product.name}
                              </span>
                              {product.featured && (
                                <span className="inline-flex items-center text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-1.5 py-0.2 rounded">
                                  ★ Featured
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {product.provider}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {product.category}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className="flex items-center gap-1.5 cursor-pointer group focus:outline-none"
                          title="Click to toggle active/inactive"
                        >
                          {product.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full group-hover:border-emerald-600 transition-colors">
                              <Eye className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full group-hover:border-slate-600 transition-colors">
                              <EyeOff className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            product.priority === 1
                              ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800'
                              : product.priority === 2
                              ? 'text-blue-400 bg-blue-950/60 border border-blue-800'
                              : 'text-slate-400 bg-slate-800 border border-slate-700'
                          }`}
                        >
                          P{product.priority} ({product.priority === 1 ? 'High' : product.priority === 2 ? 'Normal' : 'Low'})
                        </span>
                      </td>

                      {/* Affiliate Routing */}
                      <td className="py-3.5 px-4">
                        {isAffiliateActive ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-300 bg-brand-950/80 border border-brand-800 px-2 py-0.5 rounded-full">
                              <LinkIcon className="w-3 h-3 text-brand-400" />
                              Affiliate Active
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                              {product.affiliateUrl}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-800/60 border border-slate-800 px-2 py-0.5 rounded-full">
                            Direct Web Only
                          </span>
                        )}
                      </td>

                      {/* Requirements */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-400 space-y-0.5">
                        <p>
                          <span className="text-slate-500">Age:</span>{' '}
                          {product.minBusinessAgeMonths > 0
                            ? `${product.minBusinessAgeMonths}+ mos`
                            : 'None'}
                        </p>
                        <p>
                          <span className="text-slate-500">Rev:</span>{' '}
                          {product.minAnnualRevenue !== '$0' ? product.minAnnualRevenue : 'None'}
                        </p>
                        <p>
                          <span className="text-slate-500">Credit:</span>{' '}
                          {product.minPersonalCredit !== 'None' ? product.minPersonalCredit : 'None'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit funding option"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(product.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Delete option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={resolveFundingProductOutboundUrl(product)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Test destination link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ADD / EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Funding Option'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Changes update customer recommendations and outbound links immediately.
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Row 1: Name & Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Funding Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Revolving Business Line of Credit"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Provider / Lender *</label>
                  <input
                    type="text"
                    required
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="e.g. Fundbox"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Row 2: Category, Priority, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as FundingCategory })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {FUNDING_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={1}>Priority 1 (High)</option>
                    <option value={2}>Priority 2 (Standard)</option>
                    <option value={3}>Priority 3 (Secondary)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Customer Visibility</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as FundingProductStatus })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Customer-Facing Description *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short explanation of terms, structure, and use case..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* URLs & Affiliate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Website URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://provider.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Affiliate Referral URL</label>
                  <input
                    type="url"
                    value={formData.affiliateUrl}
                    onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
                    placeholder="https://provider.com/partner/crediqly"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Toggles: Affiliate Enabled & Featured */}
              <div className="flex flex-wrap items-center gap-6 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.affiliateEnabled}
                    onChange={(e) => setFormData({ ...formData, affiliateEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-300 font-medium">Route clicks via Affiliate URL</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-300 font-medium">Mark as Featured ★</span>
                </label>
              </div>

              {/* BASIC REQUIREMENTS / MATCHING RULES */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                    Basic Matching Rules (Deterministic Engine)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  These criteria determine Strong Match / Potential Match / Explore ranking without automated underwriting.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Min Business Age</label>
                    <select
                      value={formData.minBusinessAgeMonths}
                      onChange={(e) => setFormData({ ...formData, minBusinessAgeMonths: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      {AGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Min Annual Revenue</label>
                    <select
                      value={formData.minAnnualRevenue}
                      onChange={(e) => setFormData({ ...formData, minAnnualRevenue: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      {REVENUE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Min Personal Credit</label>
                    <select
                      value={formData.minPersonalCredit}
                      onChange={(e) => setFormData({ ...formData, minPersonalCredit: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      {CREDIT_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Business Credit Required</label>
                    <select
                      value={formData.businessCreditRequired}
                      onChange={(e) => setFormData({ ...formData, businessCreditRequired: e.target.value as BusinessCreditRequiredOption })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      <option value="not_specified">Not Specified</option>
                      <option value="yes">Yes (Must be established)</option>
                      <option value="no">No (Not required)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Min Amount ($)</label>
                    <input
                      type="number"
                      value={formData.minFundingAmount}
                      onChange={(e) => setFormData({ ...formData, minFundingAmount: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Max Amount ($)</label>
                    <input
                      type="number"
                      value={formData.maxFundingAmount}
                      onChange={(e) => setFormData({ ...formData, maxFundingAmount: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                {/* Funding Purposes Checkboxes */}
                <div className="pt-2">
                  <label className="block text-slate-400 font-medium mb-1.5">
                    Funding Purposes / Intended Uses:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PURPOSE_OPTIONS.map((p) => {
                      const isChecked = (formData.fundingPurposes || []).includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePurposeToggle(p)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                            isChecked
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {isChecked ? `✓ ${p}` : p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingProduct ? 'Save Changes' : 'Create Funding Option'}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Delete Funding Option?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete this funding option? To temporarily hide it from customers without deleting, use the <strong>Disable</strong> toggle instead.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-500 text-white text-xs"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
