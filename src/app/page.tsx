'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroTerminal } from '@/components/landing/HeroTerminal';
import { TrustBar } from '@/components/landing/TrustBar';
import { FounderVideoSection } from '@/components/landing/FounderVideoSection';
import { BentoFeatures } from '@/components/landing/BentoFeatures';
import { CapitalMatcher } from '@/components/landing/CapitalMatcher';
import { TradelineRoadmap } from '@/components/landing/TradelineRoadmap';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingPreview } from '@/components/landing/PricingPreview';
import { FaqSection } from '@/components/landing/FaqSection';
import { CtaBanner } from '@/components/landing/CtaBanner';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white font-sans">
      <Navbar variant="dark" />
      <main className="flex-1">
        <HeroTerminal />
        <TrustBar />
        <FounderVideoSection />
        <BentoFeatures />
        <CapitalMatcher />
        <TradelineRoadmap />
        <ComparisonSection />
        <TestimonialsSection />
        <PricingPreview />
        <FaqSection />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
