'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/ui/LoadingState';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { getProductBySlug, trackProductClick } from '@/lib/supabase/productService';
import { Product, CATEGORY_LABELS } from '@/types/product';
import {
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Info,
  CreditCard,
  Building,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;
    async function load() {
      try {
        const prod = await getProductBySlug(slug);
        if (isMounted) {
          setProduct(prod);
          setLoading(false);
        }
      } catch (e) {
        console.warn('Failed to load product detail:', e);
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
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-[400px] flex items-center justify-center">
            <LoadingState message="Loading product details..." />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!product) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
            <p className="text-xs text-slate-500">
              The credit product you requested could not be located or may be inactive.
            </p>
            <Link href="/products">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Credit Products</span>
              </Button>
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const targetUrl =
    product.affiliateEnabled && product.affiliateUrl
      ? product.affiliateUrl
      : product.websiteUrl;

  const handleVisit = () => {
    trackProductClick(user?.id, product.id);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          {/* Back link */}
          <div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all products</span>
            </Link>
          </div>

          {/* Main Product Card */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Product Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 font-black text-lg">
                    {product.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full inline-block">
                      {CATEGORY_LABELS[product.category] || product.category}
                    </span>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      {product.name}
                    </h1>
                    {product.productType && (
                      <p className="text-xs text-slate-500 font-medium">
                        {product.productType}
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleVisit}
                  className="self-start sm:self-center"
                >
                  <Button variant="primary" size="md" className="gap-2 shadow-xs text-xs font-semibold">
                    <span>Visit Provider</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Overview
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Bureau Reporting */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Commercial Credit Bureau Reporting</span>
                </h4>
                {product.reportingBureaus && product.reportingBureaus.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-600">
                      Reports trade line and commercial payment experiences to:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {product.reportingBureaus.map((bureau) => (
                        <span
                          key={bureau}
                          className="font-bold text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-md text-xs"
                        >
                          ✓ {bureau}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    This product is a foundational operational account or legal service that does not report trade lines directly.
                  </p>
                )}
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Eligibility & Requirements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                    <span>EIN Required: <strong>{product.einRequired ? 'Yes' : 'No'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                    <span>
                      Business Bank Account: <strong>{product.businessBankAccountRequired ? 'Required' : 'Not required'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                    <span>
                      Personal Guarantee:{' '}
                      <strong>
                        {product.personalGuaranteeRequired === 'no'
                          ? 'No PG'
                          : product.personalGuaranteeRequired === 'yes'
                          ? 'Yes'
                          : 'Check provider'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                    <span>
                      Time in Business: <strong>{product.typicalBusinessAge || 'No minimum'}</strong>
                    </span>
                  </div>
                </div>
                {product.personalCreditRequirement && (
                  <p className="text-xs text-slate-500 pt-1">
                    Personal Credit Requirement: <strong>{product.personalCreditRequirement}</strong>
                  </p>
                )}
              </div>

              {/* Professional Educational Disclosure */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>Disclosure</span>
                </div>
                <p className="leading-relaxed">
                  The information and resources provided are for educational purposes only. Requirements, terms, availability, and eligibility may vary by provider. Review all terms carefully before taking action. Some links may provide a commission to Crediqly at no additional cost to you.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
