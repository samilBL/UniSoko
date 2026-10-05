'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type HomepageBanner = { id: string; kind: string; title: string; body: string; ctaLabel: string; ctaUrl: string; imageUrl: string };

export default function HomepageBanners() {
  const [banners, setBanners] = useState<HomepageBanner[]>([]);

  useEffect(() => {
    fetch('/api/banners', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ banners?: HomepageBanner[] }> : null)
      .then((result) => { if (result?.banners) setBanners(result.banners); })
      .catch(() => undefined);
  }, []);

  if (!banners.length) return null;

  return <section aria-label="Current promotions" className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">{banners.map((banner) => <article key={banner.id} className="grid gap-4 py-4 sm:grid-cols-[14rem_1fr] sm:items-center">
    {banner.imageUrl && <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-200"><Image src={banner.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 224px" unoptimized className="object-cover" /></div>}
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase text-emerald-700">{banner.kind}</p><h2 className="mt-1 text-lg font-extrabold text-slate-950 dark:text-white">{banner.title}</h2>{banner.body && <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{banner.body}</p>}</div>{banner.ctaLabel && banner.ctaUrl && <Link href={banner.ctaUrl} className="inline-flex min-h-10 shrink-0 items-center rounded-md bg-slate-950 px-4 text-xs font-bold text-white hover:bg-emerald-800">{banner.ctaLabel}</Link>}</div>
  </article>)}</section>;
}
