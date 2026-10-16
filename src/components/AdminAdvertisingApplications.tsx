'use client';

import { useEffect, useState } from 'react';

type Application = {
  id: string; business_name: string; contact_person: string; phone: string; email: string;
  target_campuses: string[]; package_type: string; campaign_title: string; creative_url: string;
  destination_url: string; duration_weeks: number; notes: string; amount_due: number;
  transaction_reference: string; payment_status: string; payment_rejection_reason: string;
  campaign_status: string; campaign_start_at: string | null; campaign_end_at: string | null;
  status: string; created_at: string; payment_method_id: string;
};
type PaymentMethod = { id: string; name: string };
type CampaignDraft = { status: string; startsAt: string; endsAt: string };

function localDateTime(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function AdminAdvertisingApplications() {
  const [items, setItems] = useState<Application[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [message, setMessage] = useState('Loading applications…');
  const [busyId, setBusyId] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, CampaignDraft>>({});

  const load = async () => {
    const response = await fetch('/api/admin/advertising', { cache: 'no-store' });
    const result = await response.json() as { applications?: Application[]; paymentMethods?: PaymentMethod[]; error?: string };
    if (!response.ok) throw new Error(result.error || 'Could not load applications.');
    setItems(result.applications || []);
    setMethods(result.paymentMethods || []);
    setMessage(result.applications?.length ? '' : 'No campaigns submitted yet.');
    setDrafts((current) => Object.fromEntries((result.applications || []).map((item) => [item.id, current[item.id] || {
      status: item.campaign_status || 'Under Review', startsAt: localDateTime(item.campaign_start_at), endsAt: localDateTime(item.campaign_end_at),
    }])));
  };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Could not load applications.'));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const update = async (id: string, action: string, data: Record<string, unknown> = {}) => {
    setBusyId(id);
    setMessage('');
    try {
      const response = await fetch('/api/admin/advertising', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action, ...data }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not update application.');
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update application.'); }
    finally { setBusyId(''); }
  };

  return <section className="space-y-4"><div><h2 className="text-xl font-black">Advertising applications &amp; campaigns</h2><p className="text-sm text-slate-600">Verify received transfers before scheduling or activating the submitted campaign.</p></div>
    {message && <p role="status" className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
    <div className="grid gap-4">{items.map((item) => {
      const draft = drafts[item.id] || { status: item.campaign_status || 'Under Review', startsAt: '', endsAt: '' };
      return <article key={item.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{item.business_name} · {item.campaign_title || item.package_type}</h3><p className="text-xs text-slate-600">{item.contact_person} · {item.phone}{item.email ? ` · ${item.email}` : ''}</p><p className="mt-1 text-xs font-semibold text-slate-700">{item.package_type} · {item.package_type === 'Campus Community Blast' ? 'one campaign' : `${item.duration_weeks} week(s)`} · TZS {Number(item.amount_due).toLocaleString('en-TZ')}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">{item.status}</span></div>
        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><div><p className="text-xs font-bold uppercase text-slate-500">Payment</p><p className="mt-1">{item.payment_status} · {methods.find((method) => method.id === item.payment_method_id)?.name || 'Payment method unavailable'}</p><p className="font-mono text-xs">Reference: {item.transaction_reference || '—'}</p>{item.payment_rejection_reason && <p className="mt-1 text-xs text-red-700">Reason: {item.payment_rejection_reason}</p>}</div><div><p className="text-xs font-bold uppercase text-slate-500">Target campuses</p><p className="mt-1">{item.target_campuses.join(', ') || 'Not specified'}</p></div></div>
        <div className="flex flex-wrap gap-3 text-sm">{item.creative_url && <a href={item.creative_url} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 underline">Review creative</a>}{item.destination_url && <a href={item.destination_url} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 underline">Open destination</a>}</div>
        {item.notes && <p className="whitespace-pre-wrap text-sm text-slate-700">{item.notes}</p>}
        {item.payment_status === 'Submitted' && <div className="space-y-2 border-t border-slate-200 pt-3"><p className="text-xs font-bold text-slate-800">Check the payment ledger against the submitted reference before deciding.</p><div className="flex flex-wrap gap-2"><button type="button" disabled={busyId === item.id} onClick={() => void update(item.id, 'verify_payment')} className="min-h-10 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white disabled:opacity-50">{busyId === item.id ? 'Saving…' : 'Verify payment'}</button><input aria-label={`Rejection reason for ${item.business_name}`} value={reasons[item.id] || ''} onChange={(event) => setReasons((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Reason if payment is not found" className="min-h-10 min-w-56 rounded-lg border border-slate-300 px-3 text-xs" /><button type="button" disabled={busyId === item.id || (reasons[item.id] || '').trim().length < 3} onClick={() => void update(item.id, 'reject_payment', { reason: reasons[item.id] })} className="min-h-10 rounded-lg border border-red-300 px-4 text-xs font-bold text-red-800 disabled:opacity-50">Reject payment</button></div></div>}
        {item.payment_status === 'Verified' && <div className="space-y-3 border-t border-slate-200 pt-3"><p className="text-xs font-bold text-emerald-800">Payment verified · campaign: {item.campaign_status}</p><div className="grid gap-2 sm:grid-cols-3"><label className="text-xs font-semibold">Campaign status<select value={draft.status} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, status: event.target.value } }))} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2"><option>Under Review</option><option>Scheduled</option><option>Active</option><option>Completed</option><option>Rejected</option></select></label><label className="text-xs font-semibold">Starts at<input type="datetime-local" value={draft.startsAt} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, startsAt: event.target.value } }))} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2" /></label><label className="text-xs font-semibold">Ends at<input type="datetime-local" value={draft.endsAt} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, endsAt: event.target.value } }))} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2" /></label></div><button type="button" disabled={busyId === item.id} onClick={() => void update(item.id, 'update_campaign', { campaignStatus: draft.status, startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : '', endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : '' })} className="min-h-10 rounded-lg bg-indigo-700 px-4 text-xs font-bold text-white disabled:opacity-50">Save campaign schedule/status</button></div>}
        <p className="text-[11px] text-slate-500">Submitted {new Date(item.created_at).toLocaleString()}</p>
      </article>;
    })}</div>
  </section>;
}
