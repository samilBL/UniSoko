'use client';

import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { useStore } from '@/context/StoreContext';
import { DEVELOPER_PROFILE_DEFAULTS } from '@/lib/siteConfig';
import { createWhatsAppLink } from '@/lib/whatsapp';
import { ArrowLeft, ArrowUpRight, Mail, Phone } from 'lucide-react';

export default function DeveloperPage() {
  const { storeSettings } = useStore();
  const profile = { ...DEVELOPER_PROFILE_DEFAULTS, ...(storeSettings.developerProfile || {}) };
  const whatsappDigits = profile.whatsapp.replace(/\D/g, '');
  const safeDeveloperLink = /^https:\/\//i.test(profile.link) ? profile.link : '';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700"><ArrowLeft className="h-4 w-4" />Back to UniSoko</Link>
        <section className="mt-6 grid gap-8 border-y border-slate-200 py-8 sm:grid-cols-[12rem_1fr] sm:items-start dark:border-slate-800">
          <div className="relative flex aspect-square w-full max-w-48 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-indigo-50 text-4xl font-black text-indigo-700 dark:border-slate-700 dark:bg-slate-900">{profile.imageUrl ? <Image src={profile.imageUrl} alt={`${profile.name} profile`} fill sizes="192px" unoptimized className="object-cover" /> : 'RI'}</div>
          <div>
            <p className="text-xs font-bold uppercase text-emerald-700">Developer / Creator of UniSoko</p>
            <h1 className="mt-2 text-3xl font-black">{profile.name}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Building a central marketplace and campus fulfillment service for Tanzania.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`tel:${profile.phone}`} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white hover:bg-indigo-800"><Phone className="h-4 w-4" />Call</a>
              <a href={createWhatsAppLink(whatsappDigits, 'Hello UniSoko, I would like to get in touch with the developer.')} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800">WhatsApp</a>
              <a href={`mailto:${profile.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-800 hover:bg-white"><Mail className="h-4 w-4" />Email</a>
              {safeDeveloperLink && <a href={safeDeveloperLink} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-800 hover:bg-white">Developer link<ArrowUpRight className="h-4 w-4" /></a>}
            </div>
          </div>
        </section>
        <section className="grid gap-10 py-8 sm:grid-cols-2">
          <div><h2 className="text-lg font-bold">About the developer</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{profile.story || 'A short introduction will be added here.'}</p></div>
          <div><h2 className="text-lg font-bold">About UniSoko</h2><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">UniSoko is one central seller serving students across universities in Tanzania. Campus Wingas support referrals and fulfillment; universities and campus hubs are locations, not sellers.</p><Link href="/" className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-indigo-700 hover:underline">Explore UniSoko</Link></div>
        </section>
      </main>
      <CartDrawer />
    </div>
  );
}
