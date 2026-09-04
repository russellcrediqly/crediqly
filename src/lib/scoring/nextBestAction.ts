import { BusinessProfile, NextBestActionItem } from '@/types/business';

/**
 * Determines the single highest-priority Next Best Action based on the business profile.
 */
export function getNextBestAction(profile: Partial<BusinessProfile> | null): NextBestActionItem {
  if (!profile) {
    return {
      id: 'complete-profile',
      title: 'Complete your business profile',
      explanation: 'Answer a few simple questions so Crediqly can generate your personalized roadmap.',
      actionLabel: 'Complete Profile',
      actionHref: '/onboarding',
    };
  }

  // 1. EIN Check
  if (profile.hasEIN !== 'yes') {
    return {
      id: 'ein',
      title: 'Establish your EIN',
      explanation:
        'An Employer Identification Number (EIN) is the fundamental tax identifier needed to separate personal and commercial credit files.',
      actionLabel: 'View Next Step',
      actionHref: '/roadmap',
    };
  }

  // 2. Business Bank Account Check
  if (profile.hasBusinessBankAccount !== 'yes') {
    return {
      id: 'bank-account',
      title: 'Set up a dedicated business bank account',
      explanation:
        'A dedicated commercial bank account is required to prove revenue consistency, verify cash flow, and qualify for business lines.',
      actionLabel: 'View Next Step',
      actionHref: '/roadmap',
    };
  }

  // 3. Business Website Check
  if (profile.hasWebsite !== 'yes') {
    return {
      id: 'website',
      title: 'Set up your business website',
      explanation:
        'A commercial website provides public verification of your business legitimacy during vendor and lender credit checks.',
      actionLabel: 'View Next Step',
      actionHref: '/roadmap',
    };
  }

  // 4. Dedicated Phone Check
  if (profile.hasBusinessPhone !== 'yes') {
    return {
      id: 'phone',
      title: 'Set up a dedicated business phone',
      explanation:
        'Commercial credit bureaus verify directory-listed business phone numbers to prevent identity fraud and confirm legitimacy.',
      actionLabel: 'View Next Step',
      actionHref: '/roadmap',
    };
  }

  // 5. Professional Email Check
  if (profile.hasBusinessEmail !== 'yes') {
    return {
      id: 'email',
      title: 'Set up a professional business email',
      explanation:
        'A domain-branded business email (e.g., name@yourcompany.com) builds instant trust with tier-1 vendors and underwriters.',
      actionLabel: 'View Next Step',
      actionHref: '/roadmap',
    };
  }

  // 6. Business Credit Profile Check
  if (profile.hasBusinessCreditProfile !== 'yes') {
    return {
      id: 'credit-profile',
      title: 'Establish your business credit profile',
      explanation:
        'Begin opening initial vendor accounts (Tier 1 Net-30 suppliers) that register your company with major commercial credit bureaus.',
      actionLabel: 'View Next Step',
      actionHref: '/roadmap',
    };
  }

  // 7. Reporting Accounts Check
  if (profile.hasReportingAccounts !== 'yes') {
    return {
      id: 'reporting-accounts',
      title: 'Start building reporting business credit accounts',
      explanation:
        'Ensure the vendors you purchase supplies from regularly report payment history to Dun & Bradstreet, Experian, or Equifax.',
      actionLabel: 'View Next Step',
      actionHref: '/roadmap',
    };
  }

  // 8. Account Count Check (Low account count)
  const count = profile.businessCreditAccountCount;
  if (count === 'none' || count === '1' || count === '2-3' || count === 'not_sure' || !count) {
    return {
      id: 'more-accounts',
      title: 'Build more business credit history',
      explanation:
        'Underwriters look for 4–5 actively reporting trade lines to establish a dependable commercial credit rating.',
      actionLabel: 'View Next Step',
      actionHref: '/roadmap',
    };
  }

  // 9. All Core Foundation Items In Place
  return {
    id: 'review-progress',
    title: 'Review your credit-building progress',
    explanation:
      'Your business foundation is in great shape. Continue monitoring payment consistency and exploring expansion credit options.',
    actionLabel: 'View Next Step',
    actionHref: '/roadmap',
  };
}
