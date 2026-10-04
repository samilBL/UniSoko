'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin, TrendingUp, Vote, Wallet } from 'lucide-react';
import { CAMPUS_EXPANSION_UNIVERSITIES, MBEYA_UNIVERSITIES } from '@/lib/mockData';
import { formatTZS } from '@/lib/mockData';

const VOTES_KEY = 'unisoko_campus_votes';
const VOTER_KEY = 'unisoko_campus_voter';
const HAS_VOTED_KEY = 'unisoko_campus_vote_cast';

export default function CampusEngagement() {
  const [weeklySales, setWeeklySales] = useState(500000);
  const [campusId, setCampusId] = useState(CAMPUS_EXPANSION_UNIVERSITIES[0]?.id || '');
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState(false);
  const [voterId, setVoterId] = useState('');
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteError, setVoteError] = useState('');

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(VOTES_KEY);
        if (saved) setVotes(JSON.parse(saved) as Record<string, number>);
        setVoted(localStorage.getItem(HAS_VOTED_KEY) === 'true');
        const savedVoterId = localStorage.getItem(VOTER_KEY) || crypto.randomUUID();
        localStorage.setItem(VOTER_KEY, savedVoterId);
        setVoterId(savedVoterId);
      } catch {
        setVotes({});
        setVoteError('This browser cannot save a persistent vote identifier. Enable site storage to vote.');
      }
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    fetch('/api/campus-votes', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ votes?: Record<string, number> }> : null)
      .then((result) => { if (result?.votes) setVotes(result.votes); })
      .catch(() => undefined);
  }, []);

  const popularCampus = useMemo(() => Object.entries(votes)
    .filter(([id]) => CAMPUS_EXPANSION_UNIVERSITIES.some((university) => university.id === id))
    .sort((a, b) => b[1] - a[1])[0], [votes]);
  const projectedEarnings = Math.round(weeklySales * 0.05);

  const submitVote = async () => {
    if (!campusId || voted || !voterId || isSubmittingVote) return;
    setIsSubmittingVote(true);
    setVoteError('');
    try {
      const response = await fetch('/api/campus-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campusId, voterId }),
      });
      if (response.status === 409) {
        setVoted(true);
        localStorage.setItem(HAS_VOTED_KEY, 'true');
        setVoteError('A vote has already been recorded from this browser.');
        return;
      }
      if (!response.ok) throw new Error('Could not record your vote. Please retry.');
      const nextVotes = { ...votes, [campusId]: (votes[campusId] || 0) + 1 };
      setVotes(nextVotes);
      setVoted(true);
      localStorage.setItem(VOTES_KEY, JSON.stringify(nextVotes));
      localStorage.setItem(HAS_VOTED_KEY, 'true');
    } catch (error) {
      setVoteError(error instanceof Error ? error.message : 'Could not record your vote. Please retry.');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  return (
    <section className="grid gap-5 lg:grid-cols-2" aria-label="Winga earnings and campus expansion">
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-2xl shadow-indigo-500/5 backdrop-blur-xl sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Wallet className="h-5 w-5" /></div>
          <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Winga earnings estimator</p><h3 className="mt-1 text-lg font-extrabold text-slate-950">Your weekly effort, made tangible.</h3></div>
        </div>
        <div className="mt-7 rounded-2xl bg-slate-950 p-5 text-white">
          <div className="flex items-center justify-between gap-3"><label htmlFor="weekly-sales" className="text-sm font-medium text-slate-300">Estimated weekly sales</label><span className="text-sm font-bold">{formatTZS(weeklySales)}</span></div>
          <input id="weekly-sales" type="range" min="100000" max="5000000" step="50000" value={weeklySales} onChange={(event) => setWeeklySales(Number(event.target.value))} className="mt-5 w-full accent-emerald-400" />
          <div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-xs text-slate-400">Projected commission · 5%</p><p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-300">{formatTZS(projectedEarnings)}</p></div><TrendingUp className="mb-1 h-7 w-7 text-emerald-400" /></div>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">Illustrative estimate only. Actual commissions depend on approved, completed sales.</p>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-2xl shadow-indigo-500/5 backdrop-blur-xl sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><MapPin className="h-5 w-5" /></div>
          <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Tanzania campus expansion</p><h3 className="mt-1 text-lg font-extrabold text-slate-950 dark:text-white">Where should UniSoko launch next?</h3></div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Choose your university or campus in Tanzania and vote to help us plan delivery, hostel pickup points, and Winga support for your area.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <select aria-label="Choose a university campus" value={campusId} onChange={(event) => setCampusId(event.target.value)} className="min-w-0 flex-1 rounded-xl px-3 py-3 text-sm">
            {[...MBEYA_UNIVERSITIES.map((university) => ({ ...university, region: university.region || university.city })), ...CAMPUS_EXPANSION_UNIVERSITIES.filter((university) => !MBEYA_UNIVERSITIES.some((campus) => campus.id === university.id))]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((university) => <option key={university.id} value={university.id}>{university.name} · {university.region}</option>)}
          </select>
          <button onClick={() => void submitVote()} disabled={voted || !campusId || !voterId || isSubmittingVote} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-default disabled:bg-emerald-700"><Vote className="h-4 w-4" />{isSubmittingVote ? 'Recording…' : voted ? 'Vote recorded' : 'Vote for campus'}</button>
        </div>
        {voteError && <p role="status" className="mt-3 text-xs font-semibold text-amber-800">{voteError}</p>}
        <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-100">
          {popularCampus ? <><span className="font-bold">Leading university:</span> {CAMPUS_EXPANSION_UNIVERSITIES.find((university) => university.id === popularCampus[0])?.name || popularCampus[0]} · {popularCampus[1]} {popularCampus[1] === 1 ? 'vote' : 'votes'}</> : <span>Be the first to vote for a university in Tanzania.</span>}
        </div>
      </div>
    </section>
  );
}
