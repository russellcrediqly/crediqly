'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Send,
  Loader2,
  Bot,
  HelpCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  Zap,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSubscription } from '@/context/SubscriptionContext';
import {
  SafeCustomerAIContext,
  AIMentorResponse,
  CORE_AI_MENTOR_QUESTIONS,
  AIMentorQuickQuestion,
} from '@/types/aiMentor';

interface CrediqlyAIMentorCardProps {
  context: SafeCustomerAIContext;
  className?: string;
}

const FREE_QUESTION_LIMIT = 3;

export const CrediqlyAIMentorCard: React.FC<CrediqlyAIMentorCardProps> = ({
  context,
  className = '',
}) => {
  const { isPro, upgradeToPro } = useSubscription();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [response, setResponse] = useState<AIMentorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionsCount, setQuestionsCount] = useState<number>(0);

  const isLimitReached = !isPro && questionsCount >= FREE_QUESTION_LIMIT;
  const remainingQuestions = Math.max(0, FREE_QUESTION_LIMIT - questionsCount);
  const score = context.fundingReadinessScore || 0;

  // Dynamically tailor core question prompts to customer's exact data
  const dynamicQuestions = useMemo(() => {
    return CORE_AI_MENTOR_QUESTIONS.map((q) => {
      if (q.id === 'why_score') {
        return { ...q, label: `Why is my readiness score ${score}?`, prompt: `Why is my readiness score ${score}?` };
      }
      return q;
    });
  }, [score]);

  const filteredQuestions = useMemo(() => {
    if (activeCategory === 'all') return dynamicQuestions;
    return dynamicQuestions.filter((q) => q.category === activeCategory);
  }, [dynamicQuestions, activeCategory]);

  const handleAsk = async (queryText: string) => {
    if (isLimitReached) {
      return;
    }
    const trimmed = queryText.trim();
    if (!trimmed || loading) return;

    try {
      setLoading(true);
      setError(null);
      setActiveQuestion(trimmed);
      setQuestionsCount((prev) => prev + 1);

      const res = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          context,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: AIMentorResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      console.warn('AI Mentor request failed, using client fallback:', err);
      // Even if network fails completely, provide friendly deterministic response
      setResponse({
        answer: `Your readiness score is ${score}/100 in ${context.currentJourneyStage}. Based on your profile, focus on completing your highest-priority roadmap milestones to strengthen commercial bureau depth.`,
        nextStep: {
          label: 'View Recommendations',
          href: '/dashboard#next-actions',
          reason: 'Review priority action',
        },
        source: 'deterministic_fallback',
        disclaimer:
          'Educational Guidance: Crediqly AI Mentor provides educational insights based on self-reported profile metrics. It does not guarantee credit approval.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuestion('');
    setResponse(null);
    setActiveQuestion(null);
    setError(null);
  };

  return (
    <Card
      className={`border-indigo-200/90 bg-gradient-to-b from-indigo-50/40 via-white to-white shadow-2xs overflow-hidden rounded-3xl ${className}`}
      id="ai-mentor"
    >
      <CardContent className="p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Crediqly AI Advisor</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                ASK YOUR CREDIQLY MENTOR
              </span>
              {isPro ? (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  ⭐ Pro Unlimited Access
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Free Tier: {remainingQuestions} of {FREE_QUESTION_LIMIT} inquiries left
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Your Crediqly AI Advisor
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
              Personalized guidance based on your business profile and progress.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-indigo-50/60 px-3 py-1.5 rounded-xl border border-indigo-100 shrink-0">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold">Deterministic Immutability Active</span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        {!isLimitReached && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
              {[
                { id: 'all', label: 'All Questions' },
                { id: 'next_steps', label: 'Next Steps & Focus' },
                { id: 'tradelines_banking', label: 'Tradelines & Banking' },
                { id: 'funding_timing', label: 'Funding Readiness' },
                { id: 'credit_education', label: 'Credit Education' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                    activeCategory === tab.id
                      ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Questions Chips */}
            <div className="flex flex-wrap gap-2">
              {filteredQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setQuestion(q.prompt);
                    handleAsk(q.prompt);
                  }}
                  disabled={loading || isLimitReached}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all text-left flex items-center gap-2 ${
                    activeQuestion === q.prompt
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white hover:bg-indigo-50/80 text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 shrink-0 ${activeQuestion === q.prompt ? 'text-white' : 'text-indigo-500'}`} />
                  <span>&ldquo;{q.label}&rdquo;</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Input Form or ProGate Locked State */}
        {isLimitReached ? (
          <div className="p-6 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-brand-50/40 text-center space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-base font-black text-slate-900">
                Free Inquiries Completed
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upgrade to Crediqly Pro to unlock unlimited real-time inquiries, underwriting explanations, and direct funding preparation guidance.
              </p>
            </div>
            <div className="pt-1 flex items-center justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={upgradeToPro}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-xs"
              >
                <span>Upgrade to Pro — $39/mo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Link href="/pricing">
                <Button variant="outline" size="sm" className="text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-300">
                  Compare Plans
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(question);
            }}
            className="flex flex-col sm:flex-row items-stretch gap-2.5"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Or ask a custom question about your readiness, credit, or funding..."
                maxLength={400}
                disabled={loading}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 transition-all"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shrink-0 shadow-2xs transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Consulting Mentor...</span>
                </>
              ) : (
                <>
                  <span>Ask Mentor</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Mentor Response Area */}
        {response && (
          <div className="p-5 rounded-2xl bg-white border border-indigo-200/90 shadow-2xs space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Crediqly AI Mentor Guidance
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {response.source === 'ai_model' ? 'Verified Model' : 'Deterministic Rule Engine'}
                    </span>
                  </div>
                  <button
                    onClick={handleClear}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {response.answer}
                </p>
              </div>
            </div>

            {/* NEXT STEP Action Box */}
            {response.nextStep && (
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ml-0 sm:ml-12">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 block">
                    Recommended Next Step
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {response.nextStep.reason || 'Take action on your profile to progress'}
                  </span>
                </div>
                <Link href={response.nextStep.href} className="shrink-0">
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-2xs w-full sm:w-auto"
                  >
                    <span>{response.nextStep.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Compliance Disclaimer */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{response.disclaimer}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
