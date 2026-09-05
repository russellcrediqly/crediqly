'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Activity,
  Clock,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  Package,
  FileText,
  Landmark,
  ShieldAlert,
  Search,
  Filter,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { getAdminUsers } from '@/lib/supabase/adminService';
import { getAllProductsAdmin } from '@/lib/supabase/productService';
import { getAllBanksAdmin } from '@/lib/supabase/bankService';
import { getAllContentAdmin } from '@/lib/supabase/contentService';
import {
  getAdminAuditLogs,
  AdminAuditEntry,
  AdminAuditEntityType,
} from '@/lib/supabase/adminAuditService';

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
  const [activeTab, setActiveTab] = useState<'audit' | 'platform'>('audit');
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>([]);
  const [platformEvents, setPlatformEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Audit filters
  const [auditSearch, setAuditSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [auditEntries, users, products, bankList, content] = await Promise.all([
        getAdminAuditLogs(100).catch(() => []),
        getAdminUsers().catch(() => []),
        getAllProductsAdmin().catch(() => []),
        getAllBanksAdmin().catch(() => []),
        getAllContentAdmin().catch(() => []),
      ]);

      setAuditLogs(auditEntries);

      const events: ActivityEvent[] = [];

      // User activities
      users.slice(0, 15).forEach((u) => {
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
      products.slice(0, 8).forEach((p) => {
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
      bankList.slice(0, 8).forEach((b) => {
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
      content.slice(0, 8).forEach((c) => {
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
      setPlatformEvents(events);
    } catch (e) {
      console.error('Failed to load activity & audit logs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((entry) => {
      if (entityFilter !== 'all' && entry.entityType.toLowerCase() !== entityFilter.toLowerCase()) {
        return false;
      }
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const matchesAdmin = entry.adminEmail.toLowerCase().includes(q);
        const matchesAction = entry.action.toLowerCase().includes(q);
        const matchesType = entry.entityType.toLowerCase().includes(q);
        const matchesName = entry.entityName?.toLowerCase().includes(q);
        const matchesDesc = entry.description.toLowerCase().includes(q);
        if (!matchesAdmin && !matchesAction && !matchesType && !matchesName && !matchesDesc) {
          return false;
        }
      }
      return true;
    });
  }, [auditLogs, entityFilter, auditSearch]);

  // Unique entity types for filter dropdown
  const distinctEntityTypes = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((l) => {
      if (l.entityType) set.add(l.entityType.toLowerCase());
    });
    return Array.from(set).sort();
  }, [auditLogs]);

  // Audit Metrics
  const auditMetrics = useMemo(() => {
    const total = auditLogs.length;
    const securityEvents = auditLogs.filter((l) =>
      l.action.toLowerCase().includes('password') || l.action.toLowerCase().includes('security')
    ).length;
    const customerEvents = auditLogs.filter((l) => l.entityType.toLowerCase() === 'customer').length;
    const settingsEvents = auditLogs.filter((l) =>
      ['settings', 'roadmap', 'recommendation', 'affiliate'].includes(l.entityType.toLowerCase())
    ).length;
    return { total, securityEvents, customerEvents, settingsEvents };
  }, [auditLogs]);

  const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'customer':
        return <User className="w-3.5 h-3.5 text-blue-400" />;
      case 'affiliate':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case 'roadmap':
        return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
      case 'recommendation':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'funding_application':
        return <DollarSign className="w-3.5 h-3.5 text-brand-400" />;
      case 'settings':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE')) {
      return <Badge variant="success" className="text-[9px] uppercase">Created</Badge>;
    }
    if (act.includes('DELETE')) {
      return <Badge variant="danger" className="text-[9px] uppercase">Deleted</Badge>;
    }
    if (act.includes('PASSWORD') || act.includes('SECURITY')) {
      return <Badge variant="warning" className="text-[9px] uppercase">Security</Badge>;
    }
    return <Badge variant="info" className="text-[9px] uppercase">Updated</Badge>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Audit & Governance Stream
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Activity & Administrative Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Immutable tracking of administrative modifications, role adjustments, affiliate placements, milestone overrides, and general platform events.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs gap-1.5 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
        </Button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-brand-500 text-white font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${activeTab === 'audit' ? 'text-brand-400' : 'text-slate-500'}`} />
          <span>Admin Audit Trail ({auditLogs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('platform')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'platform'
              ? 'border-brand-500 text-white font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className={`w-4 h-4 ${activeTab === 'platform' ? 'text-brand-400' : 'text-slate-500'}`} />
          <span>Platform Events ({platformEvents.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <LoadingState message="Aggregating audit entries..." className="text-white" />
        </div>
      ) : activeTab === 'audit' ? (
        /* TAB 1: ADMIN AUDIT TRAIL */
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <p className="text-xs text-slate-400 font-medium">Total Audit Entries</p>
                <p className="text-2xl font-black text-white mt-1">{auditMetrics.total}</p>
                <p className="text-[11px] text-slate-500 mt-1">Logged admin operations</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <p className="text-xs text-slate-400 font-medium">Customer Operations</p>
                <p className="text-2xl font-black text-blue-400 mt-1">{auditMetrics.customerEvents}</p>
                <p className="text-[11px] text-slate-500 mt-1">Status & profile modifications</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <p className="text-xs text-slate-400 font-medium">Configuration & Overrides</p>
                <p className="text-2xl font-black text-indigo-400 mt-1">{auditMetrics.settingsEvents}</p>
                <p className="text-[11px] text-slate-500 mt-1">Roadmap, affiliates, and advice</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <p className="text-xs text-slate-400 font-medium">Security & Credential Events</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{auditMetrics.securityEvents}</p>
                <p className="text-[11px] text-slate-500 mt-1">Password resets & permission grants</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Bar */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search admin, action, target entity, or description..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 sm:w-60">
                <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 capitalize"
                >
                  <option value="all">All Entity Types ({auditLogs.length})</option>
                  {distinctEntityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {(auditSearch || entityFilter !== 'all') && (
                <button
                  onClick={() => {
                    setAuditSearch('');
                    setEntityFilter('all');
                  }}
                  className="text-xs text-brand-400 hover:text-brand-300 underline font-medium self-center px-2"
                >
                  Clear
                </button>
              )}
            </CardContent>
          </Card>

          {/* Audit Logs List */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-900">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No audit logs found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {auditLogs.length === 0
                    ? 'Administrative actions will appear here automatically when updates are made.'
                    : 'No records matched the active filter criteria.'}
                </p>
              </div>
            ) : (
              filteredAuditLogs.map((entry) => {
                const isExpanded = expandedLogId === entry.id;
                const hasDetails = entry.previousValue || entry.newValue;

                return (
                  <div
                    key={entry.id}
                    className="p-4 hover:bg-slate-900/40 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                          {getEntityIcon(entry.entityType)}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs">
                              {entry.entityName || entry.entityId}
                            </span>
                            {getActionBadge(entry.action)}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 capitalize font-mono">
                              {entry.entityType.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {entry.description}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                            <span>
                              By: <strong className="text-slate-400 font-mono">{entry.adminEmail}</strong>
                            </span>
                            <span>&bull;</span>
                            <span className="font-mono text-[10px] text-slate-600 truncate max-w-[200px]">
                              ID: {entry.entityId}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(entry.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {hasDetails && (
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : entry.id)}
                            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                            title="Toggle technical payload"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Technical Detail / Diff Payload */}
                    {isExpanded && hasDetails && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800/90 text-[11px] font-mono grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-150">
                        {entry.previousValue && (
                          <div>
                            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                              Previous Value
                            </div>
                            <pre className="p-2 rounded bg-slate-900 text-slate-400 overflow-x-auto text-[10px]">
                              {JSON.stringify(entry.previousValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {entry.newValue && (
                          <div>
                            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                              Updated Value
                            </div>
                            <pre className="p-2 rounded bg-slate-900 text-slate-300 overflow-x-auto text-[10px]">
                              {JSON.stringify(entry.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* TAB 2: PLATFORM EVENTS STREAM */
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-900">
          {platformEvents.map((act) => (
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
                <span>
                  {new Date(act.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
