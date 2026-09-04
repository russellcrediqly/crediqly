import { RoadmapStageId, TaskPriority } from './types';

export interface BaseTaskDefinition {
  key: string;
  stage: RoadmapStageId;
  defaultTitle: string;
  defaultPriority: TaskPriority;
  whyItMatters: string;
  whatToDo: string[];
  thingsToConsider: string[];
  profileField?: string;
  actionHref?: string;
  actionLabel?: string;
}

export const STAGE_DEFINITIONS: Record<
  RoadmapStageId,
  { order: number; title: string; subtitle: string; description: string }
> = {
  foundation: {
    order: 1,
    title: 'Business Foundation',
    subtitle: 'Legal and operational separation',
    description:
      'Set up the foundational entity, banking, and commercial identity elements required by lenders and credit bureaus.',
  },
  credit_foundation: {
    order: 2,
    title: 'Business Credit Foundation',
    subtitle: 'Bureau awareness and trade line discovery',
    description:
      'Assess existing credit files, verify commercial bureau presence, and separate business and personal expenses.',
  },
  building: {
    order: 3,
    title: 'Credit Building',
    subtitle: 'Responsible trade line development',
    description:
      'Establish and maintain active commercial payment history with reporting accounts and on-time payment habits.',
  },
  optimization: {
    order: 4,
    title: 'Credit Optimization',
    subtitle: 'Consistency, monitoring, and debt management',
    description:
      'Ensure cross-bureau accuracy, monitor profile updates, and maintain high standards across all business relationships.',
  },
  funding: {
    order: 5,
    title: 'Funding Preparation',
    subtitle: 'Underwriting readiness and capital planning',
    description:
      'Prepare key financial records and loan readiness metrics for formal business funding applications.',
  },
};

