'use client';

import React from 'react';

export interface CrediqlyBrandIconProps {
  /**
   * Scale size in pixels or CSS classes
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'light' | 'dark';
}

/**
 * Premium Crediqly FinTech Brand Icon
 *
 * Geometric Construction:
 * - Rounded obsidian squircle base providing maximum contrast in any viewport or theme.
 * - Foundation 'C' Arc: Deep Trust Sapphire representing business entity credit foundation and banking stability.
 * - Ascendant Capital Vector: 45° Growth Arrow in Crediqly Emerald & Mint representing fundability progression and upward capital momentum.
 * - Milestone Beacon Node: Top-right apex signifying funding readiness milestone attainment.
 */
export const CrediqlyBrandIcon: React.FC<CrediqlyBrandIconProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  return (
    <div className={`${sizeClasses[size]} shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
        aria-hidden="true"
      >
        <defs>
          {/* Midnight Slate-Navy Squircle Gradient */}
          <linearGradient id="cq-icon-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Trust Sapphire to Cyan Arc Gradient */}
          <linearGradient id="cq-icon-arc" x1="7.5" y1="31" x2="26" y2="7.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Upward Growth Dynamic Gradient (Crediqly Emerald & Mint) */}
          <linearGradient id="cq-icon-growth" x1="18" y1="22" x2="28.5" y2="11.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0D9488" />
            <stop offset="50%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>

        {/* Deep Obsidian-Navy Squircle Base with Precision Inset Highlight */}
        <rect width="40" height="40" rx="10" fill="url(#cq-icon-bg)" />
        <rect
          x="0.5"
          y="0.5"
          width="39"
          height="39"
          rx="9.5"
          stroke="rgba(255, 255, 255, 0.16)"
          strokeWidth="1"
        />

        {/* The Foundation 'C' Arc (Business Credit Base) */}
        <path
          d="M 26 27.5 C 23.5 30.5 19.8 31.8 15.5 30.5 C 10.5 29 7.5 24.2 7.5 19 C 7.5 13.8 10.5 9 15.5 7.5 C 19.8 6.2 23.5 7.5 26 10.5"
          stroke="url(#cq-icon-arc)"
          strokeWidth="3.8"
          strokeLinecap="round"
        />

        {/* The Ascendant Capital Vector (45° Upward Financial Growth Trajectory) */}
        <path
          d="M 18 22 L 28.5 11.5 M 28.5 11.5 L 21 11.5 M 28.5 11.5 L 28.5 19"
          stroke="url(#cq-icon-growth)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Apex Milestone Beacon Dot */}
        <circle cx="28.5" cy="11.5" r="1.8" fill="#34D399" />
      </svg>
    </div>
  );
};

export interface CrediqlyLogoProps {
  /**
   * Visual theme:
   * - 'light': Dark text for light backgrounds (Navbar, Dashboard, Auth pages)
   * - 'dark': White text for dark backgrounds (Footer, Admin Console)
   */
  variant?: 'light' | 'dark';
  /**
   * Overall scale of the logo
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to display the secondary subtitle under the wordmark
   */
  showSubtitle?: boolean;
  /**
   * Custom subtitle text (e.g. 'Command Center', 'Admin Console', 'Business Credit & Funding')
   */
  subtitle?: string;
  /**
   * When false, renders only the premium logomark icon (without wordmark)
   */
  showWordmark?: boolean;
  className?: string;
}

export const CrediqlyLogo: React.FC<CrediqlyLogoProps> = ({
  variant = 'light',
  size = 'md',
  showSubtitle = true,
  subtitle = 'Business Credit & Funding',
  showWordmark = true,
  className = '',
}) => {
  const titleSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const subtitleSizeClasses = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-[11px]',
  };

  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric Logomark */}
      <CrediqlyBrandIcon size={size} variant={variant} />

      {/* Typography Wordmark & Subtitle */}
      {showWordmark && (
        <div className="flex flex-col">
          <div
            className={`font-black tracking-tight leading-none font-sans ${titleSizeClasses[size]} ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <span>Crediq</span>
            <span className={isDark ? 'text-brand-400' : 'text-brand-600'}>ly</span>
          </div>

          {showSubtitle && subtitle && (
            <span
              className={`font-extrabold tracking-wider uppercase mt-1 leading-none ${subtitleSizeClasses[size]} ${
                isDark ? 'text-brand-400/90' : 'text-brand-700'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
