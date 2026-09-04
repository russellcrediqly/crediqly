'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from './Button';

export interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  userName = '',
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('Building First Business Credit Tier');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Consultation Requested!</h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              A Crediqly business credit specialist will review your profile and reach out via email within 1 business day to confirm your consultation schedule.
            </p>
            <div className="pt-2">
              <Button onClick={handleClose} variant="primary" className="w-full">
                Return to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Book a Credit & Funding Consultation
                </h3>
                <p className="text-xs text-slate-500">
                  1-on-1 guidance with a business credit advisor
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Focus Area
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
                >
                  <option value="Building First Business Credit Tier">
                    Establishing Business Credit Foundation (Tier 1)
                  </option>
                  <option value="Separating Personal & Business Credit">
                    Separating Personal and Business Credit
                  </option>
                  <option value="Preparing for Working Capital or Term Loans">
                    Preparing for Working Capital or Term Loans
                  </option>
                  <option value="Reviewing Readiness Checklist">
                    Reviewing Business Readiness Checklist
                  </option>
                </select>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 border border-slate-200/70">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <Clock className="w-4 h-4 text-brand-600" />
                  30-Minute Phone / Video Session
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Confidential & No Sensitive Information Required
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={loading}>
                  Confirm Request
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
