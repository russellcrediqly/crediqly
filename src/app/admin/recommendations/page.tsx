'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  Check,
  Package,
  Landmark,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  X,
  Zap,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getAllProductsAdmin,
  updateProductAdmin,
} from '@/lib/supabase/productService';
import {
  getAllBanksAdmin,
  updateBankAdmin,
} from '@/lib/supabase/bankService';
import {
  getAllFundingProductsAdmin,
  updateFundingProduct,
} from '@/lib/supabase/fundingProductService';
import { logAdminAction } from '@/lib/supabase/adminAuditService';
import { Product, CATEGORY_LABELS } from '@/types/product';
import { Bank } from '@/types/bank';
import { FundingProduct } from '@/types/fundingProduct';

export interface CustomRecommendation {
  id: string;
  title: string;
  currentAssessment: string;
  whyThisMatters: string;
  category: 'credit_building' | 'banking' | 'compliance' | 'funding' | 'tradelines';
  priority: 'high' | 'recommended' | 'good';
  ctaText: string;
  destinationUrl: string;
  status: 'active' | 'inactive';
  order: number;
}

const DEFAULT_CUSTOM_RECOMMENDATIONS: CustomRecommendation[] = [
  {
    id: 'rec_tier1_tradelines',
    title: 'Establish Commercial Credit Depth with Tier 1 Tradelines',
    currentAssessment: 'Your profile has 2 active bureau tradelines. Adding 3 verified Net-30 vendor lines unlocks Tier 2 qualification.',
    whyThisMatters: 'Commercial credit underwriters require a minimum of 5 reporting payment experiences before granting uncollateralized card approvals.',
    category: 'tradelines',
    priority: 'high',
    ctaText: 'Open Tier 1 Tradelines Catalog',
    destinationUrl: '/products',
    status: 'active',
    order: 1,
  },
  {
    id: 'rec_bureau_registration',
    title: 'Verify SOS & D&B Commercial Registration Matching',
    currentAssessment: 'Secretary of State registration and commercial bureau naming have slight formatting differences.',
    whyThisMatters: 'Automated lending decision algorithms automatically flag or decline applications with unmatched entity punctuation.',
    category: 'compliance',
    priority: 'high',
    ctaText: 'Review Entity Compliance',
    destinationUrl: '/roadmap',
    status: 'active',
    order: 2,
  },
  {
    id: 'rec_commercial_banking',
    title: 'Maintain Consistent Operating Balances in Dedicated Bank Account',
    currentAssessment: 'Bank account connected. Maintaining average daily balance above $10,000 enhances revenue-based scoring.',
    whyThisMatters: 'Lenders analyze bank statement average daily balances to estimate repayment velocity and cash-flow buffer.',
    category: 'banking',
    priority: 'recommended',
    ctaText: 'Explore Partner Banks',
    destinationUrl: '/admin/banks',
    status: 'active',
    order: 3,
  },
];

const STAGES = [
  { id: 'foundation', label: 'Stage 1: Business Foundation' },
  { id: 'credit_foundation', label: 'Stage 2: Business Credit Foundation' },
  { id: 'building', label: 'Stage 3: Credit Building' },
  { id: 'optimization', label: 'Stage 4: Credit Optimization' },
  { id: 'funding', label: 'Stage 5: Funding Preparation' },
];

