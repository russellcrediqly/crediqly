'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Clock, RefreshCw, UserCheck, ShieldCheck, Package, FileText, Landmark } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { getAdminUsers } from '@/lib/supabase/adminService';
import { getAllProductsAdmin } from '@/lib/supabase/productService';
import { getAllBanksAdmin } from '@/lib/supabase/bankService';
import { getAllContentAdmin } from '@/lib/supabase/contentService';

interface ActivityEvent {
  id: string;
  type: 'user' | 'product' | 'bank' | 'content';
  title: string;
  description: string;
  timestamp: string;
  badge: string;
  variant: 'success' | 'info' | 'warning' | 'neutral';
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivity = async () => {
    setLoading(true);
    try {
      const [users, products, bankList, content] = await Promise.all([
        getAdminUsers().catch(() => []),
        getAllProductsAdmin().catch(() => []),
        getAllBanksAdmin().catch(() => []),
        getAllContentAdmin().catch(() => []),
      ]);

      const events: ActivityEvent[] = [];

      // User activities
      users.slice(0, 10).forEach((u) => {
        events.push({
          id: `usr_${u.id}`,
          type: 'user',
          title: `User registration: ${u.fullName}`,
          description: `${u.email} registered ${u.businessName ? `(${u.businessName})` : ''}`,
          timestamp: u.createdAt,
          badge: u.role === 'admin' ? 'Admin' : 'Customer',
          variant: u.role === 'admin' ? 'warning' : 'info',
        });
      });

      // Product events
      products.slice(0, 5).forEach((p) => {
        events.push({
          id: `prod_${p.id}`,
          type: 'product',
          title: `Product in catalog: ${p.name}`,
          description: `Category: ${p.category} • Status: ${p.status} • Affiliate: ${p.affiliateEnabled ? 'Enabled' : 'Direct'}`,
          timestamp: p.updatedAt || p.createdAt || new Date().toISOString(),
          badge: p.status,
          variant: p.status === 'active' ? 'success' : 'neutral',
        });
      });

      // Bank events
      bankList.slice(0, 5).forEach((b) => {
        events.push({
          id: `bnk_${b.id}`,
          type: 'bank',
          title: `Commercial Bank: ${b.name}`,
          description: `Pricing: ${b.minDeposit} dep / ${b.monthlyFee} • Priority: P${b.priority} • Affiliate: ${b.affiliateEnabled ? 'Enabled' : 'Direct'}`,
          timestamp: b.updatedAt || b.createdAt || new Date().toISOString(),
          badge: b.status,
          variant: b.status === 'active' ? 'success' : 'neutral',
        });
      });

      // Content events
      content.slice(0, 5).forEach((c) => {
        events.push({
          id: `cnt_${c.id}`,
          type: 'content',
          title: `Guide published: ${c.title}`,
          description: `Topic: ${c.category} • Status: ${c.status}`,
          timestamp: c.updatedAt || c.createdAt || new Date().toISOString(),
          badge: c.status,
          variant: c.status === 'published' ? 'success' : 'neutral',
        });
      });

      // Sort by timestamp desc
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(events);
    } catch (e) {
      console.error('Failed to load activity feed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Activity Stream
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Platform & Administrative Events
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological audit log of customer signups, commercial bank updates, and content publications.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadActivity}
          className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <LoadingState message="Aggregating platform activity..." className="text-white" />
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-900">
          {activities.map((act) => (
            <div key={act.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-900/40 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  {act.type === 'user' ? (
                    <UserCheck className="w-4 h-4 text-brand-400" />
                  ) : act.type === 'product' ? (
                    <Package className="w-4 h-4 text-emerald-400" />
                  ) : act.type === 'bank' ? (
                    <Landmark className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-teal-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-xs">{act.title}</span>
                    <Badge variant={act.variant as any} className="text-[9px] uppercase tracking-wider">
                      {act.badge}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{act.description}</p>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(act.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
