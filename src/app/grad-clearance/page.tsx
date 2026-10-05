'use client';

import { useState, type FormEvent } from 'react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { ALL_UNIVERSITIES } from '@/lib/mockData';
import { createWhatsAppLink } from '@/lib/whatsapp';
import { UNISOKO_CONTACT } from '@/lib/siteConfig';
import { ArrowUpRight, MessageCircle } from 'lucide-react';

export default function GraduationClearancePage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState(ALL_UNIVERSITIES[0]?.name || '');
  const [hostel, setHostel] = useState('');
  const [items, setItems] = useState('');
  const [collectionDate, setCollectionDate] = useState('');

  const message = [
    'Habari UniSoko. I am graduating and would like to clear room items in bulk.',
    `Name: ${name.trim()}`,
    `Phone: ${phone.trim()}`,
    `University/campus: ${university}`,
    `Hostel/room location: ${hostel.trim()}`,
    `Available collection date: ${collectionDate || 'To be agreed'}`,
    'Room contents:',
    items.trim(),
  ].join('\n');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.open(createWhatsAppLink(UNISOKO_CONTACT.phoneDigits, message), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-6 dark:border-slate-800"><p className="text-xs font-bold uppercase text-emerald-700">Graduating student service</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Graduation clearance hub</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">List room contents together and chat directly with UniSoko about a bulk collection offer.</p></header>
        <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Full name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><label className="text-xs font-semibold">Phone number<input required type="tel" maxLength={32} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+255 7XX XXX XXX" className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label></div>
            <label className="block text-xs font-semibold">University / campus<select value={university} onChange={(event) => setUniversity(event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{ALL_UNIVERSITIES.map((campus) => <option key={campus.id}>{campus.name}</option>)}</select></label>
            <label className="block text-xs font-semibold">Hostel and room location<input required maxLength={180} value={hostel} onChange={(event) => setHostel(event.target.value)} placeholder="Hostel name, block, room, and nearby landmark" className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
            <label className="block text-xs font-semibold">Room contents in bulk<textarea required minLength={5} maxLength={4000} rows={8} value={items} onChange={(event) => setItems(event.target.value)} placeholder={'Bed frame — good condition — TZS 120,000\nDesk and chair — fair condition — TZS 60,000\nFan — good condition — TZS 35,000'} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block text-xs font-semibold">Preferred collection date<input type="date" value={collectionDate} onChange={(event) => setCollectionDate(event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
            <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 sm:w-auto"><MessageCircle className="h-4 w-4" />Chat with Admin<ArrowUpRight className="h-4 w-4" /></button>
          </section>
          <aside className="h-fit border-l-2 border-emerald-600 pl-4 text-sm text-slate-600 dark:text-slate-300"><h2 className="font-bold text-slate-900 dark:text-white">Bulk acquisition</h2><p className="mt-2 text-xs leading-5">Your item list opens as a prefilled WhatsApp message to UniSoko at {UNISOKO_CONTACT.phoneDisplay}. Agree on inspection, price, and collection directly with the team.</p></aside>
        </form>
      </main>
      <CartDrawer />
    </div>
  );
}
