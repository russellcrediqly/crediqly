'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AdminUserDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  useEffect(() => {
    if (userId) {
      router.replace(`/admin/customers/${userId}`);
    }
  }, [router, userId]);

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 text-center">
      <LoadingState message="Redirecting to Customer Dossier..." className="text-white" />
      <p className="text-xs text-slate-400">
        Loading customer record #{userId}...
      </p>
      {userId && (
        <Link
          href={`/admin/customers/${userId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300"
        >
          <span>Click here if not redirected automatically</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
