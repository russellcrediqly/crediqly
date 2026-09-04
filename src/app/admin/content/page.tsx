'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  Eye,
  Sparkles,
  RefreshCw,
  Clock,
  BookOpen,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getAllContentAdmin,
  createContentAdmin,
  updateContentAdmin,
  deleteContentAdmin,
  togglePublishStatus,
} from '@/lib/supabase/contentService';
import { ContentPage, ContentCategory, ContentStatus, CONTENT_CATEGORIES } from '@/types/content';

const CATEGORIES: ContentCategory[] = [
  'business_credit',
  'business_funding',
  'credit_education',
  'business_readiness',
  'getting_started',
  'general',
];

export default function AdminContentPage() {
  const searchParams = useSearchParams();
  const [contentPages, setContentPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllContentAdmin();
      setContentPages(data);
    } catch (e) {
      console.error('Failed to load content pages:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenCreate();
    }
  }, [searchParams]);

  const filteredContent = useMemo(() => {
    return contentPages.filter((c) => {
      if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchSlug = c.slug.toLowerCase().includes(q);
        const matchDesc = c.shortDescription.toLowerCase().includes(q);
        if (!matchTitle && !matchSlug && !matchDesc) return false;
      }
      return true;
    });
  }, [contentPages, selectedCategory, selectedStatus, searchQuery]);

  const handleOpenCreate = () => {
    setEditingPage({
      id: '',
      slug: '',
      title: '',
      shortDescription: '',
      content: `## Introduction\n\nWrite an introductory overview explaining the concept to founders.\n\n### Step 1: Foundational Requirement\n\nExplain what documents or operational steps are needed.\n\n### Important Things to Know\n\n- Key tip 1\n- Key tip 2\n\n### Next Steps\n\nDirect the founder on what roadmap step to take next.`,
      category: 'business_credit',
      status: 'published',
      featured: false,
      readingTime: '5 min read',
    });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (page: ContentPage) => {
    setEditingPage({ ...page });
    setEditModalOpen(true);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage || !editingPage.title.trim() || !editingPage.content.trim()) {
      alert('Title and Content body are required.');
      return;
    }

    setSaving(true);
    try {
      const slug =
        editingPage.slug.trim() ||
        editingPage.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (editingPage.id) {
        // Update
        const res = await updateContentAdmin(editingPage.id, {
          ...editingPage,
          slug,
        });
        if (res.success && res.contentPage) {
          setContentPages((prev) =>
            prev.map((p) => (p.id === editingPage.id ? res.contentPage! : p))
          );
          showToast(`Updated "${res.contentPage.title}"`);
        }
      } else {
        // Create
        const res = await createContentAdmin({
          ...editingPage,
          slug,
        });
        if (res.success && res.contentPage) {
          setContentPages((prev) => [res.contentPage!, ...prev]);
          showToast(`Created new guide "${res.contentPage.title}"`);
        }
      }
      setEditModalOpen(false);
    } catch (err) {
      console.error('Failed to save content page:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (page: ContentPage, newStatus: ContentStatus) => {
    setContentPages((prev) =>
      prev.map((p) => (p.id === page.id ? { ...p, status: newStatus } : p))
    );
    await togglePublishStatus(page.id, newStatus);
    showToast(
      `"${page.title}" status changed to ${newStatus.toUpperCase()} ${
        newStatus === 'published' ? '(Visible on /learn)' : '(Hidden from customers)'
      }`
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContentAdmin(id);
      setContentPages((prev) => prev.filter((p) => p.id !== id));
      showToast('Guide successfully deleted.');
      setDeleteConfirmId(null);
    } catch (e) {
      console.error('Failed to delete content:', e);
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
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Customer Content
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">{contentPages.length} educational guides</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Educational Guides & Knowledge Base
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish guides, credit tutorials, and business readiness checklists displayed under /learn.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadContent}
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
            <span>Create New Guide</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search guides by title, slug, or content excerpt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-brand-500 w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published (Live)</option>
              <option value="draft">Draft (Admin Only)</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-900">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All Topics ({contentPages.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = contentPages.filter((c) => c.category === cat).length;
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
                  {CONTENT_CATEGORIES[cat]} ({count})
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      {loading ? (
        <div className="py-16 text-center">
          <LoadingState message="Loading educational content..." className="text-white" />
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
          <FileText className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-white">No articles matched your criteria</p>
          <p className="text-xs text-slate-500">Create a new guide or adjust your filters.</p>
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Title & Excerpt</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Reading Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Featured</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredContent.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Title */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-white text-sm">{page.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {page.shortDescription}
                      </div>
                      <div className="text-[10px] text-brand-400/80 font-mono mt-0.5">
                        /learn/{page.slug}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <Badge variant="neutral" className="text-[10px]">
                        {CONTENT_CATEGORIES[page.category] || page.category}
                      </Badge>
                    </td>

                    {/* Reading Time */}
                    <td className="py-3.5 px-4 text-slate-400">
                      <span>{page.readingTime || '5 min read'}</span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={page.status}
                        onChange={(e) =>
                          handleToggleStatus(page, e.target.value as ContentStatus)
                        }
                        className={`border rounded-xl text-[11px] px-2.5 py-1 font-bold focus:outline-none focus:border-brand-500 ${
                          page.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : page.status === 'draft'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        <option value="published">Published (Live)</option>
                        <option value="draft">Draft (Private)</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>

                    {/* Featured Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={async () => {
                          const newFeatured = !page.featured;
                          setContentPages((prev) =>
                            prev.map((p) => (p.id === page.id ? { ...p, featured: newFeatured } : p))
                          );
                          await updateContentAdmin(page.id, { featured: newFeatured });
                          showToast(`Featured status updated for "${page.title}"`);
                        }}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                          page.featured
                            ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                            : 'text-slate-500 hover:text-slate-300 bg-slate-900 border border-slate-800'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{page.featured ? 'Featured' : 'Standard'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(page)}
                          className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 h-7 px-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <a
                          href={`/learn/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-slate-900 rounded"
                          title="Preview customer article"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(page.id)}
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

      {/* CREATE / EDIT GUIDE MODAL */}
      {editModalOpen && editingPage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8 max-h-[92vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">
                  {editingPage.id ? 'Edit Educational Guide' : 'Create New Educational Guide'}
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePage} className="space-y-4 text-xs">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Guide Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPage.title}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. Understanding Business Credit"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={editingPage.slug}
                    onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="auto-generated from title if blank"
                  />
                </div>
              </div>

              {/* Category, Status, Reading Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={editingPage.category}
                    onChange={(e) =>
                      setEditingPage({
                        ...editingPage,
                        category: e.target.value as ContentCategory,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CONTENT_CATEGORIES[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Publication Status</label>
                  <select
                    value={editingPage.status}
                    onChange={(e) =>
                      setEditingPage({
                        ...editingPage,
                        status: e.target.value as ContentStatus,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="published">Published (Live to customers)</option>
                    <option value="draft">Draft (Admin review only)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estimated Reading Time</label>
                  <input
                    type="text"
                    value={editingPage.readingTime || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, readingTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. 5 min read"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Short Description / Excerpt <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingPage.shortDescription}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, shortDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  placeholder="Summary displayed on guide cards in /learn..."
                />
              </div>

              {/* Markdown Content Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">
                    Article Body (Markdown Supported) <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Supports ## Headings, - Lists, [Links](url), | Tables
                  </span>
                </div>
                <textarea
                  rows={14}
                  required
                  value={editingPage.content}
                  onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-brand-500 leading-relaxed"
                  placeholder="Write guide content using standard markdown..."
                />
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featuredContentToggle"
                  checked={editingPage.featured}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, featured: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <label
                  htmlFor="featuredContentToggle"
                  className="text-slate-300 font-medium cursor-pointer"
                >
                  Feature this guide prominently at the top of /learn
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
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
                  {saving ? 'Saving...' : editingPage.id ? 'Save Changes' : 'Publish Guide'}
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
            <h3 className="text-base font-bold text-white">Delete Guide</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete this educational guide?
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
                onClick={() => handleDelete(deleteConfirmId)}
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
