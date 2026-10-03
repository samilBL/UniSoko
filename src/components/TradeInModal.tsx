'use client';

import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react';
import { formatTZS } from '@/lib/mockData';
import {
  estimateTradeInPrice,
  TRADE_IN_INSPECTION_DISCLAIMER,
} from '@/lib/tradeInValuation';
import type {
  TradeInBatteryHealth,
  TradeInCategory,
  TradeInCosmeticCondition,
  TradeInScreenCondition,
  TradeInValuationInput,
} from '@/lib/tradeInValuation';
import type { TradeInQuoteAttachment, UniversityLocation } from '@/lib/types';

type TradeInModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onQuoted: (quote: TradeInQuoteAttachment) => void;
  selectedCampus: UniversityLocation;
  purchasePrice: number;
};

const PHOTO_MIN_BYTES = 1_000_000;
const PHOTO_MAX_BYTES = 3_000_000;
const MAX_PHOTOS = 3;
const BRANDS = ['Apple', 'Samsung', 'Google', 'Dell', 'HP', 'Lenovo', 'Asus', 'Xiaomi', 'Oppo', 'Huawei', 'Tecno', 'Infinix', 'Other'];
const RAM_OPTIONS = ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB', '32 GB'];
const STORAGE_OPTIONS = ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'];

const initialValuation: TradeInValuationInput = {
  category: 'Phone',
  brand: 'Samsung',
  model: '',
  ram: '8 GB',
  storage: '128 GB',
  cosmeticCondition: 'Light wear',
  screenCondition: 'Intact',
  batteryHealth: '80-89%',
  accessories: [],
};

