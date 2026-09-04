'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Check,
  X,
  MessageSquare,
  Sparkles,
  CalendarCheck,
  Layers,
  ArrowUpDown,
  User,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getAllConsultationsAdmin,
  adminUpdateConsultation,
} from '@/lib/supabase/consultationService';
import {
  Consultation,
  ConsultationStatus,
  ConsultationType,
  ConsultationPaymentStatus,
} from '@/types/consultation';

const ALL_STATUSES: ConsultationStatus[] = [
  'Requested',
  'Confirmed',
  'Rescheduled',
  'Completed',
  'Cancelled',
];

const ALL_TYPES: ConsultationType[] = [
  'Business Credit',
  'Funding Readiness',
  'Funding Strategy',
  'General Consultation',
  'Premium Advisory Monthly Meeting',
];

const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
];

function getStatusBadge(status: ConsultationStatus) {
  switch (status) {
    case 'Requested':
      return <Badge variant="info" className="bg-sky-950 text-sky-300 border-sky-800">Requested</Badge>;
    case 'Confirmed':
      return <Badge variant="success" className="bg-emerald-950 text-emerald-300 border-emerald-800">Confirmed</Badge>;
    case 'Rescheduled':
      return <Badge variant="warning" className="bg-amber-950 text-amber-300 border-amber-800">Rescheduled</Badge>;
    case 'Completed':
      return <Badge variant="neutral" className="bg-slate-800 text-slate-300 border-slate-700">Completed</Badge>;
    case 'Cancelled':
      return <Badge variant="danger" className="bg-red-950 text-red-300 border-red-800">Cancelled</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

function getPaymentBadge(status?: ConsultationPaymentStatus, amount?: number, type?: ConsultationType) {
  if (type === 'Premium Advisory Monthly Meeting' || (status === 'paid' && amount === 0)) {
    return (
      <Badge variant="success" className="bg-indigo-950 text-indigo-300 border-indigo-800 gap-1 font-bold">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Advisory Included ($0)</span>
      </Badge>
    );
  }

  switch (status) {
    case 'paid':
      return (
        <Badge variant="success" className="bg-emerald-950 text-emerald-300 border-emerald-800 gap-1">
          <CreditCard className="w-3 h-3" />
          <span>Paid ($99)</span>
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="warning" className="bg-amber-950 text-amber-300 border-amber-800 gap-1">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="danger" className="bg-red-950 text-red-300 border-red-800 gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>Failed</span>
        </Badge>
      );
    case 'refunded':
      return (
        <Badge variant="neutral" className="bg-slate-800 text-slate-300 border-slate-700">
          Refunded
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" className="bg-slate-800 text-slate-400 border-slate-700">
          Unpaid
        </Badge>
      );
  }
}

export default function AdminConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ConsultationStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ConsultationType>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Manage / Edit Modal State
  const [activeItem, setActiveItem] = useState<Consultation | null>(null);
  const [modalMode, setModalMode] = useState<'confirm' | 'reschedule' | 'complete' | 'cancel' | 'edit' | null>(null);
  const [modalStatus, setModalStatus] = useState<ConsultationStatus>('Confirmed');
  const [modalConfirmedDate, setModalConfirmedDate] = useState('');
  const [modalConfirmedTime, setModalConfirmedTime] = useState('10:00 AM');
  const [modalAdminMessage, setModalAdminMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchConsultations = useCallback(async () => {
    try {
      const data = await getAllConsultationsAdmin();
      setConsultations(data);
    } catch (err) {
      console.error('Failed to load consultations for admin:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConsultations();
  };

  // Open modal prefilled
  const openModal = (item: Consultation, mode: 'confirm' | 'reschedule' | 'complete' | 'cancel' | 'edit') => {
    setActiveItem(item);
    setModalMode(mode);

    if (mode === 'confirm') {
      setModalStatus('Confirmed');
      setModalConfirmedDate(item.confirmedDate || item.preferredDate);
      setModalConfirmedTime(item.confirmedTime || item.preferredTime);
      setModalAdminMessage(item.adminMessage || `Your consultation has been confirmed for ${item.preferredDate} at ${item.preferredTime}.`);
    } else if (mode === 'reschedule') {
      setModalStatus('Rescheduled');
      setModalConfirmedDate(item.confirmedDate || item.preferredDate);
      setModalConfirmedTime(item.confirmedTime || item.preferredTime);
      setModalAdminMessage(item.adminMessage || `Your consultation has been rescheduled. Please review the updated appointment time.`);
    } else if (mode === 'complete') {
      setModalStatus('Completed');
      setModalConfirmedDate(item.confirmedDate || item.preferredDate);
      setModalConfirmedTime(item.confirmedTime || item.preferredTime);
      setModalAdminMessage(item.adminMessage || `Consultation concluded successfully.`);
    } else if (mode === 'cancel') {
      setModalStatus('Cancelled');
      setModalConfirmedDate(item.confirmedDate || item.preferredDate);
      setModalConfirmedTime(item.confirmedTime || item.preferredTime);
      setModalAdminMessage(item.adminMessage || `This consultation request has been cancelled.`);
    } else {
      setModalStatus(item.status);
      setModalConfirmedDate(item.confirmedDate || item.preferredDate);
      setModalConfirmedTime(item.confirmedTime || item.preferredTime);
      setModalAdminMessage(item.adminMessage || '');
    }
  };

  const closeModal = () => {
    setActiveItem(null);
    setModalMode(null);
    setSaving(false);
  };

  // Save Modal Action
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setSaving(true);

    try {
      const updated = await adminUpdateConsultation(activeItem.id, {
        status: modalStatus,
        confirmedDate: modalConfirmedDate || undefined,
        confirmedTime: modalConfirmedTime || undefined,
        adminMessage: modalAdminMessage.trim() || undefined,
      });

      if (updated) {
        setConsultations((prev) =>
          prev.map((c) => (c.id === activeItem.id ? { ...c, ...updated } : c))
        );
        showFeedback('success', `Consultation updated to "${modalStatus}"`);
        closeModal();
      }
    } catch (err: any) {
      console.error('Failed to update consultation:', err);
      showFeedback('error', err.message || 'Failed to update consultation');
    } finally {
      setSaving(false);
    }
  };

  // Filtered list
  const filtered = useMemo(() => {
    return consultations.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (typeFilter !== 'all' && item.consultationType !== typeFilter) return false;
      if (dateFilter) {
        const itemDate = item.confirmedDate || item.preferredDate;
        if (itemDate !== dateFilter) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesEmail = item.userEmail?.toLowerCase().includes(q);
        const matchesName = item.userName?.toLowerCase().includes(q);
        const matchesCustMsg = item.customerMessage?.toLowerCase().includes(q);
        const matchesAdminMsg = item.adminMessage?.toLowerCase().includes(q);
        if (!matchesEmail && !matchesName && !matchesCustMsg && !matchesAdminMsg) return false;
      }
      return true;
    });
  }, [consultations, statusFilter, typeFilter, dateFilter, search]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = consultations.length;
    const requested = consultations.filter((c) => c.status === 'Requested').length;
    const confirmed = consultations.filter((c) => c.status === 'Confirmed').length;
    const rescheduled = consultations.filter((c) => c.status === 'Rescheduled').length;
    const completed = consultations.filter((c) => c.status === 'Completed').length;
    return { total, requested, confirmed, rescheduled, completed };
  }, [consultations]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingState message="Loading consultations..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 ${
            feedback.type === 'success'
              ? 'bg-slate-900 border-emerald-500 text-emerald-300'
              : 'bg-slate-900 border-red-500 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Advisory Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Consultations & Appointment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Review customer consultation requests, confirm or reschedule appointment dates and times, and dispatch guidance instructions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-slate-800 text-slate-300 hover:bg-slate-850 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Total Requests</p>
                <p className="text-2xl font-black text-white mt-1">{metrics.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">All recorded customer requests</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Pending Review</p>
                <p className="text-2xl font-black text-sky-400 mt-1">{metrics.requested}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-900 flex items-center justify-center text-sky-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Awaiting admin confirmation</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Confirmed / Scheduled</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.confirmed}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-900 flex items-center justify-center text-emerald-400">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Active confirmed appointments</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Completed Sessions</p>
                <p className="text-2xl font-black text-brand-400 mt-1">{metrics.completed}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-950/60 border border-brand-900 flex items-center justify-center text-brand-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Successfully held consultations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email, name, notes..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Statuses ({consultations.length})</option>
                {ALL_STATUSES.map((st) => {
                  const count = consultations.filter((c) => c.status === st).length;
                  return (
                    <option key={st} value={st}>
                      {st} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Consultation Type Filter */}
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Types</option>
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Active filter counter */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
            <span>
              Showing <strong>{filtered.length}</strong> of <strong>{consultations.length}</strong> consultations
            </span>
            {(search || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setDateFilter('');
                }}
                className="text-xs text-brand-400 hover:text-brand-300 underline font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consultations Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Consultation Type</th>
                <th className="py-3 px-4">Requested Timing</th>
                <th className="py-3 px-4">Confirmed Timing</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Customer Message</th>
                <th className="py-3 px-4">Admin Message</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Calendar className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-300">No consultations found</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {consultations.length === 0
                          ? 'No customer has submitted a consultation request yet. Requests from /consultation will appear here.'
                          : 'No consultation requests match the selected filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                    {/* Customer */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-200">
                      <div className="font-semibold text-white">
                        {item.userEmail || 'Customer'}
                      </div>
                      {item.userName && (
                        <div className="text-[10px] text-slate-400">{item.userName}</div>
                      )}
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4">
                      {item.consultationType === 'Premium Advisory Monthly Meeting' ? (
                        <span className="font-semibold text-indigo-300 bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded flex items-center gap-1 w-fit text-[11px]">
                          <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>Advisory Meeting</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {item.consultationType}
                        </span>
                      )}
                    </td>

                    {/* Requested Timing */}
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      <div className="font-medium text-white">
                        {new Date(item.preferredDate + 'T00:00:00').toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-500">{item.preferredTime}</div>
                    </td>

                    {/* Confirmed Timing */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.confirmedDate ? (
                        <div>
                          <div className="font-bold text-emerald-400">
                            {new Date(item.confirmedDate + 'T00:00:00').toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-emerald-300">
                            {item.confirmedTime || item.preferredTime}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      {getPaymentBadge(item.paymentStatus, item.paymentAmount, item.consultationType)}
                    </td>

                    {/* Customer Message */}
                    <td className="py-3.5 px-4 text-slate-400 max-w-[160px] truncate">
                      {item.customerMessage ? (
                        <span title={item.customerMessage} className="italic text-slate-300 text-[11px]">
                          &ldquo;{item.customerMessage}&rdquo;
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Admin Message */}
                    <td className="py-3.5 px-4 text-slate-400 max-w-[180px] truncate">
                      {item.adminMessage ? (
                        <span title={item.adminMessage} className="text-brand-300 text-[11px] font-medium">
                          {item.adminMessage}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === 'Requested' && (
                          <button
                            onClick={() => openModal(item, 'confirm')}
                            title="Confirm appointment"
                            className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => openModal(item, 'reschedule')}
                          title="Reschedule appointment"
                          className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 hover:bg-amber-900 transition-colors"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openModal(item, 'edit')}
                          title="Edit details / Message"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {item.status !== 'Completed' && item.status !== 'Cancelled' && (
                          <button
                            onClick={() => openModal(item, 'complete')}
                            title="Mark Completed"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ADMIN ACTION / EDIT MODAL */}
      {activeItem && modalMode && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">
                  {modalMode === 'confirm' && 'Confirm Consultation Appointment'}
                  {modalMode === 'reschedule' && 'Reschedule Consultation Appointment'}
                  {modalMode === 'complete' && 'Mark Consultation as Completed'}
                  {modalMode === 'cancel' && 'Cancel Consultation Request'}
                  {modalMode === 'edit' && 'Manage Consultation Request'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Summary Card */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Customer</span>
                <span className="font-semibold text-white">{activeItem.userEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Type</span>
                <span className="text-brand-300 font-bold">{activeItem.consultationType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Requested Timing</span>
                <span className="text-slate-200">
                  {activeItem.preferredDate} at {activeItem.preferredTime}
                </span>
              </div>
              {activeItem.customerMessage && (
                <div className="pt-1 border-t border-slate-850 text-slate-400">
                  <span className="text-slate-500">Note: </span>
                  <span className="italic">&ldquo;{activeItem.customerMessage}&rdquo;</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Status Select */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-300">Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as ConsultationStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  required
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Confirmed Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300">Confirmed Date</label>
                  <input
                    type="date"
                    value={modalConfirmedDate}
                    onChange={(e) => setModalConfirmedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-[10px] text-slate-500">Stored separately from requested date.</p>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-300">Confirmed Time</label>
                  <select
                    value={modalConfirmedTime}
                    onChange={(e) => setModalConfirmedTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500">Appointment hour.</p>
                </div>
              </div>

              {/* Admin Message */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-300">
                  Admin Message to Customer (Optional)
                </label>
                <textarea
                  rows={3}
                  value={modalAdminMessage}
                  onChange={(e) => setModalAdminMessage(e.target.value)}
                  placeholder="e.g., Your consultation is confirmed! We will call you at the registered number or send Google Meet details."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <p className="text-[10px] text-slate-500">
                  This message is visible to the customer on their /consultation screen.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closeModal}
                  className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1"
                >
                  <span>{saving ? 'Saving...' : 'Save & Update'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
