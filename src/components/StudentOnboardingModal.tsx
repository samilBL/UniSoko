'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, CreditCard, MapPin, ShoppingBag, Users, Wallet, X } from 'lucide-react';

interface StudentOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: 'Browse gadgets. Unlock Bei ya Jumla.',
    eyebrow: '01 · SHOP SMART',
    description: 'Compare inspected laptops, phones and everyday campus essentials. Add three or more of an item to reveal the bulk price.',
    icon: ShoppingBag,
    tone: 'from-indigo-600 to-indigo-800',
    action: { href: '#products-section', label: 'Explore the catalog' },
  },
  {
    title: 'Pay by Lipa Namba. Choose your campus.',
    eyebrow: '02 · PAY & PICK UP',
    description: 'Complete checkout with your mobile money transaction reference, then select your university and campus pickup or regional delivery details.',
    icon: CreditCard,
    tone: 'from-indigo-600 to-indigo-800',
    action: { href: '/checkout', label: 'Continue to checkout' },
  },
  {
    title: 'Become Campus Winga. Earn on every sale.',
    eyebrow: '03 · SHARE & EARN',
    description: 'Join from any university in Tanzania. Winga hub managers coordinate local campus hand-off after receiving bulk stock from UniSoko.',
    icon: Wallet,
    tone: 'from-indigo-600 to-indigo-800',
    action: { href: '/winga', label: 'Join the Winga network' },
  },
];

export default function StudentOnboardingModal({ isOpen, onClose }: StudentOnboardingModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const step = steps[activeStep];
  const StepIcon = step.icon;

  const advance = (direction: number) => setActiveStep((current) => (current + direction + steps.length) % steps.length);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="walkthrough-title">
          <motion.button aria-label="Close walkthrough" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl" />
          <motion.section initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.98 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }} className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-indigo-950/30 backdrop-blur-xl sm:p-9">
            <button aria-label="Close walkthrough" onClick={onClose} className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"><X className="h-4 w-4" /></button>
            <div className="pr-10">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Your UniSoko field guide</p>
              <h2 id="walkthrough-title" className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Campus shopping, made simple.</h2>
            </div>
            <div className="mt-6 flex gap-2" aria-label={`Step ${activeStep + 1} of ${steps.length}`}>
              {steps.map((item, index) => <button key={item.eyebrow} onClick={() => setActiveStep(index)} aria-label={`Go to step ${index + 1}`} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= activeStep ? 'bg-indigo-600' : 'bg-slate-200'}`} />)}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={activeStep} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.22 }} className="mt-6 grid gap-6 sm:grid-cols-[0.9fr_1.1fr]">
                <div className={`relative flex min-h-56 flex-col justify-between overflow-hidden rounded-3xl bg-linear-to-br ${step.tone} p-6 text-white`}>
                  <motion.div animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-md"><StepIcon className="h-8 w-8" /></motion.div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-white/80"><MapPin className="h-4 w-4" /> Built around your campus</div>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight">UniSoko<span className="text-white/65">.tz</span></p>
                  </div>
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/20" />
                </div>
                <div className="flex flex-col justify-center py-1">
                  <p className="text-xs font-bold tracking-widest text-indigo-600">{step.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-extrabold leading-tight text-slate-950 sm:text-2xl">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500"><Check className="h-4 w-4 text-emerald-600" /> Transparent campus-first experience</div>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link href={step.action.href} onClick={onClose} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700">{step.action.label}<ArrowRight className="h-4 w-4" /></Link>
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => advance(-1)} aria-label="Previous step" className="rounded-xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /></button>
                      <button onClick={() => advance(1)} aria-label="Next step" className="rounded-xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"><ArrowRight className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs text-slate-500"><span>Step {activeStep + 1} of 3</span><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-emerald-600" /> Students across Tanzania</span></div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
