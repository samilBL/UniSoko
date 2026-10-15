'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { UNISOKO_CONTACT } from '@/lib/siteConfig';
import { createWhatsAppLink } from '@/lib/whatsapp';
import {
  Briefcase,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Users,
  MapPin,
  Clock,
  Sparkles,
  Send,
  MessageCircle,
  FileText,
  DollarSign,
  GraduationCap,
  X,
} from 'lucide-react';

interface CareerRole {
  id: string;
  title: string;
  department: string;
  type: string;
  campuses: string;
  compensation: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
}

const ROLES: CareerRole[] = [
  {
    id: 'role-winga-lead',
    title: 'Campus Winga Lead (Student Ambassador)',
    department: 'Campus Community & Growth',
    type: 'Student Flexible (Part-Time)',
    campuses: 'MUST, UDSM, CBE, DIT, IFM',
    compensation: 'Tiered Commission + Weekly Performance Stipend',
    description:
      'Represent UniSoko at your university. Coordinate local student group buys, answer peer tech questions, and lead your campus student referral team.',
    responsibilities: [
      'Organize 24-hour squad group buys across hostel blocks and student groups',
      'Act as the friendly campus point of contact for gadgets and warranty questions',
      'Distribute promotional materials and coordinate campus rush activations',
    ],
    requirements: [
      'Currently enrolled university student at a supported Tanzanian campus',
      'Active on campus WhatsApp groups and student clubs',
      'Trustworthy, communicative, and passionate about tech devices',
    ],
  },
  {
    id: 'role-qa-inspector',
    title: 'Student Tech Inspector & QA Specialist',
    department: 'Hardware Operations',
    type: 'Part-Time / Campus Based',
    campuses: 'MUST (Mbeya Main Hub)',
    compensation: 'Competitive Hourly Rate + Tech Equipment Allowance',
    description:
      'Perform hands-on physical inspection and testing of laptops, smartphones, and trade-in items before final campus hand-off to buyers.',
    responsibilities: [
      'Run battery health benchmarks, display pixel checks, and keyboard testing',
      'Verify serial numbers and generate digital warranty certificates',
      'Assist with trade-in device inspections alongside campus buyers',
    ],
    requirements: [
      'Knowledge of PC hardware, Windows OS, and smartphone diagnostics',
      'Enrolled in Computer Science, Engineering, or relevant technical program',
      'High attention to detail and honest hardware reporting',
    ],
  },
  {
    id: 'role-logistics-runner',
    title: 'Campus Logistics & Delivery Runner',
    department: 'Fulfillment & Logistics',
    type: 'Flexible Student Shifts',
    campuses: 'All Campuses (MUST, UDSM, CBE, DIT)',
    compensation: 'Per-Delivery Payout + Milestone Bonuses',
    description:
      'Conduct safe, prompt in-person order hand-offs to students at hostel rooms or designated campus landmarks.',
    responsibilities: [
      'Pick up verified orders from campus central dispatch point',
      'Meet student buyers at their chosen hostel landmark within 24 hours',
      'Verify buyer identity via order confirmation security token',
    ],
    requirements: [
      'Familiarity with hostel layouts, campus gates, and block numbering',
      'Punctual, friendly, and reliable with a working smartphone',
    ],
  },
  {
    id: 'role-dev-intern',
    title: 'Full-Stack Web Development Intern',
    department: 'Software Engineering',
    type: 'Remote / Hybrid Internship',
    campuses: 'All Tanzania Campuses',
    compensation: 'Monthly Internship Stipend + Official Mentorship',
    description:
      'Collaborate directly with the lead developer to enhance UniSoko’s Next.js, TypeScript, and PWA mobile commerce architecture.',
    responsibilities: [
      'Build responsive UI components and streamline checkout and tracking workflows',
      'Write modular React code and optimize database queries',
      'Participate in code reviews, bug fixes, and feature design discussions',
    ],
    requirements: [
      'Proficiency with HTML, CSS, JavaScript/TypeScript, and React',
      'Familiarity with Git/GitHub and modern web APIs',
      'Eager student developer looking for high-impact production experience',
    ],
  },
];

