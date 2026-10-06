import Image from 'next/image';
import Link from 'next/link';

type Partner = { name: string; shortCode: string; category: string; logoUrl?: string; url?: string };

function safeHttpsUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch { return null; }
}

export default function TrustedBySection({ partners }: { partners: Partner[] }) {
  const trusted = partners.filter((partner) => partner.name.trim() && partner.shortCode.trim());
  if (!trusted.length) return null;

  return <section aria-labelledby="trusted-by-title" className="rounded-3xl border border-slate-200 bg-white px-5 py-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-8 sm:py-9">
    <div className="mx-auto max-w-3xl text-center"><p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">Campus community</p><h2 id="trusted-by-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Trusted by our campus community</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Institutions and partners helping students shop with confidence.</p></div>
    <ul className="mx-auto mt-7 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{trusted.map((partner, index) => {
      const logo = safeHttpsUrl(partner.logoUrl);
      const href = safeHttpsUrl(partner.url);
      const card = <><span className="flex h-16 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-2 dark:bg-slate-950">{logo ? <Image src={logo} alt={`${partner.name} logo`} width={160} height={64} unoptimized className="h-full w-auto max-w-full object-contain"/> : <span aria-hidden="true" className="text-lg font-black tracking-tight text-indigo-800 dark:text-indigo-200">{partner.shortCode}</span>}</span><span className="mt-3 block text-center text-xs font-bold leading-5 text-slate-900 dark:text-slate-100">{partner.name}</span><span className="mt-0.5 block text-center text-[10px] font-medium text-slate-500 dark:text-slate-400">{partner.category}</span></>;
      return <li key={`${partner.shortCode}-${index}`} className="min-w-0">{href ? <Link href={href} target="_blank" rel="noreferrer" className="block h-full rounded-2xl border border-slate-200 p-3 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:hover:border-indigo-700">{card}</Link> : <div className="h-full rounded-2xl border border-slate-200 p-3 dark:border-slate-800">{card}</div>}</li>;
    })}</ul>
  </section>;
}
