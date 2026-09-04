'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  HelpCircle,
  MessageSquare,
  Sparkles,
  CalendarCheck,
  Ban,
  Building2,
  CreditCard,
  Headphones,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { SectionInactiveNotice } from '@/components/common/SectionInactiveNotice';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import {
  getUserConsultations,
  createConsultationRequest,
  cancelConsultationCustomer,
} from '@/lib/supabase/consultationService';
import {
  Consultation,
  ConsultationType,
  ConsultationStatus,
  ConsultationPaymentStatus,
  getConsultationStatusDetails,
} from '@/types/consultation';

const CONSULTATION_TYPES: ConsultationType[] = [
  'Business Credit',
  'Funding Readiness',
  'Funding Strategy',
  'General Consultation',
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

// Helper to get tomorrow's date string YYYY-MM-DD
function getMinDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function getStatusBadge(status: ConsultationStatus) {
  switch (status) {
    case 'Requested':
      return <Badge variant="info">Requested</Badge>;
    case 'Confirmed':
      return <Badge variant="success">Confirmed</Badge>;
    case 'Rescheduled':
      return <Badge variant="warning">Rescheduled</Badge>;
    case 'Completed':
      return <Badge variant="neutral">Completed</Badge>;
    case 'Cancelled':
      return <Badge variant="danger">Cancelled</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

function getPaymentBadge(status?: ConsultationPaymentStatus, amount?: number, type?: ConsultationType) {
  if (type === 'Premium Advisory Monthly Meeting' || (status === 'paid' && amount === 0)) {
    return (
      <Badge variant="success" className="gap-1 bg-indigo-50 border-indigo-200 text-indigo-700 font-bold">
        <Sparkles className="w-3 h-3 text-indigo-600" />
        <span>Included ($0)</span>
      </Badge>
    );
  }

  switch (status) {
    case 'paid':
      return (
        <Badge variant="success" className="gap-1">
          <CreditCard className="w-3 h-3" />
          <span>Paid ($99)</span>
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="warning" className="gap-1">
          <Clock className="w-3 h-3" />
          <span>Payment Pending</span>
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="danger" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>Payment Failed</span>
        </Badge>
      );
    case 'refunded':
      return (
        <Badge variant="neutral" className="gap-1">
          <span>Refunded</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" className="gap-1">
          <span>Unpaid</span>
        </Badge>
      );
  }
}

function ConsultationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isAdvisory, upgradeToAdvisory } = useSubscription();
  const { sections, settings } = usePlatformSections();

  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedConsultation, setSubmittedConsultation] = useState<Consultation | null>(null);

  // Form State
  const [consultationType, setConsultationType] = useState<ConsultationType>('Premium Advisory Monthly Meeting');
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [preferredTime, setPreferredTime] = useState<string>('10:00 AM');
  const [customerMessage, setCustomerMessage] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Cancellation State
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchConsultations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getUserConsultations(user.id);
      setConsultations(data);
    } catch (err) {
      console.error('Failed to load user consultations:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  useEffect(() => {
    if (searchParams.get('type') === 'advisory' || isAdvisory) {
      setConsultationType('Premium Advisory Monthly Meeting');
    }
  }, [searchParams, isAdvisory]);

  // Handle Advisory Meeting Booking ($0 included for Premium Advisory)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!isAdvisory) {
      setFormError('1-on-1 advisory meetings are an exclusive benefit of Premium Advisory. Please upgrade to schedule a session.');
      return;
    }

    if (!preferredDate) {
      setFormError('Please select a preferred date for your meeting.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const created = await createConsultationRequest(
        {
          consultationType: 'Premium Advisory Monthly Meeting',
          preferredDate,
          preferredTime,
          customerMessage,
          paymentStatus: 'paid',
          paymentAmount: 0.0,
        },
        user.id
      );

      if (created) {
        setSubmittedConsultation(created);
        await fetchConsultations();
        setShowForm(false);
        setPreferredDate('');
        setCustomerMessage('');
        showToast('Monthly advisory meeting requested successfully! Your advisor will confirm shortly.');
      }
    } catch (err: any) {
      console.error('Failed to book advisory meeting:', err);
      setFormError(err.message || 'Failed to book advisory meeting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Customer Cancellation
  const handleConfirmCancel = async () => {
    if (!cancellingId || !user?.id) return;
    setCancelLoading(true);

    try {
      const updated = await cancelConsultationCustomer(cancellingId, user.id);
      if (updated) {
        setConsultations((prev) =>
          prev.map((c) => (c.id === cancellingId ? updated : c))
        );
        showToast('Consultation request has been cancelled.');
      }
      setCancelModalOpen(false);
      setCancellingId(null);
    } catch (err: any) {
      console.error('Failed to cancel consultation:', err);
      showToast(err.message || 'Failed to cancel consultation');
    } finally {
      setCancelLoading(false);
    }
  };

  if (sections.consultation === false) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <SectionInactiveNotice
            title="Consultation Services Temporarily Inactive"
            description="1-on-1 advisor consultations are currently disabled or undergoing scheduling updates by the Crediqly team. Please check back soon or visit your dashboard."
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="py-20 flex justify-center">
            <LoadingState message="Loading your consultations..." />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Active / pending count
  const activeConsultations = consultations.filter((c) =>
    ['Requested', 'Confirmed', 'Rescheduled'].includes(c.status)
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8 max-w-5xl mx-auto pb-12">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-in fade-in slide-in-from-bottom-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}


          {/* Top Hero Section */}
          <div className="bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold tracking-wide border border-brand-500/30">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>{isAdvisory ? 'Premium Advisory Member' : 'Dedicated Commercial Advisory'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                {isAdvisory
                  ? 'Book Your Monthly Advisory Meeting'
                  : 'Personalized Guidance from a Crediqly Advisor'}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {isAdvisory
                  ? 'Your Premium Advisory membership includes a dedicated 1-on-1 monthly strategy meeting ($0 fee). Select your preferred date and time to meet with your commercial advisor.'
                  : settings?.messaging?.consultationMessage ||
                    'Looking for dedicated human support to navigate business credit and capital readiness? Monthly 1-on-1 strategy sessions are included in Crediqly Premium Advisory.'}
              </p>

              {/* Action Options */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                {isAdvisory ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSubmittedConsultation(null);
                      setShowForm(true);
                    }}
                    className="bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold shadow-md gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Monthly Meeting ($0)</span>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => router.push('/advisory')}
                    className="bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold shadow-md gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Explore Premium Advisory</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs sm:text-sm gap-2"
                >
                  <span>{isAdvisory ? 'Dashboard' : 'Continue Self-Guided'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </div>
            </div>
          </div>

          {/* SUBMISSION CONFIRMATION EXPERIENCE */}
          {submittedConsultation && (
            <Card className="border-2 border-emerald-500/30 bg-emerald-50/50 shadow-md">
              <CardContent className="p-6 sm:p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div className="space-y-1 max-w-lg mx-auto">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Advisory Meeting Requested
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Your request has been received ($0 fee included in your plan). Your advisor will review your preferred date and time and confirm the appointment.
                  </p>
                </div>

                <div className="max-w-md mx-auto bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs text-left text-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Session Type</span>
                    <span className="font-bold text-slate-900">{submittedConsultation.consultationType}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Preferred Date</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(submittedConsultation.preferredDate + 'T00:00:00').toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Preferred Time</span>
                    <span className="font-semibold text-slate-800">{submittedConsultation.preferredTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status</span>
                    <Badge variant="info">Requested</Badge>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubmittedConsultation(null)}
                    className="text-xs"
                  >
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    className="text-xs gap-1.5"
                  >
                    <span>Back to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FOR NON-ADVISORY USERS: ENCOURAGING ADVISORY UPGRADE CARD */}
          {!isAdvisory && (
            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 shadow-md">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-100 pb-5">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Crediqly Premium Advisory</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      Dedicated 1-on-1 Monthly Strategy Meetings
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                      1-on-1 strategy meetings are part of our full Done-For-You / Done-With-You advisory service. Free and Pro tiers provide self-guided roadmaps; Premium Advisory pairs you with a dedicated commercial advisor.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => router.push('/advisory')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shrink-0 gap-2"
                  >
                    <span>Explore Advisory</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">1 Monthly Strategy Call</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      45-minute structured advisory call every month ($0 booking fee) to review progress and prioritize next actions.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Done-For-You Sequencing</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Step-by-step guidance on which vendor, retail, and fleet accounts to establish in exact sequence.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Full Pro Access Included</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      All Pro tools, calculators, personalized roadmap milestones, and funding matches are included free.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900">Transparent Pricing</span>
                    <p className="text-xs text-slate-500">
                      $499 one-time setup + $149/month ongoing retainer. Cancel or pause anytime.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push('/advisory')}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5 font-bold shrink-0"
                  >
                    <span>Learn More & Upgrade</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CONSULTATION REQUEST FORM MODAL / SECTION (ADVISORY MEMBERS) */}
          {isAdvisory && showForm && !submittedConsultation && (
            <Card className="border-indigo-200 bg-white shadow-lg overflow-hidden">
              <div className="bg-indigo-50/70 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Schedule Your Monthly Advisory Meeting
                    </h2>
                    <p className="text-xs text-slate-500">
                      Included with your Premium Advisory membership ($0 fee)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-indigo-100/50"
                  aria-label="Close form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {formError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Consultation Type */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Meeting Type
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Premium Advisory Monthly Meeting (Included - $0)"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold cursor-not-allowed"
                    />
                    <p className="text-[11px] text-slate-500">
                      Your recurring retainer includes 1 dedicated monthly advisory session ($0 fee).
                    </p>
                  </div>

                  {/* Date & Time Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Preferred Date */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Preferred Date <span className="text-brand-600">*</span>
                      </label>
                      <input
                        type="date"
                        min={getMinDate()}
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                        required
                      />
                      <p className="text-[11px] text-slate-500">Available starting tomorrow (Mon–Fri).</p>
                    </div>

                    {/* Preferred Time */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Preferred Time <span className="text-brand-600">*</span>
                      </label>
                      <select
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                        required
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500">Standard business hours.</p>
                    </div>
                  </div>

                  {/* Optional Message */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Optional Agenda / Focus Areas
                    </label>
                    <textarea
                      rows={3}
                      value={customerMessage}
                      onChange={(e) => setCustomerMessage(e.target.value)}
                      placeholder="Share any specific tradeline questions, upcoming loan targets, or milestones you want to cover..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white"
                    />
                    <p className="text-[11px] text-slate-500">
                      Do not include sensitive financial data, passwords, or personal identity numbers.
                    </p>
                  </div>

                  {/* Pricing Notice & Terms */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          Included In Your Premium Advisory Membership ($0)
                        </span>
                        <Badge variant="info">45 Minutes</Badge>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Your active Done-For-You Advisory membership includes 1 dedicated monthly advisory meeting at no additional charge. We will review your tradeline sequence, funding readiness, and strategic next steps.
                      </p>
                    </div>
                  </div>

                  {/* Trust & Safety Assurance */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">Secure & Confidential: </span>
                      <span>
                        Crediqly does not ask for or store SSNs, bank passwords, or tax returns. Consultations are structured for educational and strategic guidance.
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowForm(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={submitting}
                      className="text-xs gap-1.5 font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{submitting ? 'Scheduling Meeting...' : 'Book Monthly Meeting ($0)'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* CUSTOMER CONSULTATION HISTORY */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Your Advisory Sessions
                </h2>
                <p className="text-xs text-slate-500">
                  Track the status and history of your strategic advisory meetings
                </p>
              </div>

              {isAdvisory && !showForm && !submittedConsultation && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowForm(true)}
                  className="text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-600" />
                  <span>Book Meeting</span>
                </Button>
              )}
            </div>

            {consultations.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                <CardContent className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {isAdvisory
                        ? "You haven't scheduled an advisory meeting yet."
                        : "You don't have any consultation records."}
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {isAdvisory
                        ? 'Book your included monthly 1-on-1 strategy call with a Crediqly commercial credit advisor.'
                        : '1-on-1 monthly meetings are included in Crediqly Premium Advisory for tailored human guidance.'}
                    </p>
                  </div>
                  <div className="pt-2">
                    {isAdvisory ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setShowForm(true)}
                        className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Book Your Monthly Meeting ($0)</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push('/advisory')}
                        className="text-xs gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Explore Premium Advisory</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {consultations.map((item) => {
                  const details = getConsultationStatusDetails(item.status);
                  const isConfirmedOrRescheduled =
                    item.status === 'Confirmed' || item.status === 'Rescheduled';
                  const canCancel =
                    item.status === 'Requested' || item.status === 'Rescheduled';

                  return (
                    <Card
                      key={item.id}
                      className="border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-xs overflow-hidden"
                    >
                      <CardContent className="p-5 sm:p-6 space-y-4">
                        {/* Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                                {item.consultationType}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Submitted {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mt-1">
                              {item.consultationType} Advisory Session
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                            {getStatusBadge(item.status)}
                            {getPaymentBadge(item.paymentStatus, item.paymentAmount, item.consultationType)}
                          </div>
                        </div>

                        {/* Status Description Banner */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                          <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-800">
                              Consultation Status: {item.status} —{' '}
                            </span>
                            <span>{details.description}</span>
                          </div>
                        </div>

                        {/* Timing Section: Requested vs Confirmed */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Preferred / Requested Date */}
                          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Requested</span>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-slate-900">
                              {new Date(item.preferredDate + 'T00:00:00').toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}{' '}
                              — {item.preferredTime}
                            </p>
                          </div>

                          {/* Confirmed Date (if available) */}
                          <div
                            className={`p-3.5 rounded-xl border space-y-1 ${
                              isConfirmedOrRescheduled && item.confirmedDate
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                : 'bg-slate-50 border-slate-100 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-medium">
                              <CalendarCheck
                                className={`w-3.5 h-3.5 ${
                                  isConfirmedOrRescheduled && item.confirmedDate
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
                                }`}
                              />
                              <span
                                className={
                                  isConfirmedOrRescheduled && item.confirmedDate
                                    ? 'text-emerald-700 font-semibold'
                                    : 'text-slate-500'
                                }
                              >
                                Confirmed
                              </span>
                            </div>
                            {isConfirmedOrRescheduled && item.confirmedDate ? (
                              <p className="text-xs sm:text-sm font-black text-emerald-900">
                                {new Date(item.confirmedDate + 'T00:00:00').toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}{' '}
                                — {item.confirmedTime || item.preferredTime}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500 italic">
                                Pending admin scheduling
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Customer Message (if provided) */}
                        {item.customerMessage && (
                          <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                            <span className="font-semibold text-slate-700">Your Notes: </span>
                            <span className="italic">&ldquo;{item.customerMessage}&rdquo;</span>
                          </div>
                        )}

                        {/* Admin Message / Instructions (if provided) */}
                        {item.adminMessage && (
                          <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/80 text-xs text-brand-900 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-brand-800">
                              <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                              <span>Message from Crediqly Team</span>
                            </div>
                            <p className="leading-relaxed pl-5">{item.adminMessage}</p>
                          </div>
                        )}

                        {/* Footer & Cancellation Action */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-400">
                          <span>
                            Last updated {new Date(item.updatedAt).toLocaleDateString()}
                          </span>

                          <div className="flex items-center gap-2">
                            {canCancel && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCancellingId(item.id);
                                  setCancelModalOpen(true);
                                }}
                                className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Ban className="w-3.5 h-3.5 mr-1" />
                                <span>Cancel Request</span>
                              </Button>
                            )}

                            {item.status === 'Confirmed' && (
                              <span className="text-[11px] text-slate-500 italic">
                                Need to reschedule? Please reply to your confirmation message.
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* CANCELLATION CONFIRMATION MODAL */}
          {cancelModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="text-base font-bold text-slate-900">Cancel Consultation Request?</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to cancel this consultation request? Your request will be marked as cancelled in your history, and you can submit a new request anytime.
                </p>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCancelModalOpen(false);
                      setCancellingId(null);
                    }}
                    className="text-xs"
                  >
                    Keep Request
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmCancel}
                    disabled={cancelLoading}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs"
                  >
                    {cancelLoading ? 'Cancelling...' : 'Yes, Cancel Request'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Statutory Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>Consultation Disclaimer</span>
            </div>
            <p>
              Consultations provide educational and strategic guidance. Crediqly does not guarantee credit score increases, loan approval, or funding. Crediqly is not a bank, lender, credit bureau, or underwriting agency.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function ConsultationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <LoadingState message="Loading consultations..." />
        </div>
      }
    >
      <ConsultationInner />
    </Suspense>
  );
}
