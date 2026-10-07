'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';

export interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  showIcon?: boolean;
  iconType?: 'help' | 'info';
  position?: 'top' | 'bottom';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  showIcon = false,
  iconType = 'help',
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Close on outside click (mobile friendly)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const IconComp = iconType === 'info' ? Info : HelpCircle;

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center group/tooltip ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      role="tooltip"
    >
      {children}

      {showIcon && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(!isVisible);
          }}
          className="ml-1 text-slate-400 hover:text-slate-600 focus:outline-hidden p-0.5 inline-flex items-center"
          aria-label="More information"
        >
          <IconComp className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Floating Tooltip Bubble */}
      {isVisible && (
        <span
          className={`absolute left-1/2 -translate-x-1/2 z-50 px-3 py-2 text-[11px] font-medium leading-tight text-white bg-slate-900/95 backdrop-blur-xs rounded-xl shadow-xl border border-slate-700/80 pointer-events-none whitespace-normal min-w-[180px] max-w-[260px] text-center animate-in fade-in-0 zoom-in-95 duration-150 ${
            position === 'top'
              ? 'bottom-full mb-2'
              : 'top-full mt-2'
          }`}
        >
          {content}
          {/* Arrow */}
          <span
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/95 border-slate-700/80 rotate-45 ${
              position === 'top'
                ? 'top-full -mt-1 border-r border-b'
                : 'bottom-full -mb-1 border-l border-t'
            }`}
          />
        </span>
      )}
    </span>
  );
};
