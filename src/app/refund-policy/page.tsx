/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import { ArrowLeft, RotateCcw, PackageCheck, AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 backdrop-blur-lg bg-white/80 border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to UniSoko
          </Link>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Legal Documentation
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-10">
        {/* Hero */}
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-8 text-slate-900 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-2xl bg-white p-3">
              <RotateCcw className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest block">
                UniSoko Tanzania
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-heading">
                Refund & Warranty Policy
              </h1>
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed max-w-2xl">
            We stand behind every gadget we sell. This policy outlines your rights for returns, replacements, and warranty claims for both brand-new and refurbished devices purchased through UniSoko.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="rounded-xl border border-indigo-100 bg-white px-3 py-1.5 font-semibold text-slate-700">Effective: September 1, 2026</span>
            <span className="rounded-xl border border-indigo-100 bg-white px-3 py-1.5 font-semibold text-slate-700">Applies: All UniSoko Orders</span>
          </div>
        </div>

        {/* Quick Reference Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
              label: 'Brand New Gadgets',
              period: '14-Day Returns',
              note: 'Full refund if unopened / unused',
              bg: 'bg-emerald-50 border-emerald-200',
              text: 'text-emerald-900',
            },
            {
              icon: <Wrench className="h-5 w-5 text-indigo-600" />,
              label: 'Grade A / Refurbished',
              period: '7-Day Exchange',
              note: 'Hardware fault exchange only',
              bg: 'bg-indigo-50 border-indigo-200',
              text: 'text-indigo-900',
            },
            {
              icon: <Clock className="h-5 w-5 text-amber-600" />,
              label: 'Warranty Period',
              period: '3 Months',
              note: 'From verified delivery date',
              bg: 'bg-amber-50 border-amber-200',
              text: 'text-amber-900',
            },
          ].map((card) => (
            <div key={card.label} className={`rounded-2xl border p-5 ${card.bg} flex flex-col gap-2`}>
              {card.icon}
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</span>
              <span className={`text-lg font-black ${card.text}`}>{card.period}</span>
              <span className="text-xs text-slate-600">{card.note}</span>
            </div>
          ))}
        </div>

        <RefundSection icon={<PackageCheck className="h-5 w-5 text-emerald-600" />} title="1. Brand New Gadgets — Return & Refund">
          <p>For gadgets listed as <strong>Brand New</strong> on UniSoko:</p>
          <ul>
            <li><strong>14-Day Return Window:</strong> You may return a brand-new, sealed gadget within 14 calendar days of confirmed delivery for a full refund of the purchase price.</li>
            <li><strong>Condition Requirement:</strong> The item must be returned in its original sealed packaging with all accessories, documentation, and the original purchase receipt.</li>
            <li><strong>Opened but Unused:</strong> If the box has been opened but the device is in factory-pristine condition (no scratch, no setup, no SIM), UniSoko may accept a return with a 10% restocking fee at our discretion.</li>
            <li><strong>Refund Method:</strong> Refunds are processed to the original mobile money number used for payment within <strong>3–5 business days</strong> after the device is physically received and inspected at our campus office.</li>
            <li><strong>Non-returnable Items:</strong> Consumables (screen protectors applied at point of sale, headphone foam tips, cable packs once opened) are non-returnable.</li>
          </ul>
        </RefundSection>

        <RefundSection icon={<Wrench className="h-5 w-5 text-indigo-600" />} title="2. Grade A / Refurbished Gadgets — Exchange Policy">
          <p>For gadgets listed as <strong>Grade A Like-New</strong> or <strong>Refurbished</strong>:</p>
          <ul>
            <li><strong>7-Day Hardware Fault Exchange:</strong> If a verified hardware fault is identified within 7 calendar days of delivery, UniSoko will exchange the device for an identical or equivalent unit at no extra cost.</li>
            <li><strong>What Qualifies:</strong> Faulty display, non-functioning charging port, battery draining to zero within 2 hours of full charge, non-responsive buttons, or speaker/camera malfunction.</li>
            <li><strong>What Does Not Qualify:</strong> Physical damage caused by the buyer (dropped device, water exposure, cracked screen post-delivery), software issues related to buyer-installed apps, or cosmetic wear described in the original listing.</li>
            <li><strong>Assessment Process:</strong> The buyer must bring the device to the UniSoko campus contact point within the 7-day window. Our technician will assess the fault within 24 hours.</li>
            <li><strong>Cash Refunds for Refurbished Devices:</strong> Cash or mobile money refunds are only issued if an identical exchange unit is unavailable within 5 business days of the confirmed fault assessment.</li>
          </ul>
        </RefundSection>

        <RefundSection icon={<Clock className="h-5 w-5 text-amber-600" />} title="3. Warranty Coverage — 3 Months">
          <p>All gadgets sold through UniSoko carry a <strong>3-month limited hardware warranty</strong> from the date of confirmed delivery:</p>
          <ul>
            <li><strong>Covered:</strong> Manufacturing defects, unexpected hardware failures not caused by physical or liquid damage, and battery degradation beyond 30% within the warranty period.</li>
            <li><strong>Not Covered:</strong> Accidental damage, water damage, unauthorised repair attempts, software issues, lost or stolen devices, and normal wear and tear (e.g., cosmetic scratches, keyboard keycap wear).</li>
            <li><strong>Claim Process:</strong> Contact UniSoko via WhatsApp (+255 616 961 511) with your Order ID and a short video demonstrating the fault. Our team will respond within 24 hours with next steps.</li>
            <li><strong>Warranty Repair:</strong> Where repair is possible, UniSoko will arrange free in-campus repair. If repair is not feasible, a like-for-like replacement will be provided.</li>
          </ul>
        </RefundSection>

        <RefundSection icon={<AlertTriangle className="h-5 w-5 text-red-500" />} title="4. Non-Eligible Claims & Exceptions">
          <p>The following situations are <strong>not eligible</strong> for returns, exchanges, or warranty claims:</p>
          <ul>
            <li>Devices where the buyer has broken the warranty seal or opened the chassis for self-repair.</li>
            <li>Accessories (chargers, cables, bags) once opened and used — unless proven to be non-functional at delivery.</li>
            <li>Orders where the Lipa Namba transaction ID was not verified and the order was not approved by UniSoko admin.</li>
            <li>Devices submitted for trade-in are assessed on a separate agreement basis. A checkout estimate remains provisional until the required physical inspection is recorded.</li>
            <li>Devices reported as faults after the applicable return/exchange/warranty window has expired.</li>
          </ul>
        </RefundSection>

        <RefundSection icon={<RotateCcw className="h-5 w-5 text-indigo-600" />} title="5. How to Initiate a Return or Warranty Claim">
          <p>To start a return or warranty claim:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Contact UniSoko on WhatsApp at <strong>+255 616 961 511</strong> with your Order ID and the issue description.</li>
            <li>Our team will confirm eligibility and provide a return/exchange reference number within 24 hours.</li>
            <li>Bring the device (and original packaging if available) to the agreed UniSoko campus pick-up point.</li>
            <li>After inspection, refunds are processed within 3–5 business days or an exchange unit is provided on the spot.</li>
          </ol>
          <p className="mt-3 text-slate-500 text-xs">Claims initiated without a reference number will not be processed. Shipping costs for returns sent via courier are the buyer's responsibility unless the device was confirmed dead-on-arrival.</p>
        </RefundSection>

        {/* Contact */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 text-xs space-y-2">
          <h2 className="text-sm font-bold font-heading">Returns & Warranty Contact</h2>
          <p className="text-slate-300">WhatsApp (preferred): +255 616 961 511</p>
          <p className="text-slate-300">Email: qwazerty01012001@gmail.com | Campus: MUST, Mbeya, Tanzania</p>
          <p className="text-slate-400 mt-2">Operating Hours: Monday – Saturday, 8:00 AM – 7:00 PM EAT</p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-semibold text-indigo-600 border-t border-slate-200 pt-6">
          <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          <span className="text-slate-300">|</span>
          <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
          <span className="text-slate-300">|</span>
          <Link href="/" className="hover:underline">← Return to Store</Link>
        </div>
      </main>
    </div>
  );
}

function RefundSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">{icon}</div>
        <h2 className="text-base font-bold text-slate-900 font-heading">{title}</h2>
      </div>
      <div className="text-sm text-slate-700 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-2 [&_li]:leading-relaxed">
        {children}
      </div>
    </section>
  );
}
