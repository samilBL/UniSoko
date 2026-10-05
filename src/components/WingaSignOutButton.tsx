'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WingaSignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    await fetch('/api/winga/me', { method: 'DELETE' });
    router.push('/winga');
  };

  return (
    <button type="button" onClick={signOut} disabled={isSigningOut} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
      <LogOut className="h-4 w-4" />{isSigningOut ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
