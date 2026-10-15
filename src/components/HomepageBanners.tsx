'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Megaphone, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';

type HomepageBanner = {
  id: string;
  kind: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
};

export default function HomepageBanners() {
  const [banners, setBanners] = useState<HomepageBanner[]>([]);

  useEffect(() => {
    fetch('/api/banners', { cache: 'no-store' })
      .then(async (response) => (response.ok ? ((await response.json()) as { banners?: HomepageBanner[] }) : null))
      .then((result) => {
        if (result?.banners && result.banners.length > 0) {
          setBanners(result.banners);
        }
      })
      .catch(() => undefined);
  }, []);

  if (!banners.length) return null;

  return (
    <section
      aria-label="Campus Promotions & Partner Placements"
      className="my-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Megaphone className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Campus Spotlight &amp; Featured Offers
            </h2>
            <p className="text-[11px] text-slate-400">
              Verified campus campaigns and partner announcements
            </p>
          </div>
        </div>

        <Link
          href="/advertise"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:border-indigo-500 hover:text-white transition-all shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Advertise with UniSoko</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-6 divide-y divide-slate-800/60">
        {banners.map((banner) => (
          <article
            key={banner.id}
            className="grid gap-6 py-6 first:pt-0 last:pb-0 sm:grid-cols-[16rem_1fr] sm:items-center"
          >
            {banner.imageUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-800 border border-slate-700/60 shadow-md">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 256px"
                  unoptimized
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ) : null}

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      banner.kind === 'Sponsor'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : banner.kind === 'Flash Deal'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {banner.kind}
                  </span>
                  <span className="text-[10px] text-slate-400">Sponsored Campus Feature</span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white">{banner.title}</h3>

                {banner.body && (
                  <p className="max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {banner.body}
                  </p>
                )}
              </div>

              {banner.ctaLabel && banner.ctaUrl ? (
                <Link
                  href={banner.ctaUrl}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95 whitespace-nowrap"
                >
                  <span>{banner.ctaLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
