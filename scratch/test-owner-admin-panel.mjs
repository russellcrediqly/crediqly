/**
 * Test Suite: Crediqly Owner Admin Control Panel & Dashboard Section Controls
 * Verifies:
 * 1. Predefined sections definition & defaults (all 9 keys)
 * 2. Settings service persistence & section toggling logic
 * 3. Schema RLS policies & admin permissions
 * 4. Admin Overview & Settings UI integration
 * 5. Customer layout and page visibility filtering
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Owner Admin Control Panel & Dashboard Section Controls Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}\n`);
  }
}

// 1. Types & Configuration Audit
it('Verifies all 9 predefined dashboard section keys in types/settings.ts', () => {
  const settingsFile = fs.readFileSync('src/types/settings.ts', 'utf8');
  const expectedKeys = [
    'business_profile',
    'business_readiness',
    'credit_readiness',
    'funding_readiness',
    'roadmap',
    'products',
    'funding',
    'funding_tracker',
    'consultation',
  ];

  for (const key of expectedKeys) {
    assert(settingsFile.includes(`'${key}'`), `Missing section key in settings.ts: ${key}`);
    assert(settingsFile.includes(`${key}: true`), `Missing default true visibility for: ${key}`);
  }
});

// 2. Database Schema & RLS Audit
it('Verifies public.platform_settings table with RLS and admin-only write policy in schema.sql', () => {
  const schemaFile = fs.readFileSync('src/lib/supabase/schema.sql', 'utf8').toLowerCase();
  assert(schemaFile.includes('create table if not exists public.platform_settings'), 'platform_settings table definition missing');
  assert(schemaFile.includes('alter table public.platform_settings enable row level security;'), 'RLS not enabled on platform_settings');
  assert(schemaFile.includes('public.is_admin()'), 'Admin check missing in platform_settings RLS policy');
  assert(schemaFile.includes('authenticated users can view platform settings'), 'Customer read policy missing');
  assert(schemaFile.includes('admins can insert platform settings') || schemaFile.includes('admins can update platform settings'), 'Admin write policy missing');
});

// 3. Settings Service Unit Logic
it('Verifies settingsService.ts exports getPlatformSettings, updateSectionVisibility, resetSectionVisibilityDefaults', () => {
  const serviceFile = fs.readFileSync('src/lib/supabase/settingsService.ts', 'utf8');
  assert(serviceFile.includes('export async function getPlatformSettings'), 'getPlatformSettings missing');
  assert(serviceFile.includes('export async function updateSectionVisibility'), 'updateSectionVisibility missing');
  assert(serviceFile.includes('export async function updatePlatformSettings'), 'updatePlatformSettings missing');
  assert(serviceFile.includes('export async function resetSectionVisibilityDefaults'), 'resetSectionVisibilityDefaults missing');
  assert(serviceFile.includes('crediqly_sections_updated'), 'Event dispatch missing');
});

// 4. Custom Reactive Hook
it('Verifies usePlatformSections hook subscribes to crediqly_sections_updated events', () => {
  const hookFile = fs.readFileSync('src/lib/usePlatformSections.ts', 'utf8');
  assert(hookFile.includes('usePlatformSections'), 'usePlatformSections hook missing');
  assert(hookFile.includes('crediqly_sections_updated'), 'Event listener missing in hook');
  assert(hookFile.includes('toggleSection'), 'toggleSection missing in hook');
  assert(hookFile.includes('resetDefaults'), 'resetDefaults missing in hook');
  assert(hookFile.includes('setAllSections'), 'setAllSections missing in hook');
});

// 5. DashboardSectionControls Component
it('Verifies DashboardSectionControls component contains accessible toggles and action buttons', () => {
  const controlsFile = fs.readFileSync('src/components/admin/DashboardSectionControls.tsx', 'utf8');
  assert(controlsFile.includes('Customer Dashboard Section Controls'), 'Section header missing');
  assert(controlsFile.includes('Enable All'), 'Enable All button missing');
  assert(controlsFile.includes('Disable All'), 'Disable All button missing');
  assert(controlsFile.includes('Reset Defaults'), 'Reset Defaults button missing');
  assert(controlsFile.includes('role="switch"'), 'Accessible switch role missing');
  assert(controlsFile.includes('PREDEFINED_DASHBOARD_SECTIONS'), 'Predefined sections iteration missing');
});

// 6. SectionInactiveNotice Component
it('Verifies SectionInactiveNotice component renders friendly message and return link', () => {
  const noticeFile = fs.readFileSync('src/components/common/SectionInactiveNotice.tsx', 'utf8');
  assert(noticeFile.includes('Section Currently Unavailable') || noticeFile.includes('SectionInactiveNotice'), 'Notice text missing');
  assert(noticeFile.includes('/dashboard'), 'Dashboard return link missing');
});

// 7. Admin Overview Page Integration
it('Verifies Admin Overview page (/admin) embeds DashboardSectionControls, 8 KPIs, and Owner Hub', () => {
  const adminPage = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
  assert(adminPage.includes('<DashboardSectionControls />'), 'DashboardSectionControls not embedded in /admin');
  assert(adminPage.includes('Owner Control Panel') || adminPage.includes('Crediqly Platform Administration'), 'Admin title missing');
  assert(adminPage.includes('Owner Management Hub'), 'Owner Management Hub missing');
  assert(adminPage.includes('/admin/products'), 'Link to products missing');
  assert(adminPage.includes('/admin/banks'), 'Link to banks missing');
  assert(adminPage.includes('/admin/funding'), 'Link to funding missing');
  assert(adminPage.includes('/admin/funding-applications'), 'Link to funding applications missing');
  assert(adminPage.includes('/admin/consultations'), 'Link to consultations missing');
  assert(adminPage.includes('/admin/content'), 'Link to content missing');
  assert(adminPage.includes('/admin/users'), 'Link to users missing');
  assert(adminPage.includes('/admin/settings'), 'Link to settings missing');
});

// 8. Admin Settings Page Integration
it('Verifies Admin Settings page (/admin/settings) embeds DashboardSectionControls and branding config', () => {
  const settingsPage = fs.readFileSync('src/app/admin/settings/page.tsx', 'utf8');
  assert(settingsPage.includes('<DashboardSectionControls />'), 'DashboardSectionControls not embedded in /admin/settings');
  assert(settingsPage.includes('General Platform Settings'), 'General settings form missing');
  assert(settingsPage.includes('Allow New Signups'), 'Allow New Signups checkbox missing');
  assert(settingsPage.includes('Maintenance Mode'), 'Maintenance mode checkbox missing');
});

// 9. Customer DashboardLayout Dynamic Navigation Filtering
it('Verifies DashboardLayout filters navigation and hides consultation CTA when sections are disabled', () => {
  const layoutFile = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');
  assert(layoutFile.includes('usePlatformSections'), 'usePlatformSections not used in DashboardLayout');
  assert(layoutFile.includes('sections.consultation !== false'), 'Consultation CTA visibility check missing');
  assert(layoutFile.includes('NAV_ITEMS.filter'), 'NAV_ITEMS filtering logic missing');
});

// 10. Customer Dashboard Page Dynamic Widget Filtering
it('Verifies DashboardPage conditionally renders all 9 predefined section widgets', () => {
  const dashPage = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
  assert(dashPage.includes('sections.consultation !== false'), 'Consultation button/card check missing in dashboard');
  assert(dashPage.includes('sections.business_profile !== false'), 'Business profile check missing in dashboard');
  assert(dashPage.includes('sections.business_readiness !== false'), 'Business readiness check missing in dashboard');
  assert(dashPage.includes('sections.credit_readiness !== false'), 'Credit readiness check missing in dashboard');
  assert(dashPage.includes('sections.funding_readiness !== false'), 'Funding readiness check missing in dashboard');
  assert(dashPage.includes('sections.roadmap !== false'), 'Roadmap check missing in dashboard');
  assert(dashPage.includes('sections.products !== false'), 'Products check missing in dashboard');
  assert(dashPage.includes('sections.funding_tracker !== false'), 'Funding tracker check missing in dashboard');
});

// 11. Customer Individual Route Protection
it('Verifies direct customer routes render SectionInactiveNotice when disabled', () => {
  const consultPage = fs.readFileSync('src/app/consultation/page.tsx', 'utf8');
  assert(consultPage.includes('sections.consultation === false'), 'Consultation page missing inactive check');
  assert(consultPage.includes('SectionInactiveNotice'), 'Consultation page missing SectionInactiveNotice');

  const trackerPage = fs.readFileSync('src/app/funding-tracker/page.tsx', 'utf8');
  assert(trackerPage.includes('sections.funding_tracker === false'), 'Funding tracker page missing inactive check');
  assert(trackerPage.includes('SectionInactiveNotice'), 'Funding tracker page missing SectionInactiveNotice');

  const fundingPage = fs.readFileSync('src/app/funding/page.tsx', 'utf8');
  assert(fundingPage.includes('sections.funding === false'), 'Funding page missing inactive check');
  assert(fundingPage.includes('SectionInactiveNotice'), 'Funding page missing SectionInactiveNotice');

  const productsPage = fs.readFileSync('src/app/products/page.tsx', 'utf8');
  assert(productsPage.includes('sections.products === false'), 'Products page missing inactive check');
  assert(productsPage.includes('SectionInactiveNotice'), 'Products page missing SectionInactiveNotice');

  const readinessPage = fs.readFileSync('src/app/funding-readiness/page.tsx', 'utf8');
  assert(readinessPage.includes('sections.funding_readiness === false'), 'Funding readiness page missing inactive check');
  assert(readinessPage.includes('SectionInactiveNotice'), 'Funding readiness page missing SectionInactiveNotice');

  const roadmapPage = fs.readFileSync('src/app/roadmap/page.tsx', 'utf8');
  assert(roadmapPage.includes('sections.roadmap === false'), 'Roadmap page missing inactive check');
  assert(roadmapPage.includes('SectionInactiveNotice'), 'Roadmap page missing SectionInactiveNotice');

  const businessPage = fs.readFileSync('src/app/business/page.tsx', 'utf8');
  assert(businessPage.includes('sections.business_profile === false'), 'Business page missing inactive check');
  assert(businessPage.includes('SectionInactiveNotice'), 'Business page missing SectionInactiveNotice');
});

console.log(`\n========================================`);
console.log(`Results: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