export default function TradeInModal({ isOpen, onClose, onQuoted, selectedCampus, purchasePrice }: TradeInModalProps) {
  const [step, setStep] = useState(1);
  const [valuation, setValuation] = useState(initialValuation);
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const estimate = estimateTradeInPrice(valuation);

  if (!isOpen) return null;

  const updateValuation = <K extends keyof TradeInValuationInput>(key: K, value: TradeInValuationInput[K]) => {
    setValuation((current) => ({ ...current, [key]: value }));
  };

  const handlePhotoChange = (files: FileList | null) => {
    const selected = Array.from(files || []);
    if (selected.length < 2 || selected.length > MAX_PHOTOS) {
      setPhotos([]);
      setError('Choose 2 or 3 device photos.');
      return;
    }
    const invalidPhoto = selected.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      || file.size < PHOTO_MIN_BYTES || file.size > PHOTO_MAX_BYTES);
    if (invalidPhoto) {
      setPhotos([]);
      setError('Each JPG, PNG, or WebP photo must be between 1 MB and 3 MB.');
      return;
    }
    setError('');
    setPhotos(selected);
  };

  const submitQuote = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('request', JSON.stringify({
        purchaseLinked: true,
        studentName,
        phone,
        university: `${selectedCampus.name} (${selectedCampus.shortCode})`,
        itemTitle: `${valuation.brand} ${valuation.model}`.trim(),
        condition: `${valuation.cosmeticCondition}; ${valuation.screenCondition}; battery ${valuation.batteryHealth}`,
        specs: `${valuation.ram} RAM, ${valuation.storage} storage; included: ${valuation.accessories.join(', ') || 'no accessories'}`,
        ...valuation,
      }));
      photos.forEach((photo) => formData.append('photos', photo));
      const response = await fetch('/api/trade-ins', { method: 'POST', body: formData });
      const result = await response.json() as { id?: string; quoteToken?: string; estimatedPrice?: number; itemTitle?: string; error?: string };
      if (!response.ok || !result.id || !result.quoteToken || !Number.isFinite(result.estimatedPrice)) {
        throw new Error(result.error || 'Could not create a trade-in estimate.');
      }
      onQuoted({
        requestId: result.id,
        token: result.quoteToken,
        estimatedPrice: result.estimatedPrice as number,
        itemTitle: result.itemTitle || `${valuation.brand} ${valuation.model}`.trim(),
      });
      setStep(1);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create a trade-in estimate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClass = 'mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20';
  const labelClass = 'block text-xs font-semibold text-slate-700';

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="trade-in-title" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Instant purchase estimate</p><h2 id="trade-in-title" className="mt-1 text-lg font-bold text-slate-950">Trade in your device</h2></div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Close trade-in form" className="rounded-md p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
        </header>
        <div className="flex gap-2 px-5 pt-4 sm:px-7" aria-label={`Step ${step} of 3`}>
          {['Device', 'Condition', 'Photos'].map((label, index) => <div key={label} className={`h-1.5 flex-1 rounded-full ${step >= index + 1 ? 'bg-emerald-600' : 'bg-slate-200'}`} title={label} />)}
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
          {step === 1 && <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>Category<select className={selectClass} value={valuation.category} onChange={(event) => updateValuation('category', event.target.value as TradeInCategory)}>{(['Phone', 'Tablet', 'Laptop'] as const).map((category) => <option key={category}>{category}</option>)}</select></label>
              <label className={labelClass}>Brand<select className={selectClass} value={valuation.brand} onChange={(event) => updateValuation('brand', event.target.value)}>{BRANDS.map((brand) => <option key={brand}>{brand}</option>)}</select></label>
              <label className={`${labelClass} sm:col-span-2`}>Model<input className={selectClass} required maxLength={100} value={valuation.model} onChange={(event) => updateValuation('model', event.target.value)} placeholder="e.g. Galaxy A54 or ThinkPad T14" /></label>
              <label className={labelClass}>RAM<select className={selectClass} value={valuation.ram} onChange={(event) => updateValuation('ram', event.target.value)}>{RAM_OPTIONS.map((ram) => <option key={ram}>{ram}</option>)}</select></label>
              <label className={labelClass}>Storage<select className={selectClass} value={valuation.storage} onChange={(event) => updateValuation('storage', event.target.value)}>{STORAGE_OPTIONS.map((storage) => <option key={storage}>{storage}</option>)}</select></label>
            </div>
          </>}
          {step === 2 && <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Cosmetic wear<select className={selectClass} value={valuation.cosmeticCondition} onChange={(event) => updateValuation('cosmeticCondition', event.target.value as TradeInCosmeticCondition)}>{(['Excellent', 'Light wear', 'Visible wear', 'Heavy damage'] as const).map((condition) => <option key={condition}>{condition}</option>)}</select></label>
            <label className={labelClass}>Screen condition<select className={selectClass} value={valuation.screenCondition} onChange={(event) => updateValuation('screenCondition', event.target.value as TradeInScreenCondition)}>{(['Intact', 'Minor scratches', 'Cracked', 'Not working'] as const).map((condition) => <option key={condition}>{condition}</option>)}</select></label>
            <label className={labelClass}>Battery health<select className={selectClass} value={valuation.batteryHealth} onChange={(event) => updateValuation('batteryHealth', event.target.value as TradeInBatteryHealth)}>{(['90%+', '80-89%', '70-79%', 'Below 70%', 'Unknown'] as const).map((health) => <option key={health}>{health}</option>)}</select></label>
            <fieldset className="space-y-2"><legend className={labelClass}>Included accessories</legend>{[['charger', 'Charger'], ['originalBox', 'Original box'], ['case', 'Protective case']].map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={valuation.accessories.includes(key)} onChange={(event) => updateValuation('accessories', event.target.checked ? [...valuation.accessories, key] : valuation.accessories.filter((item) => item !== key))} />{label}</label>)}</fieldset>
          </div>}
          {step === 3 && <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>Your name<input className={selectClass} required value={studentName} onChange={(event) => setStudentName(event.target.value)} maxLength={120} /></label>
              <label className={labelClass}>Mobile number<input className={selectClass} required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={32} placeholder="+255 7XX XXX XXX" /></label>
            </div>
            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center hover:border-emerald-600">
              <ImagePlus className="h-6 w-6 text-emerald-700" /><span className="text-sm font-semibold text-slate-800">Choose 2 or 3 device photos</span><span className="text-xs text-slate-500">JPG, PNG, or WebP. Each photo must be 1-3 MB.</span>
              <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => handlePhotoChange(event.target.files)} />
            </label>
            {photos.length > 0 && <ul className="space-y-1 text-xs text-slate-600">{photos.map((photo) => <li key={`${photo.name}-${photo.lastModified}`} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-700" />{photo.name} ({(photo.size / 1_000_000).toFixed(1)} MB)</li>)}</ul>}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-4 text-sm"><span className="text-slate-700">Trade-in estimate</span><strong className="text-lg text-emerald-800">-{formatTZS(estimate)}</strong></div>
              {purchasePrice > 0 && <p className="mt-1 text-xs font-semibold text-slate-800">Item price {formatTZS(purchasePrice)} - estimate {formatTZS(estimate)} = pay {formatTZS(Math.max(0, purchasePrice - estimate))}</p>}
              <p className="mt-2 text-[11px] leading-5 text-slate-600">{TRADE_IN_INSPECTION_DISCLAIMER}</p>
            </div>
          </div>}
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">{error}</p>}
        </div>
        <footer className="flex items-center justify-between border-t border-slate-200 px-5 py-4 sm:px-7">
          <button type="button" onClick={() => { setError(''); setStep((current) => Math.max(1, current - 1)); }} disabled={step === 1 || isSubmitting} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:invisible"><ChevronLeft className="h-4 w-4" />Back</button>
          {step < 3 ? <button type="button" onClick={() => { if (step === 1 && !valuation.model.trim()) { setError('Enter the device model.'); return; } setError(''); setStep((current) => current + 1); }} className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800">Continue<ChevronRight className="h-4 w-4" /></button> : <button type="button" onClick={() => { if (photos.length < 2) { setError('Choose 2 or 3 valid photos first.'); return; } if (!studentName.trim() || !phone.trim()) { setError('Enter your name and mobile number.'); return; } void submitQuote(); }} disabled={isSubmitting} className="min-h-10 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{isSubmitting ? 'Saving estimate…' : 'Apply trade-in estimate'}</button>}
        </footer>
      </section>
    </div>
  );
}