export const TASK_DEFINITIONS: BaseTaskDefinition[] = [
  // ==========================================
  // STAGE 1: BUSINESS FOUNDATION
  // ==========================================
  {
    key: 'task_entity',
    stage: 'foundation',
    defaultTitle: 'Establish your business entity',
    defaultPriority: 'high',
    whyItMatters:
      'Forming a distinct legal entity (such as an LLC or Corporation) establishes your business as an independent legal person, essential for separating personal and commercial liability.',
    whatToDo: [
      'Choose a suitable business structure (LLC, C-Corp, or S-Corp) with your Secretary of State.',
      'File the appropriate Articles of Organization or Incorporation.',
      'Draft an Operating Agreement or Corporate Bylaws to govern internal operations.',
    ],
    thingsToConsider: [
      'Sole proprietorships do not provide liability protection and cannot easily build independent business credit.',
      'Check that your registered business name exactly matches what will appear on bank and tax records.',
    ],
    profileField: 'entityType',
    actionHref: '/business',
    actionLabel: 'Update Profile',
  },
  {
    key: 'task_ein',
    stage: 'foundation',
    defaultTitle: 'Obtain an EIN',
    defaultPriority: 'high',
    whyItMatters:
      'An Employer Identification Number (EIN) is your business federal tax identifier, required by banks and commercial credit bureaus to track business finances separate from your SSN.',
    whatToDo: [
      'Apply directly through the official IRS website (free of charge).',
      'Download and securely store your official CP-575 EIN confirmation letter.',
      'Ensure the legal name and address on your EIN letter match your state registration.',
    ],
    thingsToConsider: [
      'Be cautious of third-party websites charging fees for EIN applications; the IRS provides them free.',
      'An EIN is needed even if you do not currently have employees.',
    ],
    profileField: 'hasEIN',
    actionHref: '/business',
    actionLabel: 'Update Profile',
  },
  {
    key: 'task_bank_account',
    stage: 'foundation',
    defaultTitle: 'Open a dedicated business bank account',
    defaultPriority: 'high',
    whyItMatters:
      'A dedicated commercial bank account is the single most critical factor in proving operational cash flow and preventing the commingling of personal and business funds.',
    whatToDo: [
      'Bring your filed Articles of Organization, EIN confirmation letter, and ID to a commercial bank.',
      'Open a dedicated business checking account in your business legal name.',
      'Deposit all business revenues and pay all business expenses exclusively from this account.',
    ],
    thingsToConsider: [
      'Lenders frequently review 3–6 months of business bank statements to verify revenue consistency.',
      'Avoid paying personal expenses directly from your business checking account.',
    ],
    profileField: 'hasBusinessBankAccount',
    actionHref: '/business',
    actionLabel: 'Update Profile',
  },
  {
    key: 'task_business_email',
    stage: 'foundation',
    defaultTitle: 'Set up a professional business email',
    defaultPriority: 'medium',
    whyItMatters:
      'A professional business email using your custom domain (@yourcompany.com) signals commercial legitimacy and is required by many business credit bureaus and tier-1 lenders.',
    whatToDo: [
      'Register a domain name matching your registered business entity.',
      'Set up a workspace mailbox (e.g. contact@yourbusiness.com or yourname@yourbusiness.com).',
      'Use this email consistently across all vendor registrations, state filings, and bank accounts.',
    ],
    thingsToConsider: [
      'Generic free email providers (such as @gmail.com or @yahoo.com) may cause automated underwriting flags with certain commercial lenders.',
      'Keep email addresses consistent across public directories.',
    ],
    profileField: 'hasBusinessEmail',
    actionHref: '/business',
    actionLabel: 'Update Profile',
  },
  {
    key: 'task_business_phone',
    stage: 'foundation',
    defaultTitle: 'Set up a dedicated business phone',
    defaultPriority: 'medium',
    whyItMatters:
      'Commercial credit agencies and underwriters verify dedicated business phone numbers in national 411 directories to authenticate business existence and prevent identity fraud.',
    whatToDo: [
      'Obtain a dedicated local or toll-free business telephone line through a virtual phone provider or carrier.',
      'Record a professional voicemail greeting stating your business name and operating hours.',
      'List your phone number in public national business directory databases (e.g. 411 directories).',
    ],
    thingsToConsider: [
      'Avoid using a personal mobile number as your primary publicly listed business number.',
      'Ensure the listed telephone number is answered professionally during standard business hours.',
    ],
    profileField: 'hasBusinessPhone',
    actionHref: '/business',
    actionLabel: 'Update Profile',
  },
  {
    key: 'task_website',
    stage: 'foundation',
    defaultTitle: 'Create a professional business website',
    defaultPriority: 'medium',
    whyItMatters:
      'Underwriters and vendors search the web to verify what your company does, your contact info, and terms of service before extending credit or approval.',
    whatToDo: [
      'Publish a functional website on your business domain.',
      'Clearly list your legal business name, physical address, dedicated phone number, and email.',
      'Describe your products, services, privacy policy, and terms of service.',
    ],
    thingsToConsider: [
      'The address and contact info displayed on your website should match your Secretary of State registration exactly.',
      'A one-page modern informational site is sufficient for foundation credit verification.',
    ],
    profileField: 'hasWebsite',
    actionHref: '/business',
    actionLabel: 'Update Profile',
  },
  {
    key: 'task_address',
    stage: 'foundation',
    defaultTitle: 'Establish a consistent business address',
    defaultPriority: 'medium',
    whyItMatters:
      'Lenders and credit bureaus evaluate address credibility. Consistency across all filings prevents automated fraud triggers and underwriting denials.',
    whatToDo: [
      'Choose a permanent physical commercial address or a dedicated commercial registered agent/virtual office address.',
      'Avoid using P.O. Boxes or UPS Store mailboxes for formal credit applications where physical addresses are required.',
      'Update your state registration, bank records, and IRS records to ensure exact address consistency.',
    ],
    thingsToConsider: [
      'Many automated commercial underwriting systems cross-reference USPS address classifications.',
      'Even minor spelling variations (e.g. "Suite 200" vs "Ste 200") can create duplicate credit files.',
    ],
    profileField: 'hasBusinessAddress',
    actionHref: '/business',
    actionLabel: 'Update Profile',
  },
  {
    key: 'task_licenses',
    stage: 'foundation',
    defaultTitle: 'Obtain required business licenses where applicable',
    defaultPriority: 'low',
    whyItMatters:
      'Depending on your industry, city, and state, operating without proper permits or licenses can lead to compliance issues and potential financing disqualifications.',
    whatToDo: [
      'Check city and county clerk requirements for general business permits or DBA registrations.',
      'Verify whether your industry requires specialized state licensing (e.g., contracting, healthcare, food, transportation).',
      'Keep copies of active licenses accessible for financial institution verification.',
    ],
    thingsToConsider: [
      'License requirements vary significantly by location and industry. Check whether this applies to your business.',
      'This guidance is educational and does not constitute formal legal counsel.',
    ],
    profileField: 'hasBusinessLicense',
    actionHref: '/business',
    actionLabel: 'Update Profile',
  },
  {
    key: 'task_duns',
    stage: 'foundation',
    defaultTitle: 'Consider establishing a D-U-N-S number',
    defaultPriority: 'medium',
    whyItMatters:
      'A Dun & Bradstreet D-U-N-S Number is a widely used 9-digit identifier required by federal agencies, enterprise suppliers, and commercial credit evaluators.',
    whatToDo: [
      'Visit the official Dun & Bradstreet website to check if your company already has a number assigned.',
      'If not found, request a free D-U-N-S number directly through their standard application.',
      'Verify that company name, address, and ownership details are accurately entered.',
    ],
    thingsToConsider: [
      'Standard D-U-N-S assignment is free through D&B; expedited processing incurs fees but is optional.',
      'Having a D-U-N-S number creates your Dun & Bradstreet file, but payment history is needed to generate a Paydex score.',
    ],
    profileField: 'hasDuns',
    actionHref: '/business',
    actionLabel: 'Update Profile',
  },

  // ==========================================
  // STAGE 2: BUSINESS CREDIT FOUNDATION
  // ==========================================
  {
    key: 'task_credit_profile',
    stage: 'credit_foundation',
    defaultTitle: 'Determine whether your business has a business credit profile',
    defaultPriority: 'high',
    whyItMatters:
      'Unlike consumer credit, which is automatically created with your SSN, a business credit profile only exists once reporting accounts or bureau registrations are initiated.',
    whatToDo: [
      'Check for existing records across the primary commercial credit bureaus: Dun & Bradstreet, Experian Business, and Equifax Commercial.',
      'Confirm whether your company has an active commercial bureau profile.',
      'Note any existing credit bureau registration numbers.',
    ],
    thingsToConsider: [
      'If you have been in business for some time and have vendor accounts, you may already have an active profile without knowing it.',
      'Establishing a profile is the prerequisite to recording trade lines.',
    ],
    profileField: 'hasBusinessCreditProfile',
    actionHref: '/business',
    actionLabel: 'Update Profile',
  },
  {
    key: 'task_reporting_accounts',
    stage: 'credit_foundation',
    defaultTitle: 'Check whether your existing accounts report to commercial credit bureaus',
    defaultPriority: 'high',
    whyItMatters:
      'Not all vendors or suppliers report payment data to business credit bureaus. Paying accounts that do not report will not build your business credit score.',
    whatToDo: [
      'Review your current vendors, suppliers, office suppliers, and software subscriptions.',
      'Ask each vendor if and to which commercial bureaus they report monthly payment history.',
      'Make note of reporting schedules and requirements.',
    ],
    thingsToConsider: [
      'Utility companies, phone carriers, and landlords typically only report defaults or collections rather than positive on-time history.',
      'Focus your efforts on accounts verified to report positive trade experiences.',
    ],
    profileField: 'hasReportingAccounts',
    actionHref: '/products?category=business_credit_builders',
    actionLabel: 'Explore Credit-Building Options',
  },
  {
    key: 'task_identify_bureaus',
    stage: 'credit_foundation',
    defaultTitle: 'Identify which business credit bureaus your accounts report to',
    defaultPriority: 'medium',
    whyItMatters:
      'Different lenders check different commercial bureaus. Having balanced reporting across Dun & Bradstreet, Experian Business, and Equifax Commercial builds broad funding readiness.',
    whatToDo: [
      'Document which bureau receives payment data from each of your active accounts.',
      'Identify any gaps (for instance, accounts reporting only to Experian but not Dun & Bradstreet).',
      'Aim for multi-bureau coverage as you expand supplier accounts.',
    ],
    thingsToConsider: [
      'Dun & Bradstreet Paydex requires a minimum of 3 reporting trade lines to generate an initial score.',
      'Experian Intelliscore Plus evaluates credit blends and commercial credit card limits.',
    ],
  },
  {
    key: 'task_review_accounts',
    stage: 'credit_foundation',
    defaultTitle: 'Review your existing business credit accounts',
    defaultPriority: 'medium',
    whyItMatters:
      'Taking inventory of all active lines, credit limits, terms, and billing cycles ensures that you have accurate visibility into your current commercial commitments.',
    whatToDo: [
      'Create a simple list of all commercial cards, trade lines, net-term accounts, and vehicle loans.',
      'Verify that account names exactly match your current legal business entity.',
      'Check payment due dates and set up automated payments to guarantee zero late marks.',
    ],
    thingsToConsider: [
      'Accounts opened in your personal name without your business entity do not build business credit.',
      'Regular reviews help identify stale accounts or errors before you apply for funding.',
    ],
    profileField: 'businessCreditAccountCount',
  },
  {
    key: 'task_credit_position',
    stage: 'credit_foundation',
    defaultTitle: 'Understand your current business credit position',
    defaultPriority: 'medium',
    whyItMatters:
      'Knowing where your business stands helps you choose the right tier of credit-building accounts and avoid premature applications that could result in rejections.',
    whatToDo: [
      'Review your Crediqly readiness scores (Business Readiness and Credit Readiness).',
      'Examine whether you have sufficient foundation items established before seeking credit lines.',
      'Set realistic milestones: from vendor trade lines to store credit, revolving cards, and bank loans.',
    ],
    thingsToConsider: [
      'Business credit building follows a tiered progression: Foundation -> Tier 1 Vendors -> Tier 2 Retail -> Tier 3 Cash Lines.',
      'Skipping tiers often leads to automated underwriting rejections.',
    ],
  },
  {
    key: 'task_separate_expenses',
    stage: 'credit_foundation',
    defaultTitle: 'Separate business and personal expenses',
    defaultPriority: 'high',
    whyItMatters:
      'Commingling personal and business finances weakens the corporate veil and causes significant friction during commercial bank underwriting.',
    whatToDo: [
      'Designate one or more business cards strictly for business purchases.',
      'Never charge personal groceries, personal rent, or personal entertainment to commercial accounts.',
      'Use accounting software or a bookkeeper to reconcile accounts monthly.',
    ],
    thingsToConsider: [
      'Clean separation is one of the first elements an underwriter inspects when reviewing bank statements.',
      'Separation also simplifies corporate tax filing and business deductions.',
    ],
  },
  {
    key: 'task_payment_practices',
    stage: 'credit_foundation',
    defaultTitle: 'Establish consistent payment practices',
    defaultPriority: 'high',
    whyItMatters:
      'In business credit, paying early is rewarded. For example, a D&B Paydex score of 80 indicates prompt payment on terms, while scores of 90–100 require paying earlier than agreed terms.',
    whatToDo: [
      'Set calendar reminders 7–10 days before vendor invoice due dates.',
      'Whenever cash flow allows, pay vendor invoices upon receipt or within 10–15 days.',
      'Enroll in autopay for all revolving business cards and utility accounts.',
    ],
    thingsToConsider: [
      'A single late payment reported to a commercial credit bureau can significantly impact your business credit ratings for months.',
      'Early payment habits build strong relationships with suppliers.',
    ],
  },

  // ==========================================
  // STAGE 3: CREDIT BUILDING
  // ==========================================
  {
    key: 'task_build_review_existing',
    stage: 'building',
    defaultTitle: 'Review existing business credit accounts',
    defaultPriority: 'medium',
    whyItMatters:
      'Active management of existing trade lines ensures that accounts remain in good standing and continue to report positive payment history each month.',
    whatToDo: [
      'Confirm that all active vendor accounts have experienced transactions within the last 60–90 days.',
      'Review statements for any unexpected fees or inaccurate reporting.',
      'Ensure account balances remain low relative to credit limits.',
    ],
    thingsToConsider: [
      'Dormant vendor accounts that have no activity for 6+ months may stop reporting monthly data to credit bureaus.',
      'Periodic small purchases keep reporting lines active.',
    ],
  },
  {
    key: 'task_build_identify_accounts',
    stage: 'building',
    defaultTitle: 'Identify potential business-credit-building accounts',
    defaultPriority: 'high',
    whyItMatters:
      'Building strong business credit requires multiple reporting trade lines. Identifying suitable vendor accounts for products your business already buys is the first step.',
    whatToDo: [
      'Identify items your business regularly purchases (e.g., shipping supplies, office essentials, packaging, industrial goods).',
      'Seek suppliers that offer net-30 invoicing terms for commercial entities.',
      'Confirm that prospective suppliers report payment experiences to major commercial credit bureaus.',
    ],
    thingsToConsider: [
      'Do not buy unnecessary items solely for credit building. Buy supplies your business genuinely needs.',
      'Tier 1 vendor accounts typically do not require personal credit checks or personal guarantees.',
    ],
    actionHref: '/products?category=net_30',
    actionLabel: 'Explore Credit-Building Options',
  },
  {
    key: 'task_build_reporting_search',
    stage: 'building',
    defaultTitle: 'Look for accounts that may report payment history to commercial credit bureaus',
    defaultPriority: 'medium',
    whyItMatters:
      'Credit bureaus require multiple distinct reporting trade references to generate reliable composite ratings like Paydex and Intelliscore.',
    whatToDo: [
      'Aim to establish at least 3–5 reporting trade lines over time.',
      'Prioritize accounts reporting to Dun & Bradstreet, Experian Business, and Equifax Commercial.',
      'Track the date of your first invoice and first payment for each trade line.',
    ],
    thingsToConsider: [
      'It typically takes 30–60 days after an invoice is paid for the trade line to appear on your commercial credit report.',
      'Patience and consistency are key to steady business credit growth.',
    ],
    actionHref: '/products?category=business_credit_builders',
    actionLabel: 'Explore Reporting Accounts',
  },
  {
    key: 'task_build_maintain_accounts',
    stage: 'building',
    defaultTitle: 'Maintain accounts responsibly',
    defaultPriority: 'high',
    whyItMatters:
      'Maintaining accounts with low utilization and zero missed payments is the single strongest indicator of commercial creditworthiness.',
    whatToDo: [
      'Keep credit utilization on revolving business lines below 30% of total limits.',
      'Never exceed agreed credit limits or payment terms.',
      'Immediately contact vendors if billing discrepancies occur.',
    ],
    thingsToConsider: [
      'Unlike consumer credit, commercial credit limits are often increased automatically after 3–6 months of reliable payment history.',
      'Responsible maintenance opens access to higher credit tier accounts.',
    ],
  },
  {
    key: 'task_build_pay_on_time',
    stage: 'building',
    defaultTitle: 'Pay accounts on time or early',
    defaultPriority: 'high',
    whyItMatters:
      'Commercial credit bureaus measure Days Beyond Terms (DBT). Even paying 1 day late can register a negative mark on commercial bureau algorithms.',
    whatToDo: [
      'Aim for a DBT of 0 or negative (paying before the invoice due date).',
      'Align billing cycles with your predictable cash inflow dates.',
      'Keep an emergency liquidity buffer in your business checking account to cover unexpected timing mismatches.',
    ],
    thingsToConsider: [
      'In D&B scoring, an 80 rating reflects prompt payment on terms; 90 indicates payment 20 days early; 100 indicates payment 30 days early.',
      'Consistent on-time payments are the foundation of lender trust.',
    ],
  },
  {
    key: 'task_build_monitor_info',
    stage: 'building',
    defaultTitle: 'Monitor business-credit information',
    defaultPriority: 'medium',
    whyItMatters:
      'Commercial credit reports are not covered by consumer fair credit reporting laws to the same extent. Monitoring catches reporting inaccuracies early.',
    whatToDo: [
      'Check your commercial credit profiles periodically for errors, incorrect balances, or mixed files.',
      'Ensure trade lines are accurately attributed to your business entity.',
      'File formal disputes directly with the reporting bureau if erroneous data appears.',
    ],
    thingsToConsider: [
      'Duplicate files can occur if business names or addresses are entered inconsistently across vendors.',
      'Regular monitoring protects against corporate identity theft.',
    ],
  },
  {
    key: 'task_build_avoid_unnecessary',
    stage: 'building',
    defaultTitle: 'Avoid opening unnecessary accounts',
    defaultPriority: 'low',
    whyItMatters:
      'Applying for too many accounts within a short timeframe can signal cash flow stress or desperation to underwriters.',
    whatToDo: [
      'Only open accounts for products and supplies your business naturally uses.',
      'Space out new account applications by 30–60 days.',
      'Prioritize quality reporting trade lines over sheer quantity.',
    ],
    thingsToConsider: [
      'A small number of consistently paid, high-quality accounts is far more valuable than dozens of unused accounts.',
      'Focus on steady, sustainable growth.',
    ],
  },

  // ==========================================
  // STAGE 4: CREDIT OPTIMIZATION
  // ==========================================
  {
    key: 'task_opt_relationships',
    stage: 'optimization',
    defaultTitle: 'Review existing business credit relationships',
    defaultPriority: 'medium',
    whyItMatters:
      'Established vendor relationships can be upgraded to larger credit limits, better payment terms (e.g. net-60), and formal trade references.',
    whatToDo: [
      'Review accounts with 6+ months of on-time payment history.',
      'Request credit limit increases from existing vendors.',
      'Ask suppliers if they can provide written credit reference letters for future bank credit applications.',
    ],
    thingsToConsider: [
      'Vendors are often eager to increase terms for clients with impeccable payment records.',
      'Higher commercial credit limits positively influence bureau scoring algorithms.',
    ],
    actionHref: '/products?category=business_credit_cards',
    actionLabel: 'Explore Business Cards',
  },
  {
    key: 'task_opt_check_reporting',
    stage: 'optimization',
    defaultTitle: 'Check reporting information for accuracy',
    defaultPriority: 'high',
    whyItMatters:
      'Inaccuracies in commercial credit files (such as closed accounts marked open, or mismatched legal names) can suppress your credit ratings.',
    whatToDo: [
      'Compare your official corporate registration records against credit bureau reports.',
      'Verify that all listed addresses, officers, and phone numbers match current reality.',
      'Submit correction requests to Dun & Bradstreet, Experian, or Equifax if discrepancies exist.',
    ],
    thingsToConsider: [
      'Bureaus provide formal update portals for verified business officers.',
      'Keeping public data accurate prevents underwriting delays.',
    ],
  },
  {
    key: 'task_opt_payment_history',
    stage: 'optimization',
    defaultTitle: 'Maintain consistent on-time payment history',
    defaultPriority: 'high',
    whyItMatters:
      'Long-term consistency is what institutional lenders evaluate. Six to twelve months of flawless payment history builds high-tier credibility.',
    whatToDo: [
      'Maintain an unbroken record of on-time or early payments across all accounts.',
      'Review monthly cash flow projections to prevent liquidity crunches.',
      'Maintain positive working capital in your commercial accounts.',
    ],
    thingsToConsider: [
      'Seasoned credit profiles carry significantly higher weight in loan underwriting models.',
      'Never let an administrative oversight cause an accidental late mark.',
    ],
  },
  {
    key: 'task_opt_consistency',
    stage: 'optimization',
    defaultTitle: 'Review business information for consistency',
    defaultPriority: 'medium',
    whyItMatters:
      'Discrepancies across Secretary of State records, IRS records, bank statements, and credit files are a primary cause of automated financing rejections.',
    whatToDo: [
      'Audit your legal business name across all documents (including punctuation like commas and LLC designations).',
      'Verify that suite numbers and street addresses are identical across all accounts.',
      'Ensure principal owner names and titles are uniform across filings.',
    ],
    thingsToConsider: [
      'Automated underwriting bots look for exact 100% matches.',
      'Consistency demonstrates corporate organization and professionalism.',
    ],
  },
  {
    key: 'task_opt_avoid_applications',
    stage: 'optimization',
    defaultTitle: 'Avoid unnecessary credit applications',
    defaultPriority: 'low',
    whyItMatters:
      'Excessive inquiries in a compressed timeframe can temporarily depress credit ratings and raise concern during manual underwriting reviews.',
    whatToDo: [
      'Only apply for credit products when your readiness metrics and qualifications match lender criteria.',
      'Inquire about pre-qualification options with soft inquiry pulls before formal submission.',
      'Plan funding rounds strategically rather than applying ad-hoc.',
    ],
    thingsToConsider: [
      'Multiple applications in a single month may trigger risk models.',
      'Quality and timing beat volume every time.',
    ],
  },
  {
    key: 'task_opt_monitor_changes',
    stage: 'optimization',
    defaultTitle: 'Monitor changes to business credit',
    defaultPriority: 'medium',
    whyItMatters:
      'Proactive monitoring allows you to celebrate positive score improvements and address negative entries before applying for major capital.',
    whatToDo: [
      'Schedule a monthly review of your Crediqly readiness metrics.',
      'Watch for changes in trade line reporting, limits, or bureau ratings.',
      'Keep your Crediqly business profile updated as your company grows.',
    ],
    thingsToConsider: [
      'Scores update dynamically as vendors submit monthly billing tapes to bureaus.',
      'Staying informed keeps you in control of your financial trajectory.',
    ],
  },
  {
    key: 'task_opt_prep_funding',
    stage: 'optimization',
    defaultTitle: 'Prepare documentation for future funding applications',
    defaultPriority: 'high',
    whyItMatters:
      'When the time comes to apply for business financing, having organized documentation turns a stressful weeks-long ordeal into a quick, confident approval process.',
    whatToDo: [
      'Keep last 3–6 months of complete business bank statements organized in PDF format.',
      'Maintain up-to-date year-to-date Profit & Loss (P&L) and Balance Sheet statements.',
      'Organize your filed corporate tax returns, EIN letter, and Articles of Organization.',
    ],
    thingsToConsider: [
      'Lenders appreciate organized borrowers. Speed of document submission correlates directly with approval velocity.',
      'Crediqly will guide you through dedicated Funding Preparation in future steps.',
    ],
  },
  {
    key: 'task_opt_separate_finances',
    stage: 'optimization',
    defaultTitle: 'Keep business and personal finances separated',
    defaultPriority: 'high',
    whyItMatters:
      'Financial separation is a perpetual practice, not a one-time setup. It preserves corporate liability protection and clean underwriting records.',
    whatToDo: [
      'Pay owner compensation through formal payroll or documented owner draws, not ad-hoc debit card swipes.',
      'Maintain an accounting system to track every dollar entering and exiting the business.',
      'Regularly review statements to ensure zero personal charges exist.',
    ],
    thingsToConsider: [
      'A pristine commercial account history is the strongest evidence of financial maturity.',
      'Separation safeguards your personal assets as your business grows.',
    ],
  },
  // ==========================================
  // STAGE 5: FUNDING PREPARATION (Step 8)
  // ==========================================
  {
    key: 'task_fund_readiness_assessment',
    stage: 'funding',
    defaultTitle: 'Complete your Funding Readiness assessment',
    defaultPriority: 'high',
    whyItMatters:
      'Knowing your internal funding readiness before submitting applications helps you identify weak spots and avoid unnecessary hard inquiries.',
    whatToDo: [
      'Navigate to the Funding Readiness section.',
      'Review your scores across Foundation, Business Credit, Financial Readiness, and Profile.',
      'Address key blockers identified by the readiness engine.',
    ],
    thingsToConsider: [
      'Funding Readiness is an internal evaluation designed to guide your preparation.',
      'Recalculates dynamically as you complete profile milestones.',
    ],
    actionHref: '/funding-readiness',
    actionLabel: 'Check Funding Readiness',
  },
  {
    key: 'task_fund_organize_bank_statements',
    stage: 'funding',
    defaultTitle: 'Organize 3–6 months of business bank statements',
    defaultPriority: 'high',
    whyItMatters:
      'Bank statements are the primary document lenders review to verify average daily balances, deposit consistency, and lack of overdraft fees.',
    whatToDo: [
      'Download the last 3 to 6 consecutive months of PDF statements from your commercial bank.',
      'Review for recurring monthly deposits and adequate cash buffer.',
      'Verify that account names match your legal entity filing.',
    ],
    thingsToConsider: [
      'Avoid non-sufficient fund (NSF) marks or excessive overdrafts.',
      'Consistent month-over-month revenue demonstrates repayment capacity.',
    ],
    actionHref: '/funding-readiness',
    actionLabel: 'View Funding Criteria',
  },
  {
    key: 'task_fund_financial_documentation',
    stage: 'funding',
    defaultTitle: 'Assemble financial records (P&L and Balance Sheet)',
    defaultPriority: 'medium',
    whyItMatters:
      'Clean Profit & Loss and Balance Sheet records prove operating profitability and allow underwriters to evaluate debt service coverage ratios.',
    whatToDo: [
      'Generate a year-to-date Profit and Loss statement from your bookkeeping software.',
      'Prepare a current Balance Sheet summarizing assets and liabilities.',
      'Ensure accounts receivable and payable are reconciled.',
    ],
    thingsToConsider: [
      'Accurate bookkeeping speeds up approval timelines significantly.',
      'Separation of personal expenses makes financial statements credible.',
    ],
  },
  {
    key: 'task_fund_ownership_tax_returns',
    stage: 'funding',
    defaultTitle: 'Review filed business tax returns and ownership documentation',
    defaultPriority: 'medium',
    whyItMatters:
      'For larger lines of credit and term loans, lenders require 1–2 years of filed federal business tax returns and proof of ownership percentage.',
    whatToDo: [
      'Locate filed federal tax returns for your business (Form 1120, 1120-S, or 1065).',
      'Verify that ownership percentages across tax returns match your operating agreement.',
      'Ensure all schedules are included in PDF packages.',
    ],
    thingsToConsider: [
      'Lenders match gross revenues on tax returns against bank statement deposits.',
      'Keep copies signed and dated for rapid submission.',
    ],
  },
  {
    key: 'task_fund_know_requirements',
    stage: 'funding',
    defaultTitle: 'Review lender readiness criteria before applying',
    defaultPriority: 'low',
    whyItMatters:
      'Understanding specific lender requirements beforehand prevents premature rejections and protects your business from unnecessary credit pulls.',
    whatToDo: [
      'Compare your business age, revenue, and trade lines against common product thresholds.',
      'Determine whether personal guarantees or collateral are required.',
      'Apply only when your profile meets or exceeds baseline requirements.',
    ],
    thingsToConsider: [
      'Submitting multiple unvetted applications in a short window triggers automated risk algorithms.',
      'A methodical, prepared approach yields the highest approval rates.',
    ],
    actionHref: '/funding-readiness',
    actionLabel: 'Review Readiness Factors',
  },
];

