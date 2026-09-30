'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { useStore } from '@/context/StoreContext';
import { ALL_UNIVERSITIES, OTHER_TANZANIA_UNIVERSITY, formatTZS } from '@/lib/mockData';
import { ProductCategory, TradeInCondition, TradeInRequest } from '@/lib/types';
import {
  CheckCircle2,
  Sparkles,
  Camera,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { createWhatsAppLink } from '@/lib/whatsapp';

export default function SellDevicePage() {
  const { submitTradeInRequest, selectedCampus, storeSettings } = useStore();

  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState(selectedCampus?.name || ALL_UNIVERSITIES[0]?.name || '');
  const [otherUniversity, setOtherUniversity] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Laptops');
  const [condition, setCondition] = useState<TradeInCondition>('Like-New (Grade A)');
  const [specs, setSpecs] = useState('');
  const [expectedPrice, setExpectedPrice] = useState<number | ''>('');
  const imageUrl = 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80';
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [submissionError, setSubmissionError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [submittedReq, setSubmittedReq] = useState<TradeInRequest | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !phone || !itemTitle || !expectedPrice) return;
    if (photoError) return;

    const newReq: TradeInRequest = {
      id: `TRD-${new Date().getFullYear()}-${crypto.randomUUID()}`,
      studentName: studentName.trim(),
      phone: phone.trim(),
      university: university === OTHER_TANZANIA_UNIVERSITY.name ? otherUniversity.trim() : university,
      itemTitle: itemTitle.trim(),
      category,
      condition,
      specs: specs.trim(),
      expectedPrice: Number(expectedPrice),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
      imageUrls,
      status: 'Pending Review',
      submittedAt: new Date().toISOString(),
    };

    setSubmissionError('');
    const formData = new FormData();
    formData.set('request', JSON.stringify(newReq, (key, value: unknown) => key === 'imageUrl' || key === 'imageUrls' ? undefined : value));
    photoFiles.forEach((file) => formData.append('photos', file));
    try {
      const response = await fetch('/api/trade-ins', { method: 'POST', body: formData });
      if (response.ok) {
        const saved = await response.json() as { id: string };
        newReq.id = saved.id;
      } else if (response.status !== 503) {
        const responseBody = await response.json() as { error?: string };
        setSubmissionError(responseBody.error || 'Unable to submit. Please try again.');
        return;
      }
    } catch {
      // Continue with the existing local-first demo store when the API is unavailable.
    }
    submitTradeInRequest(newReq);
    setSubmittedReq(newReq);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Instant Campus Cash For Your Used Tech</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Sell or Trade-In Your Gadget
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Upgrade your laptop or phone. Get a fair valuation and same-day payment in cash or M-Pesa directly at your campus hostel.
          </p>
        </div>

        {submittedReq ? (
          /* Submission Confirmation View */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl dark:border-slate-800 dark:bg-slate-900 text-center space-y-6"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shadow-md">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                <Clock className="h-3.5 w-3.5" />
                Ref ID: #{submittedReq.id}
              </span>
              <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                Hongera {submittedReq.studentName}!
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Your device submission for <span className="font-bold">{submittedReq.itemTitle}</span> has been received.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60 text-left space-y-2.5 text-xs border border-slate-200/80 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Price:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatTZS(submittedReq.expectedPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Condition:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {submittedReq.condition}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Campus Pickup:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {submittedReq.university}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50/80 p-4 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 text-left border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Next Step:</p>
                <p className="mt-0.5 leading-relaxed text-[11px]">
                  Our campus inspector will review your specs and contact you at <span className="font-bold">{submittedReq.phone}</span> within 2 to 4 hours to arrange device testing and payout.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={createWhatsAppLink(storeSettings?.supportWhatsApp || '0616961511', `Habari UniSoko! Nimewasilisha ombi la kuuza kifaa changu (Ref: #${submittedReq.id} - ${submittedReq.itemTitle}). Nipo ${submittedReq.university}.`)}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
              >
                <span>Chat with Inspector on WhatsApp</span>
              </a>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-all"
              >
                <span>Browse Store</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Submission Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column */}
            <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md dark:border-slate-800 dark:bg-slate-900">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Student Identity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Baraka Mwita"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Phone Number (WhatsApp / Calls) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+255 7XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                {/* University Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    University Campus
                  </label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {ALL_UNIVERSITIES.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.shortCode})
                      </option>
                    ))}
                  </select>
                  {university === OTHER_TANZANIA_UNIVERSITY.name && <input required value={otherUniversity} onChange={(event) => setOtherUniversity(event.target.value)} placeholder="Enter university name and campus" className="mt-3 w-full rounded-xl p-3 text-xs" />}
                </div>

                {/* 2. Device Details */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Gadget Model & Brand *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HP EliteBook 840 G5 (16GB RAM)"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProductCategory)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="Laptops">Laptops & Computers</option>
                      <option value="Phones">Smartphones & Tablets</option>
                      <option value="Accessories">Accessories & Gadgets</option>
                      <option value="Power & Audio">Power & Audio</option>
                      <option value="Campus Essentials">Campus Essentials</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Device Condition
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as TradeInCondition)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="Like-New (Grade A)">Like-New (Grade A - Flawless)</option>
                      <option value="Gently Used (Grade B)">Gently Used (Grade B - Light Scratches)</option>
                      <option value="Brand New">Brand New (Box Unopened)</option>
                      <option value="Needs Repair">Needs Minor Repair / Battery Swap</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Expected Cash Price (TZS) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 450000"
                      value={expectedPrice}
                      onChange={(e) => setExpectedPrice(e.target.value ? Number(e.target.value) : '')}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                {/* Specs & Hardware description */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Hardware Specifications & Included Items
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Intel Core i5 8th Gen, 8GB RAM, 256GB SSD, battery health 88%, comes with original fast charger."
                    value={specs}
                    onChange={(e) => setSpecs(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                  />
                </div>

                {/* Multi-photo upload with strict client validation */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    <Camera className="h-4 w-4 text-indigo-600" />
                    Device Photos (each photo must be 1–3 MB)
                  </label>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    setPhotoError('');
                    if (files.length > 3) { setPhotoFiles([]); setImageUrls([]); setPhotoError('Choose up to 3 photos.'); event.target.value = ''; return; }
                    const invalidFile = files.find((file) => file.size < 1_000_000 || file.size > 3_000_000);
                    if (invalidFile) { setPhotoFiles([]); setImageUrls([]); setPhotoError(`${invalidFile.name} must be between 1 MB and 3 MB.`); event.target.value = ''; return; }
                    setPhotoFiles(files);
                    Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read photo.'));
                      reader.onerror = () => reject(new Error('Could not read photo.'));
                      reader.readAsDataURL(file);
                    }))).then(setImageUrls).catch(() => setPhotoError('Unable to read the selected photos.'));
                  }} className="mt-2 w-full rounded-xl p-3 text-xs" />
                  <p className="mt-1 text-[11px] text-slate-500">JPG, PNG, or WebP · up to 3 photos · 1–3 MB each.</p>
                  {photoError && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{photoError}</p>}
                  {imageUrls.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{imageUrls.map((url, index) => <div key={index} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200"><Image src={url} alt={`Device preview ${index + 1}`} fill unoptimized className="object-cover" /></div>)}</div>}
                </div>

                {submissionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">{submissionError}</p>}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <DollarSign className="h-5 w-5 text-emerald-300" />
                  <span>Submit Gadget for Campus Valuation</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Sidebar Value Props */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Why Trade-In With UniSoko?
                </h3>

                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Instant Hostel Payout</p>
                      <p className="text-[11px] text-slate-500">No waiting weeks for random buyers. We pay cash or M-Pesa on the spot.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Trade-In Upgrade Credit</p>
                      <p className="text-[11px] text-slate-500">Swap your old device directly for a MacBook or higher-tier HP/Dell laptop.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Safe Campus Hand-Off</p>
                      <p className="text-[11px] text-slate-500">Meet our verified student inspectors right inside campus hostels or landmark pavilions.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Notice */}
              <div className="rounded-2xl bg-indigo-50/70 p-4 border border-indigo-100 text-xs text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900">
                <p className="font-bold">Need instant appraisal?</p>
                <p className="mt-1 text-[11px]">
                  Send photos of your laptop or phone directly to WhatsApp: <span className="font-bold">{storeSettings?.supportPhone || '+255 754 892 110'}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <CartDrawer />
    </div>
  );
}
