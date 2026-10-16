import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const services = [
  ['Student marketplace', 'Browse campus-ready technology, books, and everyday student essentials from UniSoko and approved marketplace sellers.'],
  ['Campus delivery and order tracking', 'Choose supported campus hand-off or regional courier delivery and use the private tracking link supplied at checkout.'],
  ['Winga referrals', 'Approved campus Wingas share referral links and can receive eligible order attribution under the active program rules.'],
  ['Bulk and group buying', 'Eligible products show a quantity based wholesale price or a group-buy link so buyers can coordinate demand.'],
  ['Seller tools', 'Local businesses can apply to list products, manage approved listings, and review order and promotion activity.'],
  ['Trade-in and support', 'Request an indicative device valuation and contact support for order, warranty, or delivery questions.'],
];

export default function EverythingWeDoPage() {
  return <div className="flex min-h-screen flex-col bg-slate-950 text-white"><Header /><main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-12 sm:px-6"><p className="text-xs font-bold uppercase tracking-widest text-indigo-300">UniSoko Tanzania</p><h1 className="text-3xl font-black sm:text-4xl">Everything we do</h1><p className="max-w-3xl text-slate-300">UniSoko connects students, campus communities, and local businesses through practical marketplace and campus services.</p><div className="grid gap-4 sm:grid-cols-2">{services.map(([title, description]) => <article key={title} className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><h2 className="font-bold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{description}</p></article>)}</div><Link href="/about" className="font-semibold text-indigo-300 underline underline-offset-4">Who we are</Link></main><Footer /></div>;
}
