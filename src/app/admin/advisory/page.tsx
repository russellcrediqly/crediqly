'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AdminAdvisoryRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/consultations');
  }, [router]);

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 text-center">
      <LoadingState message="Redirecting to Advisory & Consultations Central..." className="text-white" />
      <p className="text-xs text-slate-400">
        Loading 1-on-1 advisor strategy session schedules and appointments...
      </p>
      <Link
        href="/admin/consultations"
        className="inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300"
      >
        <span>Click here if not redirected automatically</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
