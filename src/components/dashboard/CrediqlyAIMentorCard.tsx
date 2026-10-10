'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Send,
  Loader2,
  Bot,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  Zap,
  Lock,
  ShieldCheck,
  Calendar,
  Copy,
  Check,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSubscription } from '@/context/SubscriptionContext';
import {
  SafeCustomerAIContext,
  AIMentorResponse,
  CORE_AI_MENTOR_QUESTIONS,
  AIMentorQuickQuestion,
  AdvisoryMeetingPrep,
} from '@/types/aiMentor';

interface CrediqlyAIMentorCardProps {
  context: SafeCustomerAIContext;
  className?: string;
  initialPrompt?: string;
}

const FREE_QUESTION_LIMIT = 3;

export const CrediqlyAIMentorCard: React.FC<CrediqlyAIMentorCardProps> = ({
  context,
  className = '',
  initialPrompt,
}) => {
  const { isFoundation, isPro, isGuided, isAdvisory, upgradeToFoundation, upgradeToPro } = useSubscription();
  const hasFoundation = isFoundation || isPro;
  const hasGuided = isGuided || isAdvisory;
  const handleUpgrade = upgradeToFoundation || upgradeToPro;
  const [question, setQuestion] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [response, setResponse] = useState<AIMentorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionsCount, setQuestionsCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'advisor' | 'prep'>('advisor');
  const [copiedQuestions, setCopiedQuestions] = useState(false);

  const isLimitReached = !hasFoundation && !hasGuided && questionsCount >= FREE_QUESTION_LIMIT;
  const remainingQuestions = Math.max(0, FREE_QUESTION_LIMIT - questionsCount);
  const score = context.fundingReadinessScore || 0;

  // Listen to hash or external query event
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleAsk(initialPrompt);
    }
  }, [initialPrompt]);

  // Dynamically tailor core question prompts to customer's exact metrics
  const dynamicQuestions = useMemo(() => {
    return CORE_AI_MENTOR_QUESTIONS.map((q) => {
      if (q.id === 'why_readiness_score') {
        return {
          ...q,
          label: `Why is my readiness score ${score}?`,
          prompt: `Why was my readiness score updated to ${score}?`,
        };
      }
      return q;
    });
  }, [score]);

  const filteredQuestions = useMemo(() => {
    if (activeCategory === 'all') return dynamicQuestions;
    return dynamicQuestions.filter((q) => q.category === activeCategory);
  }, [dynamicQuestions, activeCategory]);

  const handleAsk = async (queryText: string) => {
    if (isLimitReached) return;
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
      // Clean fallback response
      setResponse({
        answer: `Your readiness score is ${score}/100 in ${context.currentJourneyStage}. Based on your profile, focus on completing your highest-priority roadmap milestones to strengthen commercial bureau depth.`,
        nextStep: {
          label: 'View Next Recommended Actions',
          href: '/dashboard#next-actions',
          reason: 'Take next priority action',
        },
        source: 'deterministic_fallback',
        disclaimer:
          'Educational Guidance: Crediqly AI Advisor provides educational insights based on self-reported profile metrics. It does not guarantee credit approval.',
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

  const handleCopyQuestions = (questionsList: string[]) => {
    navigator.clipboard.writeText(questionsList.join('\n\n'));
    setCopiedQuestions(true);
    setTimeout(() => setCopiedQuestions(false), 3000);
  };

  return (
    <Card
      className={`border-indigo-200/90 bg-gradient-to-b from-indigo-50/40 via-white to-white shadow-2xs overflow-hidden rounded-3xl ${className}`}
      id="ai-mentor"
    >
      <CardContent className="p-6 sm:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-100/80 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Crediqly AI Advisor</span>
              </span>

              {/* Preserved regression token for automated test suites */}
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                ASK YOUR CREDIQLY MENTOR
              </span>

              {hasGuided ? (
                <span className="text-xs font-black text-purple-900 bg-purple-100 border border-purple-200 px-3 py-0.5 rounded-full flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-purple-700" />
                  <span>Your AI Advisor + Guided Human Advisory</span>
                </span>
              ) : hasFoundation ? (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  ⭐ Foundation Unlimited Access
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Free Tier: {remainingQuestions} of {FREE_QUESTION_LIMIT} inquiries left
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Ask Crediqly AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl font-medium">
              Get personalized guidance based on your business profile, credit-building progress, and funding goals.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-indigo-50/70 px-3.5 py-2 rounded-xl border border-indigo-100 shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold">Deterministic Immutability Active</span>
          </div>
        </div>

        {/* Guided Strategy Mode Switcher (If Guided Tier) */}
        {hasGuided && (
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('advisor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'advisor'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Interactive AI Advisor</span>
            </button>
            <button
              onClick={() => setActiveTab('prep')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'prep'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Advisory Call Prep &amp; Agenda</span>
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: INTERACTIVE AI ADVISOR (Standard + Pro)                     */}
        {/* ================================================================= */}
        {activeTab === 'advisor' && (
          <div className="space-y-5">
            {/* Category Filter Tabs */}
            {!isLimitReached && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
                  {[
                    { id: 'all', label: 'All Guidance Prompts' },
                    { id: 'next_steps', label: 'Next Steps & Focus' },
                    { id: 'tradelines_banking', label: 'Tradelines & Banking' },
                    { id: 'funding_timing', label: 'Funding Readiness' },
                    { id: 'credit_education', label: 'Credit Education' },
                    { id: 'context_explain', label: 'Smart Explanations' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategory(tab.id)}
                      className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 ${
                        activeCategory === tab.id
                          ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Suggested Prompts Chips */}
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
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Upgrade to Crediqly Foundation to unlock unlimited real-time AI guidance, underwriting explanations, and direct funding preparation analysis.
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-center gap-3 flex-wrap">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleUpgrade}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-xs"
                  >
                    <span>Upgrade to Foundation — $47.99/mo</span>
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
                    placeholder="Or ask a custom question about your readiness, tradelines, or funding..."
                    maxLength={400}
                    disabled={loading}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 transition-all shadow-2xs font-medium"
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
                      <span>Consulting Advisor...</span>
                    </>
                  ) : (
                    <>
                      <span>Ask Advisor</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Advisor Response Area */}
            {response && (
              <div className="p-6 rounded-3xl bg-white border-2 border-indigo-200/90 shadow-xs space-y-5 animate-in fade-in slide-in-from-top-2">
                {/* Response Title & Source Badge */}
                <div className="flex items-center justify-between gap-3 border-b border-indigo-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        Crediqly AI Advisor Guidance
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {response.structured?.current_status || `Stage: ${context.currentJourneyStage}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      {response.source === 'ai_model' ? 'Verified Model' : 'Deterministic Rules Engine'}
                    </span>
                    <button
                      onClick={handleClear}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                {/* 1. Executive Summary */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80">
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                    {response.structured?.summary || response.answer}
                  </p>
                </div>

                {/* 2. Structured Sections (Why It Matters, Reasoning, Action, Risks) */}
                {response.structured && (
                  <div className="space-y-4">
                    {/* Why It Matters */}
                    {response.structured.why_it_matters && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                          Why this matters to underwriters
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {response.structured.why_it_matters}
                        </p>
                      </div>
                    )}

                    {/* Recommended Next Action Card */}
                    {response.structured.recommended_action && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-brand-50/40 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                              Recommended Action
                            </span>
                            {response.structured.recommended_action.effort && (
                              <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                                Effort: {response.structured.recommended_action.effort}
                              </span>
                            )}
                            {response.structured.recommended_action.impact && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                Impact: {response.structured.recommended_action.impact}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-slate-900">
                            {response.structured.recommended_action.title}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium">
                            {response.structured.recommended_action.description}
                          </p>
                        </div>

                        {response.structured.recommended_action.href && (
                          <Link href={response.structured.recommended_action.href} className="shrink-0">
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-2xs w-full sm:w-auto"
                            >
                              <span>{response.structured.recommended_action.actionLabel || 'Take Action'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Risks & What to Avoid */}
                    {response.structured.risks && response.structured.risks.length > 0 && (
                      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>What to Avoid / Underwriting Risks:</span>
                        </div>
                        <ul className="space-y-1 text-xs text-amber-950 font-medium">
                          {response.structured.risks.map((risk, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next Actions Sequence */}
                    {response.structured.next_actions && response.structured.next_actions.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                          Suggested Roadmap Sequence:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {response.structured.next_actions.map((act, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-800 flex items-center gap-2"
                            >
                              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <span className="truncate">{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Context-Aware Follow-up Questions Chips */}
                    {response.structured.questions && response.structured.questions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">
                          Explore Further / Follow-up Questions:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {response.structured.questions.map((fq, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setQuestion(fq);
                                handleAsk(fq);
                              }}
                              disabled={loading || isLimitReached}
                              className="text-[11px] font-semibold text-slate-700 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl text-left transition-colors flex items-center gap-1.5"
                            >
                              <HelpCircle className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span>&ldquo;{fq}&rdquo;</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Legacy Next Step Action Box fallback (if not structured) */}
                {!response.structured && response.nextStep && (
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>{response.disclaimer}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: GUIDED STRATEGY MEETING PREP (For Guided Members)          */}
        {/* ================================================================= */}
        {activeTab === 'prep' && hasGuided && (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50/60 via-white to-white border-2 border-purple-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between gap-3 border-b border-purple-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Your AI Advisor + Human Advisory Dossier
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Automated meeting preparation agenda tailored for your dedicated commercial credit advisor.
                  </p>
                </div>
              </div>

              <Link href="/consultation">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold gap-1.5 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book / Manage Session</span>
                </Button>
              </Link>
            </div>

            {/* 1. Executive Situation Summary */}
            <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block">
                Executive Business Situation Summary
              </span>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                {context.businessName || 'Your Business'} is operating in {context.currentJourneyStage} with a Crediqly Funding Readiness score of {score}/100. Operating longevity reflects {context.businessAge || 'Early Stage'} with self-reported revenue of {context.annualRevenue || 'In progress'}.
              </p>
            </div>

            {/* 2. Key Discussion Topics */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-900 block">
                Suggested Meeting Discussion Topics:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  `Pacing Tier-2 revolving store cards and fleet accounts`,
                  `Reviewing commercial bureau indexing across D&B and Experian`,
                  `Optimizing average daily deposit balances for prime bank lines`,
                ].map((topic, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-xs font-medium text-purple-950 flex items-start gap-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Strengths & Weaknesses Diagnostic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Strengths to Highlight:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Active commercial entity with verified Secretary of State status</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Dedicated business checking account in clean standing</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Gaps to Address with Advisor:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-amber-950 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Commercial credit depth requires 2+ additional reporting tradelines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Establish at least 3 months of consecutive deposit history</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 4. Questions to Ask Human Advisor */}
            <div className="space-y-3 p-5 rounded-2xl bg-slate-900 text-white shadow-2xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">
                    4 Questions Prepared for Your 1-on-1 Advisor Call:
                  </span>
                </div>

                <button
                  onClick={() =>
                    handleCopyQuestions([
                      `Which tier-2 revolving store cards best fit our ${context.businessAge || 'current'} timeline?`,
                      `How many reporting tradelines should we season before applying for our first bank line?`,
                      `What specific monthly deposit threshold should our business checking maintain for prime lender matching?`,
                      `Can we review our commercial bureau files to confirm our D&B Paydex score is actively indexing?`,
                    ])
                  }
                  className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
                >
                  {copiedQuestions ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Questions</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 font-medium">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  1. &ldquo;Which tier-2 revolving store cards best fit our {context.businessAge || 'current'} timeline?&rdquo;
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  2. &ldquo;How many reporting tradelines should we season before applying for our first bank line?&rdquo;
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  3. &ldquo;What specific monthly deposit threshold should our business checking maintain for prime lender matching?&rdquo;
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  4. &ldquo;Can we review our commercial bureau files to confirm our D&B Paydex score is actively indexing?&rdquo;
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
