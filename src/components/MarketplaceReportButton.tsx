'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';

export default function MarketplaceReportButton({ productId, sellerProfileId, label = 'Report listing' }: { productId?: string; sellerProfileId?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true); setMessage('');
    const form = new FormData(formElement);
    const response = await fetch('/api/marketplace/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, sellerProfileId, reason: form.get('reason'), details: form.get('details') }) });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) { setMessage(result.error || 'Could not submit report.'); return; }
    setMessage('Report received. Thank you.');
    formElement.reset();
  }
  return <div className="inline-block"><button type="button" onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600"><Flag className="h-3.5 w-3.5"/>{label}</button>{open && <form onSubmit={submit} className="mt-2 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left dark:border-slate-700 dark:bg-slate-900"><label className="text-xs font-semibold">Reason<select name="reason" required className="mt-1 block w-full rounded-lg border border-slate-300 p-2 dark:bg-slate-950"><option value="">Choose a reason</option><option>Misleading listing</option><option>Prohibited or unsafe item</option><option>Suspected scam</option><option>Incorrect seller information</option><option>Other</option></select></label><label className="text-xs font-semibold">Details<textarea name="details" maxLength={2000} rows={3} className="mt-1 block w-full rounded-lg border border-slate-300 p-2 dark:bg-slate-950" placeholder="Tell our moderation team what happened"/></label><button disabled={busy} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{busy ? 'Sending…' : 'Submit report'}</button>{message && <p role="status" className="text-xs text-slate-600">{message}</p>}</form>}</div>;
}
