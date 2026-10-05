'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw, ShieldAlert, X } from 'lucide-react';
import Link from 'next/link';

type Application = {
  id: string;
  sellerProfileId: string | null;
  applicantReference: string;
  displayName: string;
  university: string;
  campus: string | null;
  description: string;
  contactOptions: Record<string, unknown>;
  status: string;
  sellerStatus: string;
  reviewNotes: string;
  submittedAt: string;
  reviewedAt: string | null;
};

export default function AdminSellerApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setError('');
    const response = await fetch('/api/admin/seller-applications', { cache: 'no-store' });
    const result = await response.json() as { applications?: Application[]; error?: string };
    if (!response.ok) throw new Error(result.error || 'Could not load seller applications.');
    setApplications(result.applications || []);
  }, []);

  useEffect(() => { void Promise.resolve().then(load).catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load seller applications.')).finally(() => setLoading(false)); }, [load]);

  const act = async (id: string, action: string, applicationId?: string) => {
    setBusyId(id); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/seller-applications', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, reviewNotes: applicationId ? notes[applicationId] || '' : '' }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not update seller account.');
      await load();
      setMessage(action === 'approve' ? 'Seller approved. Trial and subscriptions are handled in Phase 3.' : action === 'reject' ? 'Application rejected.' : action === 'suspend' ? 'Seller access suspended.' : 'Seller access reactivated.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update seller account.'); }
    finally { setBusyId(''); }
  };

  const pending = applications.filter((application) => application.status === 'pending');

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Marketplace administration</p><h1 className="mt-1 text-2xl font-black">Seller applications</h1><p className="mt-1 text-sm text-slate-600">Review applicant details and manage seller access.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/subscriptions" className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white">Plans and payments</Link><Link href="/admin/product-moderation" className="inline-flex min-h-10 items-center rounded-xl bg-slate-900 px-3 text-xs font-bold text-white">Product moderation</Link><button type="button" onClick={() => void load().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not refresh.'))} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 text-xs font-bold"><RefreshCw className="h-4 w-4" />Refresh</button></div></div>
    <a href="/admin" className="mt-3 inline-block text-xs font-bold text-indigo-600 hover:underline">← Admin dashboard</a>
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    <div className="mt-5 flex gap-3"><div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>{pending.length}</strong> pending review</div><div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700"><strong>{applications.length}</strong> total applications</div></div>
    {loading ? <p role="status" className="py-10 text-center text-sm text-slate-500">Loading applications…</p> : applications.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No seller applications yet.</p> : <section className="mt-5 space-y-4">{applications.map((application) => {
      const isPending = application.status === 'pending';
      const phone = typeof application.contactOptions.phone === 'string' ? application.contactOptions.phone : null;
      const contactEmail = typeof application.contactOptions.email === 'string' ? application.contactOptions.email : null;
      return <article key={application.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-extrabold">{application.displayName}</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-700">Application {application.status}</span><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold capitalize text-indigo-800">Seller {application.sellerStatus}</span></div><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{application.university}{application.campus ? ` · ${application.campus}` : ''}</p><p className="mt-1 text-xs text-slate-500">Applicant reference {application.applicantReference} · submitted {new Date(application.submittedAt).toLocaleString('en-TZ')}</p>{application.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{application.description}</p>}<p className="mt-3 break-all text-xs text-slate-600">Contact: {[contactEmail, phone].filter(Boolean).join(' · ') || 'No contact details provided'}</p>{application.reviewNotes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">Review note: {application.reviewNotes}</p>}</div>
          <div className="flex shrink-0 flex-wrap gap-2">{isPending && <><button type="button" disabled={Boolean(busyId)} onClick={() => void act(application.id, 'approve', application.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" />Approve</button><button type="button" disabled={Boolean(busyId)} onClick={() => void act(application.id, 'reject', application.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-300 px-3 text-xs font-bold text-rose-700 disabled:opacity-50"><X className="h-4 w-4" />Reject</button></>}{application.sellerProfileId && application.sellerStatus === 'approved' && <button type="button" disabled={Boolean(busyId)} onClick={() => void act(application.sellerProfileId!, 'suspend')} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-bold disabled:opacity-50"><ShieldAlert className="h-4 w-4" />Suspend</button>}{application.sellerProfileId && application.sellerStatus === 'suspended' && <button type="button" disabled={Boolean(busyId)} onClick={() => void act(application.sellerProfileId!, 'reactivate')} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-emerald-300 px-3 text-xs font-bold text-emerald-800 disabled:opacity-50"><Check className="h-4 w-4" />Reactivate</button>}</div>
        </div>
        {isPending && <label className="mt-4 block max-w-2xl text-xs font-bold">Review note (optional)<textarea className="mt-1.5 min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" maxLength={2000} value={notes[application.id] || ''} onChange={(event) => setNotes({ ...notes, [application.id]: event.target.value })} placeholder="A short reason or next step for the applicant" /></label>}
      </article>;
    })}</section>}
  </main>;
}