export default function AdminRecommendationsPage() {
  const [activeTab, setActiveTab] = useState<'actions' | 'products' | 'banks' | 'funding'>('actions');
  const [customRecs, setCustomRecs] = useState<CustomRecommendation[]>(DEFAULT_CUSTOM_RECOMMENDATIONS);
  const [products, setProducts] = useState<Product[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [fundingProducts, setFundingProducts] = useState<FundingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Rec Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<CustomRecommendation | null>(null);
  const [recTitle, setRecTitle] = useState('');
  const [recAssessment, setRecAssessment] = useState('');
  const [recWhyMatters, setRecWhyMatters] = useState('');
  const [recCategory, setRecCategory] = useState<any>('tradelines');
  const [recPriority, setRecPriority] = useState<any>('high');
  const [recCtaText, setRecCtaText] = useState('Take Action');
  const [recDestinationUrl, setRecDestinationUrl] = useState('/products');
  const [recStatus, setRecStatus] = useState<any>('active');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, bankList, fundingList] = await Promise.all([
        getAllProductsAdmin(),
        getAllBanksAdmin(),
        getAllFundingProductsAdmin(),
      ]);
      setProducts(prods);
      setBanks(bankList);
      setFundingProducts(fundingList);
    } catch (e) {
      console.error('Failed to load recommendation items:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateProduct = async (
    productId: string,
    field: 'recommendedStage' | 'priority' | 'featured' | 'status',
    value: any
  ) => {
    setSavingId(productId);
    try {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, [field]: value } : p))
      );

      await updateProductAdmin(productId, { [field]: value });
      showToast('Product recommendation setting updated.');
    } catch (err) {
      console.error('Failed to update product setting:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateBank = async (
    bankId: string,
    field: 'recommendedStage' | 'priority' | 'featured' | 'status',
    value: any
  ) => {
    setSavingId(bankId);
    try {
      setBanks((prev) =>
        prev.map((b) => (b.id === bankId ? { ...b, [field]: value } : b))
      );

      await updateBankAdmin(bankId, { [field]: value });
      showToast('Bank recommendation setting updated.');
    } catch (err) {
      console.error('Failed to update bank setting:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateFundingProduct = async (
    fundingId: string,
    field: 'priority' | 'featured' | 'status',
    value: any
  ) => {
    setSavingId(fundingId);
    try {
      setFundingProducts((prev) =>
        prev.map((f) => (f.id === fundingId ? { ...f, [field]: value } : f))
      );

      await updateFundingProduct(fundingId, { [field]: value });
      showToast('Funding option recommendation setting updated.');
    } catch (err) {
      console.error('Failed to update funding product setting:', err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-emerald-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Recommendation Controls
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">Rule-based scoring & priorities</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Recommendation Matrix & Stage Mappings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Control which roadmap stage products and banks appear in, priority boost weights, and customer visibility.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* How It Works Explanation */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-semibold text-white block">
                Deterministic Recommendation Weights
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Items marked <strong>Priority 1</strong> receive a +15 point ranking boost; <strong>Priority 2</strong> has a neutral weight; <strong>Priority 3</strong> receives a -15 point penalty. Items marked <strong>Featured</strong> gain an additional +5 point badge bonus. <strong>Inactive</strong> items are strictly filtered out and never recommended.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'actions'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Action Guidance ({customRecs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'products'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Credit Products ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'banks'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Commercial Banks ({banks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('funding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'funding'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Funding Options ({fundingProducts.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <LoadingState message="Loading recommendation controls..." className="text-white" />
        </div>
      ) : activeTab === 'actions' ? (
        /* Action Guidance Management */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Manage Center-of-View <strong>&ldquo;What Should I Do Next?&rdquo;</strong> dynamically prioritized actions displayed on the customer command center.
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingRec(null);
                setRecTitle('');
                setRecAssessment('');
                setRecWhyMatters('');
                setRecCategory('tradelines');
                setRecPriority('high');
                setRecCtaText('Take Action');
                setRecDestinationUrl('/products');
                setRecStatus('active');
                setModalOpen(true);
              }}
              className="text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Action Guidance
            </Button>
          </div>

          <div className="grid gap-3">
            {customRecs.map((rec) => (
              <Card key={rec.id} className="bg-slate-950 border-slate-800">
                <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                        #{rec.order}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          rec.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : rec.priority === 'recommended'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {rec.priority === 'high' ? '🔴 High Priority' : rec.priority === 'recommended' ? '🟡 Recommended' : '🟢 Good / On Track'}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {rec.category}
                      </span>
                      {rec.status === 'inactive' && (
                        <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                          Disabled
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-white tracking-tight">{rec.title}</h3>

                    <div className="space-y-1 text-xs text-slate-300">
                      <p><strong className="text-slate-400">Assessment:</strong> {rec.currentAssessment}</p>
                      <p><strong className="text-slate-400">Why It Matters:</strong> {rec.whyThisMatters}</p>
                    </div>

                    <div className="text-[11px] text-brand-400 pt-1">
                      CTA: {rec.ctaText} &rarr; {rec.destinationUrl}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newStatus = rec.status === 'active' ? 'inactive' : 'active';
                        setCustomRecs((prev) =>
                          prev.map((r) => (r.id === rec.id ? { ...r, status: newStatus } : r))
                        );
                        showToast(`Recommendation "${rec.title}" is now ${newStatus}.`);
                      }}
                      className="text-xs text-slate-300 border-slate-700 hover:bg-slate-850"
                    >
                      {rec.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingRec(rec);
                        setRecTitle(rec.title);
                        setRecAssessment(rec.currentAssessment);
                        setRecWhyMatters(rec.whyThisMatters);
                        setRecCategory(rec.category);
                        setRecPriority(rec.priority);
                        setRecCtaText(rec.ctaText);
                        setRecDestinationUrl(rec.destinationUrl);
                        setRecStatus(rec.status);
                        setModalOpen(true);
                      }}
                      className="text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Rec Modal */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl my-8">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white">
                    {editingRec ? 'Edit Action Guidance' : 'Create Action Guidance'}
                  </h3>
                  <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Recommendation Title</label>
                    <input
                      type="text"
                      value={recTitle}
                      onChange={(e) => setRecTitle(e.target.value)}
                      placeholder="e.g. Establish Commercial Credit Depth..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Current Assessment Diagnostic</label>
                    <textarea
                      rows={2}
                      value={recAssessment}
                      onChange={(e) => setRecAssessment(e.target.value)}
                      placeholder="What is the current profile state..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Why This Matters</label>
                    <textarea
                      rows={2}
                      value={recWhyMatters}
                      onChange={(e) => setRecWhyMatters(e.target.value)}
                      placeholder="Underwriting impact..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Priority</label>
                      <select
                        value={recPriority}
                        onChange={(e) => setRecPriority(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="high">🔴 High Priority</option>
                        <option value="recommended">🟡 Recommended</option>
                        <option value="good">🟢 Good / On Track</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Category</label>
                      <select
                        value={recCategory}
                        onChange={(e) => setRecCategory(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="tradelines">Tradelines & Net-30</option>
                        <option value="compliance">Entity & Compliance</option>
                        <option value="banking">Commercial Banking</option>
                        <option value="funding">Funding Opportunities</option>
                        <option value="credit_building">Credit Building</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">CTA Button Label</label>
                      <input
                        type="text"
                        value={recCtaText}
                        onChange={(e) => setRecCtaText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Destination URL</label>
                      <input
                        type="text"
                        value={recDestinationUrl}
                        onChange={(e) => setRecDestinationUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModalOpen(false)}
                      className="text-xs text-slate-300 border-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (!recTitle.trim()) return;
                        if (editingRec) {
                          setCustomRecs((prev) =>
                            prev.map((r) =>
                              r.id === editingRec.id
                                ? {
                                    ...r,
                                    title: recTitle,
                                    currentAssessment: recAssessment,
                                    whyThisMatters: recWhyMatters,
                                    priority: recPriority,
                                    category: recCategory,
                                    ctaText: recCtaText,
                                    destinationUrl: recDestinationUrl,
                                    status: recStatus,
                                  }
                                : r
                            )
                          );
                          showToast('Action recommendation updated.');
                        } else {
                          const newRec: CustomRecommendation = {
                            id: `rec_${Date.now()}`,
                            title: recTitle,
                            currentAssessment: recAssessment,
                            whyThisMatters: recWhyMatters,
                            priority: recPriority,
                            category: recCategory,
                            ctaText: recCtaText,
                            destinationUrl: recDestinationUrl,
                            status: recStatus,
                            order: customRecs.length + 1,
                          };
                          setCustomRecs((prev) => [...prev, newRec]);
                          showToast('New action recommendation created.');
                        }
                        setModalOpen(false);
                      }}
                      className="text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white"
                    >
                      Save Recommendation
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'products' ? (
        /* Products Table */
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Recommended Stage</th>
                  <th className="py-3.5 px-4">Priority Weight</th>
                  <th className="py-3.5 px-4">Featured Boost</th>
                  <th className="py-3.5 px-4">Marketplace Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Product Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{p.name}</span>
                        {savingId === p.id && (
                          <RefreshCw className="w-3 h-3 text-brand-400 animate-spin" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">{p.slug}</span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <Badge variant="neutral" className="text-[10px]">
                        {CATEGORY_LABELS[p.category] || p.category}
                      </Badge>
                    </td>

                    {/* Recommended Stage */}
                    <td className="py-3.5 px-4">
                      <select
                        value={p.recommendedStage}
                        onChange={(e) =>
                          handleUpdateProduct(p.id, 'recommendedStage', e.target.value)
                        }
                        className="bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-brand-500"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <select
                        value={p.priority || 2}
                        onChange={(e) =>
                          handleUpdateProduct(p.id, 'priority', Number(e.target.value))
                        }
                        className={`border rounded-xl text-xs px-3 py-1.5 font-bold focus:outline-none focus:border-brand-500 ${
                          (p.priority || 2) === 1
                            ? 'bg-brand-950/60 border-brand-500/50 text-brand-300'
                            : (p.priority || 2) === 3
                            ? 'bg-slate-900 border-slate-800 text-slate-400'
                            : 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      >
                        <option value={1}>1 - High Priority (+15 pts)</option>
                        <option value={2}>2 - Standard (0 pts)</option>
                        <option value={3}>3 - Deprioritized (-15 pts)</option>
                      </select>
                    </td>

                    {/* Featured */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleUpdateProduct(p.id, 'featured', !p.featured)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          p.featured
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{p.featured ? 'Featured (+5 pts)' : 'Standard'}</span>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() =>
                          handleUpdateProduct(
                            p.id,
                            'status',
                            p.status === 'active' ? 'inactive' : 'active'
                          )
                        }
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors inline-flex items-center gap-1.5 ${
                          p.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        <span className="capitalize">{p.status}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'banks' ? (
        /* Banks Table */
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Bank Name</th>
                  <th className="py-3.5 px-4">Type & Pricing</th>
                  <th className="py-3.5 px-4">Recommended Stage</th>
                  <th className="py-3.5 px-4">Priority Weight</th>
                  <th className="py-3.5 px-4">Featured Boost</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {banks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Bank Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{b.name}</span>
                        {savingId === b.id && (
                          <RefreshCw className="w-3 h-3 text-brand-400 animate-spin" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">{b.slug}</span>
                    </td>

                    {/* Pricing */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-medium">Deposit: {b.minDeposit}</div>
                      <div className="text-slate-400 text-[11px]">Fee: {b.monthlyFee}</div>
                    </td>

                    {/* Recommended Stage */}
                    <td className="py-3.5 px-4">
                      <select
                        value={b.recommendedStage}
                        onChange={(e) =>
                          handleUpdateBank(b.id, 'recommendedStage', e.target.value)
                        }
                        className="bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-brand-500"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <select
                        value={b.priority || 2}
                        onChange={(e) =>
                          handleUpdateBank(b.id, 'priority', Number(e.target.value))
                        }
                        className={`border rounded-xl text-xs px-3 py-1.5 font-bold focus:outline-none focus:border-brand-500 ${
                          (b.priority || 2) === 1
                            ? 'bg-brand-950/60 border-brand-500/50 text-brand-300'
                            : (b.priority || 2) === 3
                            ? 'bg-slate-900 border-slate-800 text-slate-400'
                            : 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      >
                        <option value={1}>1 - High Priority (+15 pts)</option>
                        <option value={2}>2 - Standard (0 pts)</option>
                        <option value={3}>3 - Deprioritized (-15 pts)</option>
                      </select>
                    </td>

                    {/* Featured */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleUpdateBank(b.id, 'featured', !b.featured)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          b.featured
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{b.featured ? 'Featured (+5 pts)' : 'Standard'}</span>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() =>
                          handleUpdateBank(
                            b.id,
                            'status',
                            b.status === 'active' ? 'inactive' : 'active'
                          )
                        }
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors inline-flex items-center gap-1.5 ${
                          b.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        <span className="capitalize">{b.status}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Funding Options Table */
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Funding Option & Provider</th>
                  <th className="py-3.5 px-4">Category & Amount</th>
                  <th className="py-3.5 px-4">Min Requirements</th>
                  <th className="py-3.5 px-4">Priority Weight</th>
                  <th className="py-3.5 px-4">Featured Boost</th>
                  <th className="py-3.5 px-4">Customer Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {fundingProducts.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Option & Provider */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{f.name}</div>
                      <div className="text-slate-400 text-[11px]">Provider: {f.provider}</div>
                    </td>

                    {/* Category & Amount */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{f.category}</div>
                      <div className="text-slate-400 text-[11px]">
                        ${f.minFundingAmount?.toLocaleString()} - ${f.maxFundingAmount?.toLocaleString()}
                      </div>
                    </td>

                    {/* Requirements */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      <div>Rev: {f.minAnnualRevenue}</div>
                      <div>Credit: {f.minPersonalCredit}</div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <select
                        value={f.priority || 2}
                        onChange={(e) =>
                          handleUpdateFundingProduct(f.id, 'priority', Number(e.target.value))
                        }
                        className={`border rounded-xl text-xs px-3 py-1.5 font-bold focus:outline-none focus:border-brand-500 ${
                          (f.priority || 2) === 1
                            ? 'bg-brand-950/60 border-brand-500/50 text-brand-300'
                            : (f.priority || 2) === 3
                            ? 'bg-slate-900 border-slate-800 text-slate-400'
                            : 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      >
                        <option value={1}>1 - High Priority (+15 pts)</option>
                        <option value={2}>2 - Standard (0 pts)</option>
                        <option value={3}>3 - Deprioritized (-15 pts)</option>
                      </select>
                    </td>

                    {/* Featured */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleUpdateFundingProduct(f.id, 'featured', !f.featured)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          f.featured
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{f.featured ? 'Featured (+5 pts)' : 'Standard'}</span>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() =>
                          handleUpdateFundingProduct(
                            f.id,
                            'status',
                            f.status === 'active' ? 'inactive' : 'active'
                          )
                        }
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors inline-flex items-center gap-1.5 ${
                          f.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            f.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        <span className="capitalize">{f.status}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
