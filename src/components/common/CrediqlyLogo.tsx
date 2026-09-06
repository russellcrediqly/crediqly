'use client';

import React from 'react';

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
  const iconSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

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
      <div className={`${iconSizeClasses[size]} shrink-0 transition-transform duration-200 hover:scale-105`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
          aria-hidden="true"
        >
          <defs>
            {/* Deep Sapphire to Slate Gradient */}
            <linearGradient id="cq-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Electric Blue Credit Arc */}
            <linearGradient id="cq-arc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="40%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>

            {/* Mint to Cyan Growth Apex */}
            <linearGradient id="cq-growth" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>

          {/* Squircle Base with Precision Glass Border */}
          <rect width="40" height="40" rx="11" fill="url(#cq-bg)" />
          <rect
            x="0.5"
            y="0.5"
            width="39"
            height="39"
            rx="10.5"
            stroke="rgba(255, 255, 255, 0.22)"
            strokeWidth="1"
          />

          {/* Precision "C" Credit Arc */}
          <path
            d="M 27 13.5 C 24.6 11.2 21.4 10 17.5 10 C 12.2 10 8 14.5 8 20 C 8 25.5 12.2 30 17.5 30 C 22 30 25.4 28 27.2 25.5"
            stroke="url(#cq-arc)"
            strokeWidth="3.8"
            strokeLinecap="round"
          />

          {/* Ascendant Capital Growth Arrow (The 'Q' Upward Dynamic) */}
          <path
            d="M 20.5 14.5 L 28.5 14.5 L 28.5 22.5 M 28.5 14.5 L 18 25"
            stroke="url(#cq-growth)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Apex Readiness Beacon Dot */}
          <circle cx="28.5" cy="14.5" r="1.5" fill="#34D399" />
        </svg>
      </div>

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
