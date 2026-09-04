'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  BookOpen,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Package,
  Layers,
  Share2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { getContentPageBySlug, getContentPages } from '@/lib/supabase/contentService';
import { ContentPage, CONTENT_CATEGORIES } from '@/types/content';

/**
 * Simple, safe markdown parser for article rendering
 * Converts ## and ### headings, tables, list items, and bold text into structured React elements.
 */
function MarkdownArticleRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (keyIndex: number) => {
    if (inTable && tableHeader.length > 0) {
      elements.push(
        <div key={`table_${keyIndex}`} className="overflow-x-auto my-6">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                {tableHeader.map((th, i) => (
                  <th key={i} className="py-2.5 px-4">
                    {th.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {tableRows.map((row, rI) => (
                <tr key={rI} className="hover:bg-slate-50">
                  {row.map((cell, cI) => (
                    <td key={cI} className="py-2.5 px-4 text-slate-600">
                      {cell.trim().replace(/\*\*(.*?)\*\*/g, '$1')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Table row detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cols = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      if (cols.every((c) => /^:?-+:?$/.test(c))) {
        // Table separator row, ignore
        return;
      }
      if (!inTable) {
        inTable = true;
        tableHeader = cols;
      } else {
        tableRows.push(cols);
      }
      return;
    } else if (inTable) {
      flushTable(index);
    }

    if (!trimmed) {
      elements.push(<div key={index} className="h-3" />);
      return;
    }

    // Level 2 Heading
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={index}
          className="text-xl sm:text-2xl font-bold text-slate-900 mt-8 mb-3 tracking-tight border-b border-slate-100 pb-2"
        >
          {trimmed.slice(3)}
        </h2>
      );
      return;
    }

    // Level 3 Heading
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={index}
          className="text-base sm:text-lg font-bold text-slate-900 mt-6 mb-2 tracking-tight flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"></span>
          <span>{trimmed.slice(4)}</span>
        </h3>
      );
      return;
    }

    // Horizontal Rule
    if (trimmed === '---') {
      elements.push(<hr key={index} className="my-6 border-slate-200" />);
      return;
    }

    // Unordered List item
    if (trimmed.startsWith('- ')) {
      elements.push(
        <div key={index} className="flex items-start gap-2.5 my-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed pl-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0" />
          <span>
            {trimmed.slice(2).split('**').map((chunk, i) =>
              i % 2 === 1 ? <strong key={i} className="text-slate-900 font-semibold">{chunk}</strong> : chunk
            )}
          </span>
        </div>
      );
      return;
    }

    // Checkbox List item
    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
      elements.push(
        <div key={index} className="flex items-center gap-2.5 my-2 text-xs sm:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
          <span className="font-medium">{trimmed.slice(6)}</span>
        </div>
      );
      return;
    }

    // Standard Paragraph
    elements.push(
      <p key={index} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-2">
        {trimmed.split('**').map((chunk, i) =>
          i % 2 === 1 ? <strong key={i} className="text-slate-900 font-semibold">{chunk}</strong> : chunk
        )}
      </p>
    );
  });

  flushTable(lines.length);
  return <div className="space-y-1">{elements}</div>;
}

export default function ArticleReaderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [article, setArticle] = useState<ContentPage | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!slug) return;
      setLoading(true);
      try {
        const page = await getContentPageBySlug(slug);
        if (isMounted) {
          setArticle(page);
          if (page) {
            const all = await getContentPages(page.category);
            setRelatedArticles(all.filter((p) => p.slug !== slug).slice(0, 3));
          }
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load article:', err);
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[500px] flex items-center justify-center">
          <LoadingState message="Loading educational guide..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!article) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <BookOpen className="w-12 h-12 mx-auto text-slate-400" />
          <h2 className="text-xl font-bold text-slate-900">Guide Not Found</h2>
          <p className="text-xs text-slate-600">
            The educational guide you are looking for may have been updated or unpublished.
          </p>
          <Link href="/learn">
            <Button variant="primary" size="sm" className="bg-brand-600 text-white text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Resource Center</span>
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <article className="max-w-4xl mx-auto pb-16 font-sans space-y-8">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <Link href="/learn" className="hover:text-brand-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Resource Center</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link
            href={`/learn?category=${article.category}`}
            className="hover:text-brand-600 transition-colors capitalize font-medium"
          >
            {CONTENT_CATEGORIES[article.category] || article.category}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-800 font-semibold truncate max-w-xs sm:max-w-md">
            {article.title}
          </span>
        </div>

        {/* Article Header Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge variant="info" className="text-xs font-semibold uppercase tracking-wider">
              {CONTENT_CATEGORIES[article.category] || article.category}
            </Badge>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readingTime || '5 min read'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed border-l-2 border-brand-500 pl-3 italic">
            {article.shortDescription}
          </p>
        </div>

        {/* Main Article Body */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6 sm:p-10">
            <MarkdownArticleRenderer content={article.content} />
          </CardContent>
        </Card>

        {/* Next Step / Practical CTA Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-brand-900 via-brand-950 to-slate-900 text-white shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              Put This Strategy Into Practice
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Building commercial credit is an active process. Explore reporting vendors suited for your company stage or track your next best task on your personalized roadmap.
          </p>
          <div className="flex items-center gap-3 flex-wrap pt-2">
            <Link href="/products">
              <Button size="sm" className="bg-brand-500 hover:bg-brand-400 text-white text-xs gap-1.5 shadow-sm">
                <Package className="w-4 h-4" />
                <span>Explore Credit Products</span>
              </Button>
            </Link>
            <Link href="/roadmap">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 text-xs gap-1.5"
              >
                <Layers className="w-4 h-4" />
                <span>Open Credit Roadmap</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Related Guides (if any) */}
        {relatedArticles.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Related Educational Guides
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <Card
                  key={rel.id}
                  className="bg-white border-slate-200 hover:border-brand-200 hover:shadow-sm transition-all group"
                >
                  <CardContent className="p-4 space-y-2 flex flex-col justify-between h-full">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        {rel.readingTime || '5 min read'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 mt-1">
                        <Link href={`/learn/${rel.slug}`}>{rel.title}</Link>
                      </h4>
                    </div>
                    <Link
                      href={`/learn/${rel.slug}`}
                      className="text-[11px] font-semibold text-brand-600 hover:underline inline-flex items-center gap-1 pt-2"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </article>
    </DashboardLayout>
  );
}
