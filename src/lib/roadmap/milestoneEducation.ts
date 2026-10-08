/**
 * Milestone Micro-Education Registry & Guided Journey Knowledge Base
 *
 * Provides concise, actionable micro-education for every Crediqly milestone:
 * - What it is
 * - Why it matters
 * - What to do
 * - What to avoid
 * - When to move forward
 * - Pre-formatted prompt for AI Advisor
 * - Verification status (System verified vs Customer confirmed)
 * - Prerequisite dependencies
 */

export interface MilestoneEducation {
  id: string;
  title: string;
  stageId: number; // 1 to 5
  stageName: 'ESTABLISH' | 'BUILD' | 'STRENGTHEN' | 'FUNDING READY' | 'SCALE';
  categoryLabel: string;
  stepOrder: number;
  weight: number;
  whatItIs: string;
  whyItMatters: string;
  whatToDo: string[];
  whatToAvoid: string[];
  whenToMoveForward: string;
  estimatedEffort: string;
  potentialImpact: 'Critical' | 'High' | 'Medium';
  completionType: 'system_verified' | 'customer_confirmation';
  verificationExplanation: string;
  prerequisiteId?: string;
  prerequisiteTitle?: string;
  askAiPrompt: string;
  recommendedProductsCategory?: 'business_banking' | 'net_30' | 'business_credit_cards' | 'credit_monitoring';
  actionLabel: string;
  actionHref: string;
  roadmapTaskKey?: string;
}

export interface StageProgramOverview {
  stageId: number;
  stageName: 'ESTABLISH' | 'BUILD' | 'STRENGTHEN' | 'FUNDING READY' | 'SCALE';
  title: string;
  subtitle: string;
  explanation: string;
  objective: string;
  biggestOpportunity: string;
  recommendedProductsCategory?: 'business_banking' | 'net_30' | 'business_credit_cards';
  recommendedProductsTitle?: string;
  fundingTransitionNotice?: string;
}

export const STAGE_PROGRAM_OVERVIEWS: Record<number, StageProgramOverview> = {
  1: {
    stageId: 1,
    stageName: 'ESTABLISH',
    title: 'Establish',
    subtitle: 'Business Foundation & Operational Separation',
    explanation:
      'Form your distinct legal business entity, secure your Federal EIN, and establish a dedicated commercial checking account. This separates personal liability and sets up your business as an independent borrower.',
    objective:
      'Create 100% legal, financial, and digital separation between business operations and personal assets.',
    biggestOpportunity:
      'Open a dedicated commercial checking account and route all incoming business revenue through it to establish verified cash-flow banking history.',
    recommendedProductsCategory: 'business_banking',
    recommendedProductsTitle: 'Commercial Checking Accounts',
  },
  2: {
    stageId: 2,
    stageName: 'BUILD',
    title: 'Build',
    subtitle: 'Bureau Awareness & Tier-1 Tradeline Establishment',
    explanation:
      'Register your business with Dun & Bradstreet, Experian Commercial, and Equifax Business. Open initial Tier-1 Net-30 vendor accounts that report monthly payments to establish your first commercial credit scores.',
    objective:
      'Establish active bureau trade files and generate a proven track record of early invoice repayment.',
    biggestOpportunity:
      'Open 2 to 3 Tier-1 Net-30 vendor tradelines and pay invoices 10–15 days before the due date to establish an 80+ Paydex score.',
    recommendedProductsCategory: 'net_30',
    recommendedProductsTitle: 'Tier-1 Net-30 Vendor Tradelines',
  },
  3: {
    stageId: 3,
    stageName: 'STRENGTHEN',
    title: 'Strengthen',
    subtitle: 'Revolving Credit, Trade Depth & Utilization Discipline',
    explanation:
      'Graduate from Net-30 vendor invoices to revolving commercial credit cards and Tier-2 store credit. Keep credit utilization below 30% and monitor reports across all three major commercial bureaus.',
    objective:
      'Deepen commercial credit thickness to 4+ reporting tradelines while keeping credit utilization conservative.',
    biggestOpportunity:
      'Establish a revolving business credit card or Tier-2 store account and keep revolving balances under 30% of total credit limits.',
    recommendedProductsCategory: 'business_credit_cards',
    recommendedProductsTitle: 'Revolving Business Credit Cards & Fleet Accounts',
  },
  4: {
    stageId: 4,
    stageName: 'FUNDING READY',
    title: 'Funding Ready',
    subtitle: 'Underwriting Preparation & Document Verification',
    explanation:
      'Align your revenue records, operating longevity, bank statements, and target funding amount with institutional underwriting criteria before submitting formal loan or credit line requests.',
    objective:
      'Assemble a comprehensive, verified funding readiness package and reach a 70+ funding readiness score.',
    biggestOpportunity:
      'Assemble 3 to 6 months of uninterrupted commercial bank statements and define your specific capital use plan.',
    fundingTransitionNotice:
      'You may now have a stronger profile to explore funding options. Let’s review matches before you apply.',
  },
  5: {
    stageId: 5,
    stageName: 'SCALE',
    title: 'Scale',
    subtitle: 'Capital Acquisition & Multi-Facility Growth',
    explanation:
      'Compare matched financing options, review terms and interest structures, apply for pre-screened credit lines or term loans, and manage multiple financing facilities to accelerate revenue growth.',
    objective:
      'Acquire non-dilutive commercial capital, manage payment schedules smoothly, and scale business operations.',
    biggestOpportunity:
      'Review your matched commercial funding categories and compare low-cost credit lines against growth initiatives.',
    fundingTransitionNotice:
      'Congratulations on reaching advanced readiness. Compare pre-screened lending facilities and apply strategically.',
  },
};

