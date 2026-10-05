import type { ReactNode } from 'react';

type OfferCardProps = { badge: 'LIMITED TIME BUNDLE' | 'HOT TRADE-IN OFFER' | 'WINGA BONUS'; title: string; originalPrice: string; dealPrice: string; savings: string; children?: ReactNode; actionLabel: string; onAction?: () => void; };

const badgeStyles = { 'LIMITED TIME BUNDLE': 'bg-amber-400 text-black', 'HOT TRADE-IN OFFER': 'bg-emerald-500 text-black', 'WINGA BONUS': 'bg-indigo-600 text-white' } as const;

export default function OfferCard({ badge, title, originalPrice, dealPrice, savings, children, actionLabel, onAction }: OfferCardProps) {
  return <article className="oled-surface overflow-hidden rounded-2xl border-indigo-500/40 p-5 shadow-[0_0_25px_rgba(99,102,241,0.20)]"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${badgeStyles[badge]}`}>{badge}</span><h2 className="mt-4 text-xl font-extrabold tracking-tight text-white">{title}</h2>{children && <div className="mt-3 text-sm leading-6 text-slate-400">{children}</div>}<div className="mt-5 flex items-end justify-between gap-3"><div><p className="font-mono text-sm text-slate-500 line-through">{originalPrice}</p><p className="font-mono text-2xl font-extrabold text-emerald-400">{dealPrice}</p></div><span className="rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3 py-1 text-xs font-bold text-emerald-300">SAVE {savings}</span></div><button type="button" onClick={onAction} className="mt-5 min-h-11 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-slate-200">{actionLabel}</button></article>;
}