export default function CareersPage() {
  const [selectedRole, setSelectedRole] = useState<CareerRole | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [campus, setCampus] = useState('MUST (Mbeya)');
  const [resumeLink, setResumeLink] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleOpenApplication = (role: CareerRole) => {
    setSelectedRole(role);
    setIsModalOpen(true);
    setSubmitted(false);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate direct submission (can also log / alert)
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const getWhatsAppApplyUrl = (role: CareerRole) => {
    const text = `Habari UniSoko Careers! I want to apply for the position: ${role.title} at ${campus}. My name is ${name || '[My Name]'}.`;
    return createWhatsAppLink(UNISOKO_CONTACT.phoneDigits, text);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 space-y-12">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-bold text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Storefront</span>
          </Link>
          <span className="font-bold uppercase tracking-wider text-indigo-400 text-[10px]">
            UniSoko Careers Portal
          </span>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-b from-indigo-950/40 via-slate-900 to-slate-900 p-8 sm:p-12 text-center space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-300">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Join Our Growing Campus Crew</span>
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Earn, Build, and Lead on Your Campus.
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
            UniSoko is scaling rapidly across Tanzania. We offer student-friendly positions, flexible campus hours, competitive compensation, and real-world leadership experience.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#open-roles"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition-all"
            >
              <span>View Open Roles ({ROLES.length})</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/winga/register"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-6 py-3.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40 transition-all"
            >
              <Users className="h-4 w-4" />
              <span>Campus Winga Fast Track</span>
            </Link>
          </div>
        </section>

        {/* Perks Section */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Clock className="h-4 w-4" />
              <span>Student Schedule Friendly</span>
            </div>
            <p className="text-sm font-bold text-white">100% Coursework Compatible</p>
            <p className="text-xs text-slate-400">
              Set your own hours around lecture times, test schedules, and exam periods.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <DollarSign className="h-4 w-4" />
              <span>Weekly Payouts</span>
            </div>
            <p className="text-sm font-bold text-white">Direct Lipa / M-Pesa</p>
            <p className="text-xs text-slate-400">
              Clear, transparent payouts delivered directly to your mobile wallet weekly.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
              <GraduationCap className="h-4 w-4" />
              <span>Official Recommendation</span>
            </div>
            <p className="text-sm font-bold text-white">Verified Career Letter</p>
            <p className="text-xs text-slate-400">
              Gain verified work letters, certificates, and LinkedIn endorsements upon graduation.
            </p>
          </div>
        </section>

        {/* Open Roles Listing */}
        <section id="open-roles" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-black text-white">Current Opportunities</h2>
              <p className="text-xs text-slate-400">All positions open to enrolled university students.</p>
            </div>
            <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
              {ROLES.length} Open Positions
            </span>
          </div>

          <div className="space-y-4">
            {ROLES.map((role) => (
              <div
                key={role.id}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/20">
                        {role.department}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                        {role.type}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white">{role.title}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenApplication(role)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-500 transition-all shrink-0"
                  >
                    <span>Apply for Role</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {role.description}
                </p>

                <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <p className="font-bold text-slate-200 mb-1">Key Responsibilities:</p>
                    <ul className="space-y-1 text-slate-400">
                      {role.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="font-bold text-slate-200 mb-1">Requirements:</p>
                    <ul className="space-y-1 text-slate-400">
                      {role.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-400 shrink-0 font-bold">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Locations: {role.campuses}</span>
                  </span>
                  <span className="font-bold text-emerald-400">
                    💰 {role.compensation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Application Modal */}
        {isModalOpen && selectedRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl text-white">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="pr-8">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Application Form
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {selectedRole.title}
                </h3>
              </div>

              {submitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Application Received!</h4>
                  <p className="text-xs text-slate-300 max-w-xs mx-auto">
                    Hongera {name}! Our team will review your application and message your WhatsApp at{' '}
                    <strong className="text-white">{phone}</strong>.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-xl bg-slate-800 border border-slate-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="mt-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Grace Mwangi"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300">WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+255 7..."
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300">University Campus *</label>
                      <select
                        value={campus}
                        onChange={(e) => setCampus(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                      >
                        <option>MUST (Mbeya)</option>
                        <option>UDSM (Dar es Salaam)</option>
                        <option>CBE (Dar / Dodoma)</option>
                        <option>DIT (Dar es Salaam)</option>
                        <option>IFM (Dar es Salaam)</option>
                        <option>Other Tanzanian Campus</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@campus.ac.tz"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300">
                      LinkedIn / CV Link (Google Drive / GitHub)
                    </label>
                    <input
                      type="url"
                      value={resumeLink}
                      onChange={(e) => setResumeLink(e.target.value)}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300">
                      Why are you excited for this role?
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Brief note about your year of study, program, or relevant student experience..."
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isSubmitting ? 'Submitting…' : 'Submit Application'}</span>
                    </button>

                    <a
                      href={getWhatsAppApplyUrl(selectedRole)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2.5 font-bold text-emerald-300 hover:bg-emerald-900/40 text-center"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Quick Apply via WhatsApp</span>
                    </a>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <CartDrawer />
    </div>
  );
}
