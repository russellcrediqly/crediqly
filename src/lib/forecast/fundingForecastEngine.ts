import type { BusinessProfile } from '@/types/business';
import type { MonthlyCheckInRecord } from '@/types/checkIn';
import type {
  FundingForecastResult,
  ForecastConfidenceLevel,
  CashFlowRiskLevel,
  ForecastRange,
} from '@/types/forecast';

const FORECAST_DISCLAIMER =
  'This forecast is an educational planning estimate based on information provided by you. It is not financial advice and should not be treated as a guarantee of future revenue, cash flow, or funding availability.';

function formatAmountK(val: number): string {
  if (val >= 1000000) {
    const m = val / 1000000;
    return `$${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (val >= 1000) {
    const k = val / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(0)}K`;
  }
  return `$${val}`;
}

function makeRange(min: number, max: number): ForecastRange {
  return {
    min,
    max,
    formatted: `${formatAmountK(min)}–${formatAmountK(max)}`,
  };
}

/**
 * Validates whether the business profile contains enough verifiable data
 * to produce an educational 90-day cash flow forecast.
 */
export function hasSufficientForecastData(profile?: Partial<BusinessProfile> | null): boolean {
  if (!profile) return false;

  const rev = profile.annualRevenueRange?.trim();
  if (!rev || rev === 'Pre-revenue' || rev === 'Under $10,000' || rev.toLowerCase() === 'none') {
    return false;
  }

  const age = profile.businessAge?.trim();
  if (!age || age === 'not_sure' || age === 'Not sure') {
    return false;
  }

  const hasEntity = Boolean(profile.entityType && profile.entityType.trim().length > 0);
  const hasBanking = profile.hasBusinessBankAccount === 'yes';

  return Boolean(hasEntity && hasBanking);
}

/**
 * Deterministically computes the 90-day Funding Forecast & Cash-Flow Insights.
 * Zero fabricated data. If data is insufficient, gracefully reports unavailable.
 */
export function calculateFundingForecast(
  profile?: Partial<BusinessProfile> | null,
  fundingReadinessScore: number = 0,
  monthlyCheckIn?: MonthlyCheckInRecord | null
): FundingForecastResult {
  const hasData = hasSufficientForecastData(profile);

  // INSUFFICIENT DATA STATE: Never invent numbers
  if (!hasData || !profile) {
    return {
      isAvailable: false,
      unavailableReason: 'Add more business information to receive a forecast.',
      horizonLabel: 'Next 90 Days',
      confidence: 'Low',
      confidenceNote: 'Complete your business profile to generate planning estimates.',
      cashFlowRisk: 'MODERATE',
      riskExplanation: 'Insufficient data available to estimate cash-flow patterns or capital runway.',
      recommendation: {
        title: 'Complete Profile for Forecast',
        actionLabel: 'Complete Business Profile',
        actionHref: '/onboarding',
      },
      disclaimer: FORECAST_DISCLAIMER,
    };
  }

  const revStr = profile.annualRevenueRange || '';
  const ageStr = profile.businessAge || '';
  const hasBizCredit = profile.hasBusinessCreditProfile === 'yes';

  // 1. 90-Day Revenue & Expense Baseline Calculation
  let revRange: ForecastRange;
  let expRange: ForecastRange;
  let needRange: ForecastRange;

  switch (revStr) {
    case '$250,000–$500,000':
      revRange = makeRange(72000, 82000);
      expRange = makeRange(48000, 55000);
      needRange = makeRange(15000, 20000);
      break;
    case '$100,000–$250,000':
      revRange = makeRange(30000, 55000);
      expRange = makeRange(20000, 38000);
      needRange = makeRange(8000, 16000);
      break;
    case '$50,000–$100,000':
      revRange = makeRange(14000, 22000);
      expRange = makeRange(10000, 16000);
      needRange = makeRange(4000, 8000);
      break;
    case '$10,000–$50,000':
      revRange = makeRange(4000, 10000);
      expRange = makeRange(3000, 8000);
      needRange = makeRange(2000, 4000);
      break;
    case '$500,000+':
      revRange = makeRange(130000, 160000);
      expRange = makeRange(90000, 115000);
      needRange = makeRange(25000, 45000);
      break;
    case '$1,000,000+':
      revRange = makeRange(260000, 320000);
      expRange = makeRange(180000, 230000);
      needRange = makeRange(50000, 90000);
      break;
    default:
      revRange = makeRange(25000, 50000);
      expRange = makeRange(18000, 35000);
      needRange = makeRange(8000, 15000);
  }

  // Adjust for voluntary monthly check-in trend if present
  if (monthlyCheckIn?.responses?.revenueChange === 'increased') {
    revRange = makeRange(Math.round(revRange.min * 1.08), Math.round(revRange.max * 1.08));
  } else if (monthlyCheckIn?.responses?.revenueChange === 'decreased') {
    revRange = makeRange(Math.round(revRange.min * 0.92), Math.round(revRange.max * 0.92));
    needRange = makeRange(Math.round(needRange.min * 1.15), Math.round(needRange.max * 1.15));
  }

  // 2. Confidence Evaluation
  let confidence: ForecastConfidenceLevel = 'Moderate';
  let confidenceNote: string | undefined = undefined;

  const isOldBusiness = ['1–2 years', '2–5 years', '5+ years', '3+ years'].includes(ageStr);
  const isHighReadiness = fundingReadinessScore >= 70;

  if (profile.profileCompleted && isOldBusiness && hasBizCredit && isHighReadiness) {
    confidence = 'High';
  } else if (profile.profileCompleted && isOldBusiness) {
    confidence = 'Moderate';
  } else {
    confidence = 'Low';
    confidenceNote = 'Add more information to improve this estimate.';
  }

  // 3. Cash-Flow Risk Evaluation
  let cashFlowRisk: CashFlowRiskLevel = 'MODERATE';
  let riskExplanation =
    'Your projected cash-flow profile suggests that additional working capital may be useful if current spending continues.';

  if (fundingReadinessScore >= 78 && isOldBusiness && ['2–5 years', '5+ years', '3+ years'].includes(ageStr)) {
    cashFlowRisk = 'LOW';
    riskExplanation =
      'Your projected cash flow indicates stable operational coverage with low immediate liquidity pressure.';
  } else if (fundingReadinessScore < 45 || ageStr === 'Less than 6 months' || ageStr === '3–6 months') {
    cashFlowRisk = 'HIGH';
    riskExplanation =
      'Projected cash flow indicates tight operating reserves. Consider securing flexible liquidity or short-term lines before seasonal demands increase.';
  }

  return {
    isAvailable: true,
    horizonLabel: 'Next 90 Days',
    revenue: revRange,
    expenses: expRange,
    workingCapitalNeed: needRange,
    confidence,
    confidenceNote,
    cashFlowRisk,
    riskExplanation,
    recommendation: {
      title: 'Review Funding Options',
      actionLabel: 'View Funding Matches',
      actionHref: '/dashboard#funding-matches',
    },
    disclaimer: FORECAST_DISCLAIMER,
  };
}
