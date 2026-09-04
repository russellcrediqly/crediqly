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
import { Product, CATEGORY_LABELS } from '@/types/product';
import { Bank } from '@/types/bank';
import { FundingProduct } from '@/types/fundingProduct';

const STAGES = [
  { id: 'foundation', label: 'Stage 1: Business Foundation' },
  { id: 'credit_foundation', label: 'Stage 2: Business Credit Foundation' },
  { id: 'building', label: 'Stage 3: Credit Building' },
  { id: 'optimization', label: 'Stage 4: Credit Optimization' },
  { id: 'funding', label: 'Stage 5: Funding Preparation' },
];

export default function AdminRecommendationsPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'banks' | 'funding'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [fundingProducts, setFundingProducts] = useState<FundingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