export const MILESTONE_EDUCATION_REGISTRY: Record<string, MilestoneEducation> = {
  m_profile_entity: {
    id: 'm_profile_entity',
    title: 'Formal Legal Business Entity',
    stageId: 1,
    stageName: 'ESTABLISH',
    categoryLabel: 'Foundation & Entity',
    stepOrder: 1,
    weight: 5,
    whatItIs:
      'A formal state-registered business entity (such as an LLC, S-Corporation, or C-Corporation) organized through your Secretary of State.',
    whyItMatters:
      'Commercial lenders, banks, and major credit bureaus will not issue true corporate credit to sole proprietorships without full personal liability. A registered entity separates you from your business.',
    whatToDo: [
      'Choose a compliant legal structure (LLC or Corporation) with your state Secretary of State.',
      'File your Articles of Organization or Certificate of Incorporation.',
      'Maintain an active status and good standing with annual state filings.',
    ],
    whatToAvoid: [
      'Do not operate as a sole proprietorship if you intend to build standalone business credit.',
      'Do not allow state annual reports to lapse, which causes an "inactive" or "dissolved" flag.',
    ],
    whenToMoveForward:
      'When your Secretary of State confirmation number and certificate of good standing are received.',
    estimatedEffort: '1–3 business days',
    potentialImpact: 'Critical',
    completionType: 'system_verified',
    verificationExplanation:
      'System verified: Matched against your business profile entity structure and state registration records.',
    askAiPrompt: 'Why is an LLC or Corporation required instead of a sole proprietorship for business credit?',
    actionLabel: 'Complete Entity Details',
    actionHref: '/business',
    roadmapTaskKey: 'task_entity',
  },

  m_ein: {
    id: 'm_ein',
    title: 'Federal Employer ID (EIN)',
    stageId: 1,
    stageName: 'ESTABLISH',
    categoryLabel: 'Foundation & Entity',
    stepOrder: 2,
    weight: 5,
    prerequisiteId: 'm_profile_entity',
    prerequisiteTitle: 'Formal Legal Business Entity',
    whatItIs:
      'A 9-digit Federal Employer Identification Number issued free by the Internal Revenue Service (IRS).',
    whyItMatters:
      'An EIN functions as your company’s commercial Social Security Number. All business credit bureau files (D&B, Experian Business, Equifax) and commercial bank accounts are anchored to this number.',
    whatToDo: [
      'Apply online directly on the official IRS.gov website (completely free).',
      'Download and store your official IRS CP-575 confirmation notice.',
      'Verify that the business name and address exactly match your state registration.',
    ],
    whatToAvoid: [
      'Do not pay third-party services that charge $50–$300 to obtain an EIN; the IRS provides it free.',
      'Do not use your personal SSN in place of an EIN on commercial applications.',
    ],
    whenToMoveForward:
      'When you receive your official IRS CP-575 EIN letter and confirm the 9-digit tax ID.',
    estimatedEffort: '15 minutes',
    potentialImpact: 'Critical',
    completionType: 'system_verified',
    verificationExplanation:
      'System verified: Verified via profile Federal Tax ID records.',
    askAiPrompt: 'How does an EIN anchor my business credit file across Dun & Bradstreet and Experian?',
    actionLabel: 'Verify Federal EIN',
    actionHref: '/business',
    roadmapTaskKey: 'task_ein',
  },

  m_business_bank: {
    id: 'm_business_bank',
    title: 'Dedicated Business Checking Account',
    stageId: 1,
    stageName: 'ESTABLISH',
    categoryLabel: 'Foundation & Entity',
    stepOrder: 3,
    weight: 5,
    prerequisiteId: 'm_ein',
    prerequisiteTitle: 'Federal Employer ID (EIN)',
    whatItIs:
      'An independent commercial checking account opened strictly under your legal entity name and EIN.',
    whyItMatters:
      'Underwriters inspect 3–6 months of business bank statements to verify revenue consistency, average daily balance, and clean deposit history. Commingling personal and business funds can disqualify applications.',
    whatToDo: [
      'Open a commercial checking account using your Articles of Organization and CP-575 EIN letter.',
      'Deposit all business income directly into this account.',
      'Pay all vendor bills, subscriptions, and company expenses exclusively from this account.',
    ],
    whatToAvoid: [
      'Never pay personal groceries, rent, or personal bills directly out of your commercial account.',
      'Never allow the account to experience overdrafts (NSF fees), which trigger red flags with lenders.',
    ],
    whenToMoveForward:
      'When your commercial checking account is active and receiving business revenue deposits.',
    estimatedEffort: '1–2 business days',
    potentialImpact: 'Critical',
    completionType: 'system_verified',
    verificationExplanation:
      'System verified: Linked to your verified commercial checking status and banking profile.',
    askAiPrompt: 'What do lenders look for on 3 months of business bank statements?',
    recommendedProductsCategory: 'business_banking',
    actionLabel: 'Explore Business Banking',
    actionHref: '/products?category=business_banking',
    roadmapTaskKey: 'task_business_bank',
  },

  m_commercial_presence: {
    id: 'm_commercial_presence',
    title: 'Commercial Digital Presence',
    stageId: 1,
    stageName: 'ESTABLISH',
    categoryLabel: 'Foundation & Entity',
    stepOrder: 4,
    weight: 5,
    whatItIs:
      'A dedicated business website, professional domain-based email address (e.g. name@yourcompany.com), and dedicated commercial telephone number.',
    whyItMatters:
      'Automated lender verification algorithms scrape online directories and domain records. Free email providers (@gmail.com, @yahoo.com) and missing websites trigger fraud checks or lower tier scores.',
    whatToDo: [
      'Register a custom domain matching your legal or DBA name.',
      'Set up a company email address (e.g. hello@yourbrand.com or billing@yourbrand.com).',
      'Publish a functional website with contact information, privacy policy, and services.',
      'Obtain a dedicated business phone line with a professional greeting.',
    ],
    whatToAvoid: [
      'Avoid using personal cell numbers as your public business contact.',
      'Avoid using generic webmail (@gmail.com) for vendor credit applications.',
    ],
    whenToMoveForward:
      'When your business domain email is active and your public website is live.',
    estimatedEffort: '1–2 hours',
    potentialImpact: 'Medium',
    completionType: 'system_verified',
    verificationExplanation:
      'System verified: Verified via profile digital presence and domain email settings.',
    askAiPrompt: 'Why do business credit bureaus check for domain emails and websites?',
    actionLabel: 'Update Presence Details',
    actionHref: '/business',
    roadmapTaskKey: 'rec_commercial_presence',
  },

  m_commercial_address: {
    id: 'm_commercial_address',
    title: 'Commercial Address & Compliance',
    stageId: 1,
    stageName: 'ESTABLISH',
    categoryLabel: 'Foundation & Entity',
    stepOrder: 5,
    weight: 5,
    whatItIs:
      'A verifiable physical commercial office, executive suite, or registered agent address, along with any necessary local or industry licenses.',
    whyItMatters:
      'Lenders and credit bureaus check USPS address standardization databases. P.O. Boxes and certain residential addresses can trigger underwriting flags for high-tier loans.',
    whatToDo: [
      'Use a physical commercial street address or legitimate commercial virtual office suite.',
      'Ensure the exact same address appears across state filings, IRS records, bank statements, and 411 directories.',
      'Obtain required city or state operational licenses.',
    ],
    whatToAvoid: [
      'Never list a USPS P.O. Box as your primary legal headquarters.',
      'Do not allow discrepancies in suite numbers across different documents.',
    ],
    whenToMoveForward:
      'When your address is consistent across all state and commercial accounts.',
    estimatedEffort: '30 minutes',
    potentialImpact: 'High',
    completionType: 'system_verified',
    verificationExplanation:
      'System verified: Verified from commercial address and licensing profile fields.',
    askAiPrompt: 'Can I build business credit using a virtual office address or home address?',
    actionLabel: 'Verify Address & License',
    actionHref: '/business',
    roadmapTaskKey: 'task_business_address',
  },

  m_duns_bureau: {
    id: 'm_duns_bureau',
    title: 'Commercial Credit Bureau Registration',
    stageId: 2,
    stageName: 'BUILD',
    categoryLabel: 'Credit Profile & Tradelines',
    stepOrder: 6,
    weight: 10,
    prerequisiteId: 'm_business_bank',
    prerequisiteTitle: 'Dedicated Business Checking Account',
    whatItIs:
      'A free 9-digit D-U-N-S Number from Dun & Bradstreet and an active commercial file with Experian Commercial and Equifax Business.',
    whyItMatters:
      'Vendor tradelines cannot report payment history unless a commercial file exists to receive the data. The D-U-N-S Number is the global benchmark for business credit identification.',
    whatToDo: [
      'Check if your business already has a D-U-N-S number on the official D&B website.',
      'If not found, request a free D-U-N-S number directly through D&B (allow 14–30 days for free processing).',
      'Verify that the company legal name and address match your state filings exactly.',
    ],
    whatToAvoid: [
      'Do not pay thousands for expedited D&B credit builder packages unless on an urgent timeline; the standard number is completely free.',
      'Do not apply for vendor credit before checking your bureau profile.',
    ],
    whenToMoveForward:
      'When your 9-digit D-U-N-S number is assigned and active.',
    estimatedEffort: '14–30 days for free assignment',
    potentialImpact: 'Critical',
    completionType: 'system_verified',
    verificationExplanation:
      'System verified: Confirmed against business credit profile and D-U-N-S registration status.',
    askAiPrompt: 'How do I check if my business already has a free D-U-N-S number?',
    actionLabel: 'Confirm D-U-N-S / File',
    actionHref: '/business',
    roadmapTaskKey: 'task_duns',
  },

  m_tier1_tradelines: {
    id: 'm_tier1_tradelines',
    title: 'Tier-1 Reporting Tradelines',
    stageId: 2,
    stageName: 'BUILD',
    categoryLabel: 'Credit Profile & Tradelines',
    stepOrder: 7,
    weight: 10,
    prerequisiteId: 'm_duns_bureau',
    prerequisiteTitle: 'Commercial Credit Bureau Registration',
    whatItIs:
      'Net-30 commercial vendor accounts (e.g. office supplies, shipping, packaging) that report monthly payment experiences to major business credit bureaus.',
    whyItMatters:
      'Tier-1 Net-30 vendors are the fastest, most beginner-friendly way to generate your first business credit score (Paydex score) without personal credit checks.',
    whatToDo: [
      'Apply for 2 to 3 Tier-1 Net-30 vendors with low barrier to entry (e.g. Uline, Quill, Grainger).',
      'Make qualifying orders ($50–$100 minimum) of supplies your business actually needs.',
      'Pay each invoice in full 10 to 15 days early to maximize Paydex calculation points.',
    ],
    whatToAvoid: [
      'Do not buy unnecessary items just to generate tradelines; purchase items you actually use.',
      'Never pay late; even a 1-day late payment can lower your Paydex score from 80 down to 70.',
    ],
    whenToMoveForward:
      'When you have made at least one qualifying purchase and paid the invoice early.',
    estimatedEffort: '30–45 days for invoice payment and bureau reporting cycle',
    potentialImpact: 'Critical',
    completionType: 'customer_confirmation',
    verificationExplanation:
      'Customer confirmed: Self-reported reporting tradeline account. Crediqly tracks payment habits.',
    askAiPrompt: 'What should I look for when choosing my first reporting Net-30 tradeline?',
    recommendedProductsCategory: 'net_30',
    actionLabel: 'View Recommended Tradelines',
    actionHref: '/products?category=net_30',
    roadmapTaskKey: 'task_reporting_accounts',
  },

  m_credit_depth: {
    id: 'm_credit_depth',
    title: 'Commercial Credit Account Depth',
    stageId: 2,
    stageName: 'BUILD',
    categoryLabel: 'Credit Profile & Tradelines',
    stepOrder: 8,
    weight: 5,
    prerequisiteId: 'm_tier1_tradelines',
    prerequisiteTitle: 'Tier-1 Reporting Tradelines',
    whatItIs:
      'Maintaining 3 or more active, independent reporting tradelines across multiple vendors.',
    whyItMatters:
      'A single tradeline is rarely enough for commercial underwriters. Most Tier-2 lenders and commercial banks require a minimum of 3 to 5 reporting trade experiences to demonstrate systemic reliability.',
    whatToDo: [
      'Expand from your first Net-30 account to 3–4 diverse reporting vendors.',
      'Cycle small purchases across all accounts over a 60-day period.',
      'Pay all balances immediately upon invoice receipt.',
    ],
    whatToAvoid: [
      'Avoid opening 10 accounts simultaneously in one week; space applications over 2–4 weeks.',
      'Do not leave accounts dormant for more than 6 months or bureaus may mark them inactive.',
    ],
    whenToMoveForward:
      'When at least 3 distinct vendor tradelines have reported positive payment experiences.',
    estimatedEffort: '60 days',
    potentialImpact: 'High',
    completionType: 'customer_confirmation',
    verificationExplanation:
      'Customer confirmed: Self-reported trade account depth count.',
    askAiPrompt: 'Why do commercial lenders require 3 to 5 tradelines instead of just one?',
    recommendedProductsCategory: 'net_30',
    actionLabel: 'Explore Net-30 Vendors',
    actionHref: '/products?category=net_30',
    roadmapTaskKey: 'rec_credit_depth',
  },

  m_revolving_card: {
    id: 'm_revolving_card',
    title: 'Dedicated Business Credit Card',
    stageId: 3,
    stageName: 'STRENGTHEN',
    categoryLabel: 'Revolving Credit & Seasoning',
    stepOrder: 9,
    weight: 10,
    prerequisiteId: 'm_tier1_tradelines',
    prerequisiteTitle: 'Tier-1 Reporting Tradelines',
    whatItIs:
      'A revolving commercial credit card or store charge card (Tier-2 credit) issued in the business name.',
    whyItMatters:
      'Revolving lines demonstrate ongoing balance management and credit discipline, unlocking substantially larger credit limits ($5,000–$50,000+) than vendor accounts.',
    whatToDo: [
      'Apply for a business credit card suited to your current operating profile (e.g. corporate charge card or secured business card if early-stage).',
      'Use the card exclusively for regular business expenses (software, travel, inventory).',
      'Pay statement balances in full each month to avoid interest charges.',
    ],
    whatToAvoid: [
      'Never max out the card or carry balances exceeding 30% of the credit limit.',
      'Never use the business credit card for personal living expenses.',
    ],
    whenToMoveForward:
      'When your commercial card is opened and active with regular monthly payments.',
    estimatedEffort: '1–2 weeks for card delivery & activation',
    potentialImpact: 'Critical',
    completionType: 'customer_confirmation',
    verificationExplanation:
      'Customer confirmed: Self-reported revolving business credit card account.',
    askAiPrompt: 'Which business credit cards report solely to commercial credit bureaus?',
    recommendedProductsCategory: 'business_credit_cards',
    actionLabel: 'View Business Cards',
    actionHref: '/products?category=business_credit_cards',
    roadmapTaskKey: 'task_build_business_card',
  },

  m_utilization_payment: {
    id: 'm_utilization_payment',
    title: 'Responsible Payment & Low Utilization',
    stageId: 3,
    stageName: 'STRENGTHEN',
    categoryLabel: 'Revolving Credit & Seasoning',
    stepOrder: 10,
    weight: 10,
    prerequisiteId: 'm_revolving_card',
    prerequisiteTitle: 'Dedicated Business Credit Card',
    whatItIs:
      'Maintaining revolving balance ratios below 30% of total credit limits and paying all commercial invoices early or on time.',
    whyItMatters:
      'Credit utilization is the second most heavily weighted factor in commercial credit scoring models. High utilization signals cash-flow distress to prospective lenders.',
    whatToDo: [
      'Keep your revolving statement balance under 30% (ideally under 15%) of your limit.',
      'Make mid-cycle payments before the statement closing date if balances spike.',
      'Set up automatic calendar reminders or autopay for all vendor accounts.',
    ],
    whatToAvoid: [
      'Avoid running card balances up to the maximum limit right before applying for loans.',
      'Do not skip payments or make minimum payments only.',
    ],
    whenToMoveForward:
      'When you consistently maintain low utilization across 2+ billing cycles.',
    estimatedEffort: 'Ongoing monthly habit',
    potentialImpact: 'High',
    completionType: 'customer_confirmation',
    verificationExplanation:
      'Customer confirmed: Self-reported payment discipline and utilization management.',
    askAiPrompt: 'How does credit utilization affect business credit compared to personal credit?',
    actionLabel: 'Review Best Practices',
    actionHref: '/learn',
    roadmapTaskKey: 'task_credit_utilization',
  },

  m_credit_monitoring: {
    id: 'm_credit_monitoring',
    title: 'Commercial Credit Monitoring',
    stageId: 3,
    stageName: 'STRENGTHEN',
    categoryLabel: 'Revolving Credit & Seasoning',
    stepOrder: 11,
    weight: 5,
    whatItIs:
      'Regularly tracking business credit scores and tradeline reporting across Dun & Bradstreet, Experian Business, and Equifax Commercial.',
    whyItMatters:
      'Commercial credit reports frequently contain errors, incorrect payment terms, or misassigned tradelines. Catching and disputing errors early protects your borrowing eligibility.',
    whatToDo: [
      'Check your commercial credit scores and active tradeline count quarterly.',
      'Verify that all vendor accounts are reporting on-time payments accurately.',
      'Confirm there are no unauthorized inquiries or public tax liens.',
    ],
    whatToAvoid: [
      'Do not apply for commercial financing without knowing your current credit profile.',
      'Do not ignore reporting discrepancies; file disputes directly with the reporting bureau.',
    ],
    whenToMoveForward:
      'When you know your current score range and monitor reporting quarterly.',
    estimatedEffort: '15 minutes per month',
    potentialImpact: 'Medium',
    completionType: 'system_verified',
    verificationExplanation:
      'System verified: Verified from credit tracking status in business profile.',
    askAiPrompt: 'How can I dispute an inaccurate tradeline on my business credit report?',
    actionLabel: 'Check Credit Tracking',
    actionHref: '/business',
    roadmapTaskKey: 'task_check_scores',
  },

  m_funding_profile: {
    id: 'm_funding_profile',
    title: 'Capital Target & Funding Purpose',
    stageId: 4,
    stageName: 'FUNDING READY',
    categoryLabel: 'Funding Preparation & Profile',
    stepOrder: 12,
    weight: 10,
    whatItIs:
      'Defining a specific target capital amount and business purpose (working capital, equipment, marketing, inventory, expansion).',
    whyItMatters:
      'Underwriting models match specific funding products (e.g. SBA 7a, lines of credit, equipment leases) based on loan purpose and requested size. Clear targets prevent mismatched applications.',
    whatToDo: [
      'Calculate exactly how much capital your business needs and can afford to repay.',
      'Specify the commercial use of funds in your Crediqly profile.',
      'Ensure the requested amount aligns with current monthly cash flow deposits.',
    ],
    whatToAvoid: [
      'Do not request ambiguous amounts like "as much as possible"; lenders view this as a risk signal.',
      'Do not seek long-term debt to cover recurring short-term operating losses.',
    ],
    whenToMoveForward:
      'When your funding amount and strategic commercial purpose are configured.',
    estimatedEffort: '15 minutes',
    potentialImpact: 'High',
    completionType: 'system_verified',
    verificationExplanation:
      'System verified: Configured in business profile funding targets.',
    askAiPrompt: 'How do underwriters evaluate requested funding amount vs monthly revenues?',
    actionLabel: 'Set Funding Target',
    actionHref: '/business',
    roadmapTaskKey: 'task_funding_target',
  },

  m_revenue_operating: {
    id: 'm_revenue_operating',
    title: 'Revenue Verification & Seasoning',
    stageId: 4,
    stageName: 'FUNDING READY',
    categoryLabel: 'Funding Preparation & Profile',
    stepOrder: 13,
    weight: 10,
    whatItIs:
      'Documenting verified gross annual revenue and proving 6–24+ months of continuous operating age.',
    whyItMatters:
      'Operating longevity and cash flow are the two greatest factors in unlocking institutional funding terms. Businesses with $100k+ annual revenue and 2+ years of seasoning qualify for prime tier rates.',
    whatToDo: [
      'Update your annual and monthly gross revenue figures accurately in your profile.',
      'Ensure deposits are consistently processed through your commercial checking account.',
      'Maintain an operating history with minimal volatility in monthly balances.',
    ],
    whatToAvoid: [
      'Do not artificially inflate revenue figures; underwriters verify bank statements and tax returns.',
      'Avoid large erratic cash deposits that cannot be documented with customer invoices.',
    ],
    whenToMoveForward:
      'When your business revenue and operating age metrics are accurately documented.',
    estimatedEffort: '15 minutes',
    potentialImpact: 'Critical',
    completionType: 'system_verified',
    verificationExplanation:
      'System verified: Verified against documented revenue ranges and operating age in profile.',
    askAiPrompt: 'What minimum operating age and monthly revenue are required for SBA vs line of credit?',
    actionLabel: 'Update Financials',
    actionHref: '/business',
  },

  m_documentation_pack: {
    id: 'm_documentation_pack',
    title: 'Funding Application Document Readiness Pack',
    stageId: 4,
    stageName: 'FUNDING READY',
    categoryLabel: 'Funding Preparation & Profile',
    stepOrder: 14,
    weight: 5,
    prerequisiteId: 'm_funding_profile',
    prerequisiteTitle: 'Capital Target & Funding Purpose',
    whatItIs:
      'Assembling the standard underwriting document package: 3–6 months of bank statements, Articles of Organization, EIN confirmation letter, and government ID.',
    whyItMatters:
      'Incomplete applications expire or face automatic underwriting declines. Having a pre-assembled document pack enables immediate same-day approvals with institutional lenders.',
    whatToDo: [
      'Download the last 3–6 months of complete PDF business bank statements (all pages).',
      'Locate your stamped Articles of Organization and CP-575 EIN letter.',
      'Have color copies of government-issued photo ID ready for all 20%+ owners.',
    ],
    whatToAvoid: [
      'Do not submit screenshots or camera photos of bank statements; lenders require full PDF statements.',
      'Do not omit pages (e.g. submitting pages 1–3 of a 5-page bank statement).',
    ],
    whenToMoveForward:
      'When you have all documents assembled in a secure digital folder ready for submission.',
    estimatedEffort: '30–45 minutes',
    potentialImpact: 'High',
    completionType: 'customer_confirmation',
    verificationExplanation:
      'Customer confirmed: Self-reported document readiness pack completion.',
    askAiPrompt: 'What documents do commercial underwriters look for on a business loan application?',
    actionLabel: 'Check Document Checklist',
    actionHref: '/funding',
    roadmapTaskKey: 'task_document_pack',
  },
};

/**
 * Helper to retrieve micro-education for a specific milestone or task key
 */
export function getMilestoneEducation(idOrTaskKey: string): MilestoneEducation | null {
  if (MILESTONE_EDUCATION_REGISTRY[idOrTaskKey]) {
    return MILESTONE_EDUCATION_REGISTRY[idOrTaskKey];
  }
  // Lookup by roadmapTaskKey
  const found = Object.values(MILESTONE_EDUCATION_REGISTRY).find(
    (m) => m.roadmapTaskKey === idOrTaskKey
  );
  return found || null;
}
