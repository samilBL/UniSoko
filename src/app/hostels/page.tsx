'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { ALL_UNIVERSITIES, formatTZS } from '@/lib/mockData';
import { ArrowLeft, ArrowRight, BedDouble, MapPin, Send, ShieldCheck } from 'lucide-react';

type HostelListing = { id: string; campusId: string; campusName: string; title: string; address: string; description: string; pricePerTerm: number; distanceKm: number; amenities: string[]; photos: string[]; verified: boolean };

export default function HostelHubPage() {
  const [listings, setListings] = useState<HostelListing[]>([]);
  const [photoIndex, setPhotoIndex] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ studentName: '', phone: '', university: ALL_UNIVERSITIES[0]?.name || '', location: '', landlordName: '', landlordPhone: '', details: '' });

  useEffect(() => {
    fetch('/api/hostels', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ listings?: HostelListing[] }> : null)
      .then((result) => { if (result?.listings) setListings(result.listings); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const updatePhoto = (listing: HostelListing, direction: number) => {
    setPhotoIndex((current) => ({ ...current, [listing.id]: (current[listing.id] || 0) + direction }));
  };

  const submitRoomLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');
    try {
      const response = await fetch('/api/room-bounties', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || 'Could not send this room lead.');
      setSubmitMessage(`Room lead received. Reference ${result.id}. UniSoko will contact you if the room is verified and leased.`);
      setForm((current) => ({ ...current, studentName: '', phone: '', location: '', landlordName: '', landlordPhone: '', details: '' }));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not send this room lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-6 dark:border-slate-800"><p className="text-xs font-bold uppercase text-emerald-700">Student housing</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Rent a room with us</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Browse reviewed campus-area rooms or send UniSoko a vacancy lead.</p></header>
        <section className="space-y-4" aria-label="Verified hostel listings"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Verified rooms</h2><span className="text-xs text-slate-500">Price per term</span></div>
          {loading ? <p role="status" className="py-8 text-sm text-slate-500">Loading current rooms…</p> : listings.length === 0 ? <p className="border-y border-slate-200 py-8 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">No verified rooms are listed right now. Send a vacancy lead below.</p> : <div className="grid gap-5 md:grid-cols-2">{listings.map((listing) => {
            const currentIndex = photoIndex[listing.id] || 0;
            const imageIndex = listing.photos.length ? (currentIndex + listing.photos.length) % listing.photos.length : 0;
            return <article key={listing.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="relative aspect-video bg-slate-200">{listing.photos[imageIndex] && <Image src={listing.photos[imageIndex]} alt={`${listing.title} room photo ${imageIndex + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />}{listing.photos.length > 1 && <div className="absolute inset-x-3 bottom-3 flex justify-between"><button type="button" aria-label="Previous room photo" onClick={() => updatePhoto(listing, -1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-900"><ArrowLeft className="h-4 w-4" /></button><span className="rounded-md bg-slate-950/80 px-2 py-1 text-xs font-bold text-white">{imageIndex + 1} / {listing.photos.length}</span><button type="button" aria-label="Next room photo" onClick={() => updatePhoto(listing, 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-900"><ArrowRight className="h-4 w-4" /></button></div>}</div>
              <div className="space-y-3 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-extrabold">{listing.title}</h3><p className="mt-1 text-xs text-slate-500">{listing.campusName}</p></div><span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-900"><ShieldCheck className="h-3.5 w-3.5" />Verified</span></div><p className="text-sm text-slate-600 dark:text-slate-300">{listing.description}</p><p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"><MapPin className="h-4 w-4 text-emerald-700" />{listing.address} · {listing.distanceKm} km from campus</p><div className="flex flex-wrap gap-1.5">{listing.amenities.map((amenity) => <span key={amenity} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{amenity}</span>)}</div><div className="border-t border-slate-100 pt-3 dark:border-slate-800"><p className="text-[10px] font-bold uppercase text-slate-500">Per term</p><p className="text-xl font-black text-slate-950 dark:text-white">{formatTZS(listing.pricePerTerm)}</p></div></div>
            </article>;
          })}</div>}
        </section>
        <section className="grid gap-8 border-t border-slate-200 pt-8 lg:grid-cols-[minmax(0,1fr)_18rem] dark:border-slate-800">
          <form onSubmit={submitRoomLead} className="space-y-4"><div><h2 className="text-lg font-bold">Report a vacant room</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Leaving a room or found a vacancy? Share the location and landlord contact so UniSoko can verify it.</p></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Your name<input required maxLength={120} value={form.studentName} onChange={(event) => setForm({ ...form, studentName: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><label className="text-xs font-semibold">Your phone<input required type="tel" maxLength={32} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label></div>
            <label className="block text-xs font-semibold">University / campus<select value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{ALL_UNIVERSITIES.map((campus) => <option key={campus.id}>{campus.name}</option>)}</select></label>
            <label className="block text-xs font-semibold">Room location<input required maxLength={300} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Hostel, street, block, and nearby landmark" className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Landlord name (if known)<input maxLength={120} value={form.landlordName} onChange={(event) => setForm({ ...form, landlordName: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><label className="text-xs font-semibold">Landlord phone (if known)<input type="tel" maxLength={32} value={form.landlordPhone} onChange={(event) => setForm({ ...form, landlordPhone: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label></div>
            <label className="block text-xs font-semibold">Availability and room details<textarea required minLength={5} maxLength={1500} rows={4} value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            {submitError && <p role="alert" className="text-sm font-semibold text-red-700">{submitError}</p>}{submitMessage && <p role="status" className="text-sm font-semibold text-emerald-800">{submitMessage}</p>}
            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"><Send className="h-4 w-4" />{isSubmitting ? 'Submitting…' : 'Submit room lead'}</button>
          </form>
          <aside className="h-fit border-l-2 border-amber-500 pl-4"><div className="flex items-center gap-2 text-sm font-bold"><BedDouble className="h-4 w-4 text-amber-700" />Finder’s fee</div><p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">UniSoko records a finder’s fee only after the room is verified and successfully leased. The amount and payment are confirmed by the admin team; submitting a lead does not guarantee a payout.</p></aside>
        </section>
      </main>
      <CartDrawer />
    </div>
  );
}
