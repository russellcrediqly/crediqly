'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Search,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { getContentPages } from '@/lib/supabase/contentService';
import { ContentPage, ContentCategory, CONTENT_CATEGORIES } from '@/types/content';

const CATEGORY_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All Guides' },
  { key: 'business_credit', label: 'Business Credit' },
  { key: 'business_funding', label: 'Business Funding' },
  { key: 'credit_education', label: 'Credit Education' },
  { key: 'business_readiness', label: 'Business Readiness' },
  { key: 'getting_started', label: 'Getting Started' },
];

function LearnContent() {
  const searchParams = useSearchParams();
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await getContentPages();
        if (isMounted) {
          setPages(data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load content pages:', err);
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Featured article (first featured or first article)
  const featuredArticle = useMemo(() => {
    return pages.find((p) => p.featured) || pages[0] || null;
  }, [pages]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return pages.filter((p) => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.shortDescription.toLowerCase().includes(q);
        const matchContent = p.content.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchContent) return false;
      }
      return true;
    });
  }, [pages, activeCategory, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 border border-slate-800 p-6 sm:p-10 text-white shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Crediqly Resource Center</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Commercial Credit & Funding Knowledge Base
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Actionable, no-fluff educational guides designed to help small business owners establish, build, and optimize business credit without unnecessary personal liability.
          </p>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Featured Guide Banner (if available) */}
      {featuredArticle && !searchQuery && activeCategory === 'all' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Featured Guide
            </h2>
          </div>

          <Card className="bg-white border-brand-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Badge variant="info" className="text-xs font-semibold">
                      {CONTENT_CATEGORIES[featuredArticle.category] || featuredArticle.category}
                    </Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredArticle.readingTime || '5 min read'}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Editor&apos;s Pick
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    <Link href={`/learn/${featuredArticle.slug}`}>
                      {featuredArticle.title}
                    </Link>
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {featuredArticle.shortDescription}
                  </p>
                </div>

                <div className="shrink-0">
                  <Link href={`/learn/${featuredArticle.slug}`}>
                    <Button className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5 shadow-xs px-4 py-2.5">
                      <span>Read Guide</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const active = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="py-16 text-center">
            <LoadingState message="Loading educational guides..." />
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card className="bg-slate-50/70 border-slate-200 text-center py-12">
            <CardContent className="space-y-3">
              <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">No guides found matching your query</p>
              <p className="text-xs text-slate-500">Try choosing a different category or clearing the search field.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
                className="text-xs text-slate-700"
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="bg-white border-slate-200 hover:border-brand-200 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <CardContent className="p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200 uppercase tracking-wider">
                        {CONTENT_CATEGORIES[article.category] || article.category}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {article.readingTime || '5 min read'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                      <Link href={`/learn/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {article.shortDescription}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">
                      Educational Resource
                    </span>
                    <Link
                      href={`/learn/${article.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Educational Platform Disclaimer */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
        <p className="text-[11px] text-slate-500 leading-relaxed max-w-3xl mx-auto">
          Crediqly articles and guides are published strictly for educational and informational purposes. They do not constitute formal legal, financial, or tax advice. For personalized underwriting counsel, consult a certified commercial advisor or attorney.
        </p>
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="min-h-[400px] flex items-center justify-center">
            <LoadingState message="Loading resource center..." />
          </div>
        }
      >
        <LearnContent />
      </Suspense>
    </DashboardLayout>
  );
}
