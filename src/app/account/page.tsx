'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-700">
      <p className="text-sm font-medium">Redirecting to Account Profile...</p>
      <Link href="/profile" className="text-xs text-brand-600 hover:underline mt-2">
        Click here if you are not redirected automatically
      </Link>
    </div>
  );
}
