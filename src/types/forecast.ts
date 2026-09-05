export type ForecastConfidenceLevel = 'High' | 'Moderate' | 'Low';
export type CashFlowRiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface ForecastRange {
  min: number;
  max: number;
  formatted: string; // e.g. "$72K–$82K"
}

export interface FundingForecastResult {
  isAvailable: boolean;
  unavailableReason?: string;
  horizonLabel: string; // e.g. "Next 90 Days"
  revenue?: ForecastRange;
  expenses?: ForecastRange;
  workingCapitalNeed?: ForecastRange;
  confidence: ForecastConfidenceLevel;
  confidenceNote?: string;
  cashFlowRisk: CashFlowRiskLevel;
  riskExplanation: string;
  recommendation: {
    title: string;
    actionLabel: string;
    actionHref: string;
  };
  disclaimer: string;
}
