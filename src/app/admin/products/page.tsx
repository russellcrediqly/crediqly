'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Package,
  Plus,
  Search,
  Filter,
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getAllProductsAdmin,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  updateProductAffiliate,
} from '@/lib/supabase/productService';
import { Product, ProductCategory, ProductStatus, CATEGORY_LABELS } from '@/types/product';

const CATEGORIES: ProductCategory[] = [
  'business_credit_builders',
  'net_30',
  'net_60',
  'business_credit_cards',
  'business_banking',
  'business_services',
];

const STAGES = [
  { id: 'foundation', label: 'Business Foundation' },
  { id: 'credit_foundation', label: 'Business Credit Foundation' },
  { id: 'building', label: 'Credit Building' },
  { id: 'optimization', label: 'Credit Optimization' },
  { id: 'funding', label: 'Funding Preparation' },
];

export default function AdminProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [editProductModalOpen, setEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [affiliateModalOpen, setAffiliateModalOpen] = useState(false);
  const [affiliateProduct, setAffiliateProduct] = useState<Product | null>(null);
  const [affiliateUrlInput, setAffiliateUrlInput] = useState('');
  const [affiliateEnabledInput, setAffiliateEnabledInput] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProductsAdmin();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Check if ?edit=[id] or ?action=new is in URL
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && products.length > 0) {
      const found = products.find((p) => p.id === editId);
      if (found) {
        handleOpenEdit(found);
      }
    } else if (searchParams.get('action') === 'new') {
      handleOpenCreate();
    }
  }, [searchParams, products]);

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSlug = p.slug.toLowerCase().includes(q);
        const matchDesc = p.shortDescription.toLowerCase().includes(q);
        const matchBureaus = p.reportingBureaus.some((b) => b.toLowerCase().includes(q));
        if (!matchName && !matchSlug && !matchDesc && !matchBureaus) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedStatus, searchQuery]);

  // Quick Affiliate Modal
  const handleOpenAffiliateModal = (prod: Product) => {
    setAffiliateProduct(prod);
    setAffiliateUrlInput(prod.affiliateUrl || '');
    setAffiliateEnabledInput(prod.affiliateEnabled);
    setAffiliateModalOpen(true);
  };

  const handleSaveAffiliate = async () => {
    if (!affiliateProduct) return;
    setSaving(true);
    try {
      const res = await updateProductAffiliate(
        affiliateProduct.id,
        affiliateUrlInput.trim(),
        affiliateEnabledInput
      );
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === affiliateProduct.id
              ? { ...p, affiliateUrl: affiliateUrlInput.trim(), affiliateEnabled: affiliateEnabledInput }
              : p
          )
        );
        showToast(`Updated affiliate link for ${affiliateProduct.name}`);
        setAffiliateModalOpen(false);
      }
    } catch (e) {
      console.error('Failed to update affiliate link:', e);
    } finally {
      setSaving(false);
    }
  };

  // Quick Status Toggle (Active / Inactive)
  const handleToggleStatus = async (prod: Product) => {
    const newStatus: ProductStatus = prod.status === 'active' ? 'inactive' : 'active';
    setProducts((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, status: newStatus } : p))
    );
    await updateProductAdmin(prod.id, { status: newStatus });
    showToast(
      `${prod.name} is now ${newStatus === 'active' ? 'ACTIVE (visible to customers)' : 'INACTIVE (hidden from customers)'}`
    );
  };

  // Quick Featured Toggle
  const handleToggleFeatured = async (prod: Product) => {
    const newFeatured = !prod.featured;
    setProducts((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, featured: newFeatured } : p))
    );
    await updateProductAdmin(prod.id, { featured: newFeatured });
    showToast(`${prod.name} featured status: ${newFeatured ? 'ENABLED' : 'DISABLED'}`);
  };

  // Create Product Open
  const handleOpenCreate = () => {
    setEditingProduct({
      id: '',
      name: '',
      slug: '',
      category: 'net_30',
      description: '',
      shortDescription: '',
      websiteUrl: 'https://',
      affiliateUrl: '',
      affiliateEnabled: false,
      reportingBureaus: ['Dun & Bradstreet'],
      productType: 'Net-30 Vendor Account',
      minimumPurchase: '$50 minimum order',
      subscriptionRequired: false,
      typicalBusinessAge: 'No minimum',
      einRequired: true,
      businessBankAccountRequired: false,
      businessWebsiteRequired: false,
      personalGuaranteeRequired: 'no',
      personalCreditRequirement: 'None',
      recommendedStage: 'credit_foundation',
      priority: 2,
      status: 'active',
      featured: false,
    });
    setEditProductModalOpen(true);
  };

  // Edit Product Open
  const handleOpenEdit = (prod: Product) => {
    setEditingProduct({ ...prod });
    setEditProductModalOpen(true);
  };

  // Save Full Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.name.trim() || !editingProduct.websiteUrl.trim()) {
      alert('Product Name and Website URL are required.');
      return;
    }

    setSaving(true);
    try {
      const slug =
        editingProduct.slug.trim() ||
        editingProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (editingProduct.id) {
        // Update
        const res = await updateProductAdmin(editingProduct.id, {
          ...editingProduct,
          slug,
        });
        if (res.success && res.product) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? res.product! : p))
          );
          showToast(`Updated product "${res.product.name}"`);
        }
      } else {
        // Create
        const res = await createProductAdmin({
          ...editingProduct,
          slug,
        });
        if (res.success && res.product) {
          setProducts((prev) => [res.product!, ...prev]);
          showToast(`Added new product "${res.product.name}"`);
        }
      }
      setEditProductModalOpen(false);
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setSaving(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProductAdmin(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Product successfully deleted.');
      setDeleteConfirmId(null);
    } catch (e) {
      console.error('Failed to delete product:', e);
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
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Product Management
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">{products.length} total products</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Commercial Credit Products & Partners
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage provider listings, affiliate tracking links, bureau reporting, and eligibility criteria.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadProducts}
            className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search products by name, slug, bureau, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-brand-500 w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (Visible)</option>
              <option value="inactive">Inactive (Hidden)</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-900">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All Categories ({products.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {CATEGORY_LABELS[cat]} ({count})
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      {loading ? (
        <div className="py-16 text-center">
          <LoadingState message="Loading credit products catalog..." className="text-white" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
          <Package className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-white">No products matched your filters</p>
          <p className="text-xs text-slate-500">Try resetting your search query or category filters.</p>
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Stage / Priority</th>
                  <th className="py-3.5 px-4">Affiliate Status</th>
                  <th className="py-3.5 px-4">Featured</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Name & Slug */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.slug}</div>
                      {p.reportingBureaus.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {p.reportingBureaus.map((b) => (
                            <span
                              key={b}
                              className="text-[9px] font-semibold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="capitalize text-slate-300 font-medium">
                        {CATEGORY_LABELS[p.category] || p.category}
                      </span>
                    </td>

                    {/* Stage & Priority */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200 capitalize">
                        {p.recommendedStage.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Priority: <span className="font-bold text-brand-400">P{p.priority || 2}</span>
                      </div>
                    </td>

                    {/* Affiliate Link */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {p.affiliateEnabled ? (
                          <Badge variant="success" className="text-[10px]">
                            Active Partner
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="text-[10px]">
                            Direct Website
                          </Badge>
                        )}
                        <button
                          onClick={() => handleOpenAffiliateModal(p)}
                          className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold underline decoration-brand-500/40"
                          title="Quick edit affiliate URL"
                        >
                          Edit Link
                        </button>
                      </div>
                    </td>

                    {/* Featured Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleFeatured(p)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                          p.featured
                            ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                            : 'text-slate-500 hover:text-slate-300 bg-slate-900 border border-slate-800'
                        }`}
                        title="Toggle featured status"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{p.featured ? 'Featured' : 'Standard'}</span>
                      </button>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors inline-flex items-center gap-1.5 ${
                          p.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
                        }`}
                        title="Click to toggle active/inactive"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        <span className="capitalize">{p.status}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(p)}
                          className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 h-7 px-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <a
                          href={p.affiliateEnabled && p.affiliateUrl ? p.affiliateUrl : p.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-slate-900 rounded"
                          title="Test outbound link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 px-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK MODAL: Edit Affiliate Link */}
      {affiliateModalOpen && affiliateProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">Edit Affiliate Partnership</h3>
              </div>
              <button
                onClick={() => setAffiliateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Product:</span>
                <span className="text-sm font-bold text-white">{affiliateProduct.name}</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Affiliate URL
                </label>
                <input
                  type="url"
                  placeholder="https://provider.com/?aff=crediqly"
                  value={affiliateUrlInput}
                  onChange={(e) => setAffiliateUrlInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  When enabled, customers clicking &ldquo;Visit Provider&rdquo; will be routed through this URL.
                </p>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200 block">Affiliate Enabled</span>
                  <span className="text-[11px] text-slate-500 block">
                    Turn OFF to route customers directly to website URL ({affiliateProduct.websiteUrl})
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={affiliateEnabledInput}
                  onChange={(e) => setAffiliateEnabledInput(e.target.checked)}
                  className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAffiliateModalOpen(false)}
                className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAffiliate}
                disabled={saving}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5"
              >
                {saving ? 'Saving...' : 'Save Affiliate Link'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FULL MODAL: Add / Edit Product */}
      {editProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">
                  {editingProduct.id ? 'Edit Product' : 'Add New Credit Product'}
                </h3>
              </div>
              <button
                onClick={() => setEditProductModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Product Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. Quill Net-30"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={editingProduct.slug}
                    onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="auto-generated if empty"
                  />
                </div>
              </div>

              {/* Category & Product Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value as ProductCategory })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Product Type Tag</label>
                  <input
                    type="text"
                    value={editingProduct.productType || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, productType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. Tier-1 Vendor Credit (Net-30)"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Short Description <span className="text-slate-500 font-normal">(Card summary)</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.shortDescription}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  placeholder="1-2 sentences displayed on product card"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Description</label>
                <textarea
                  rows={3}
                  required
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  placeholder="Detailed explanation displayed in detail modal"
                />
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Website URL (Direct) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={editingProduct.websiteUrl}
                    onChange={(e) => setEditingProduct({ ...editingProduct, websiteUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="https://provider.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Affiliate URL</label>
                  <input
                    type="url"
                    value={editingProduct.affiliateUrl || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, affiliateUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="https://provider.com?ref=crediqly"
                  />
                </div>
              </div>

              {/* Reporting Bureaus (Checkboxes) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Reporting Commercial Bureaus
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Dun & Bradstreet', 'Experian Business', 'Equifax Business', 'SBFE'].map((bureau) => {
                    const checked = editingProduct.reportingBureaus.includes(bureau);
                    return (
                      <label
                        key={bureau}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${
                          checked
                            ? 'bg-brand-950/40 border-brand-500/50 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const newBureaus = e.target.checked
                              ? [...editingProduct.reportingBureaus, bureau]
                              : editingProduct.reportingBureaus.filter((b) => b !== bureau);
                            setEditingProduct({ ...editingProduct, reportingBureaus: newBureaus });
                          }}
                          className="w-3.5 h-3.5 accent-brand-600 rounded"
                        />
                        <span>{bureau}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.einRequired}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, einRequired: e.target.checked })
                    }
                    className="w-4 h-4 accent-brand-600 rounded"
                  />
                  <span>EIN Required</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.businessBankAccountRequired}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        businessBankAccountRequired: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-brand-600 rounded"
                  />
                  <span>Bank Account Required</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.businessWebsiteRequired}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        businessWebsiteRequired: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-brand-600 rounded"
                  />
                  <span>Website Required</span>
                </label>
              </div>

              {/* PG & Personal Credit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Personal Guarantee Policy
                  </label>
                  <select
                    value={editingProduct.personalGuaranteeRequired}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        personalGuaranteeRequired: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="no">No Personal Guarantee</option>
                    <option value="yes">Personal Guarantee Required</option>
                    <option value="soft_pull_only">Soft Pull / Identity Verification Only</option>
                    <option value="check_provider">Check with Provider</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Typical Business Age
                  </label>
                  <input
                    type="text"
                    value={editingProduct.typicalBusinessAge || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, typicalBusinessAge: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. No minimum or 6+ months"
                  />
                </div>
              </div>

              {/* Stage, Priority, Status, Featured */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Stage</label>
                  <select
                    value={editingProduct.recommendedStage}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, recommendedStage: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 text-xs"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={editingProduct.priority || 2}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, priority: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 text-xs"
                  >
                    <option value={1}>1 - High Priority</option>
                    <option value={2}>2 - Standard</option>
                    <option value={3}>3 - Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={editingProduct.status}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, status: e.target.value as ProductStatus })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Affiliate Enabled</label>
                  <select
                    value={editingProduct.affiliateEnabled ? 'yes' : 'no'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        affiliateEnabled: e.target.value === 'yes',
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 text-xs"
                  >
                    <option value="yes">Enabled</option>
                    <option value="no">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featuredToggle"
                  checked={editingProduct.featured}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, featured: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <label htmlFor="featuredToggle" className="text-slate-300 font-medium cursor-pointer">
                  Feature this product in top recommended sections
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditProductModalOpen(false)}
                  className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5 shadow-sm"
                >
                  {saving ? 'Saving...' : editingProduct.id ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Delete Product</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete this product from the catalog? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs"
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
