'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ImagePlus, LoaderCircle, ShieldCheck } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import { readApiResponse } from '@/lib/apiResponse';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function WingaStudentIdForm({ submitted, verified }: { submitted: boolean; verified: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!file) {
      setError('Choose a clear photo of your current student ID.');
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type) || file.size < 128 || file.size > MAX_FILE_SIZE) {
      setError('Choose a JPG, PNG, or WebP student ID photo between 128 bytes and 5 MB.');
      return;
    }
    setIsSubmitting(true);
    let pendingUploadPath = '';
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error('Secure ID upload is not configured. Contact UniSoko support.');

      const prepareResponse = await fetch('/api/winga/kyc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prepare', size: file.size, contentType: file.type }),
      });
      const prepared = await readApiResponse<{ path?: string; token?: string; error?: string }>(prepareResponse);
      if (!prepareResponse.ok || !prepared.path || !prepared.token) throw new Error(prepared.error || 'Could not prepare your private ID upload.');
      pendingUploadPath = prepared.path;

      const { error: uploadError } = await supabase.storage.from('winga-student-ids').uploadToSignedUrl(
        prepared.path, prepared.token, file, { contentType: file.type, upsert: false, cacheControl: '0' },
      );
      if (uploadError) throw new Error(`Secure upload failed: ${uploadError.message}. Check your connection and retry.`);

      const uploadedPath = pendingUploadPath;
      pendingUploadPath = '';
      const completeResponse = await fetch('/api/winga/kyc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', path: uploadedPath }),
      });
      const result = await readApiResponse<{ error?: string }>(completeResponse);
      if (!completeResponse.ok) {
        await fetch('/api/winga/kyc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'discard', path: uploadedPath }) }).catch(() => undefined);
        throw new Error(result.error || 'Could not submit your student ID.');
      }
      setFile(null);
      setMessage('Student ID submitted. UniSoko will review it before you can earn commissions.');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit your student ID.');
      if (pendingUploadPath) {
        try {
          await fetch('/api/winga/kyc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'discard', path: pendingUploadPath }) });
        } catch { /* Leave the signed object private if cleanup cannot reach the server. */ }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30" aria-labelledby="student-id-heading">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 dark:bg-slate-900 dark:text-indigo-300">
          {verified ? <ShieldCheck className="h-5 w-5" /> : submitted ? <CheckCircle2 className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="student-id-heading" className="text-sm font-bold text-indigo-950 dark:text-indigo-100">Student ID verification (KYC)</h2>
          <p className="mt-1 text-xs leading-5 text-indigo-900/80 dark:text-indigo-200">
            {verified
              ? 'Your student ID is verified. You can earn commissions when your approved Winga code is used.'
              : submitted
                ? 'Your ID photo is waiting for UniSoko review. You cannot earn commissions until it is verified.'
                : 'Upload a clear photo of your current student ID. Your image is private and visible only to authorized UniSoko reviewers.'}
          </p>
        </div>
      </div>
      {!verified && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-100">
            {submitted ? 'Replace student ID photo' : 'Student ID photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="mt-1.5 block w-full rounded-lg border border-indigo-200 bg-white p-2 text-xs dark:border-indigo-900 dark:bg-slate-900"
            />
          </label>
          <button disabled={isSubmitting || !file} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {isSubmitting ? 'Uploading securely…' : submitted ? 'Replace ID and resubmit' : 'Submit ID for review'}
          </button>
          {error && <p role="alert" className="text-xs font-semibold text-red-700 dark:text-red-300">{error}</p>}
          {message && <p role="status" className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{message}</p>}
        </form>
      )}
    </section>
  );
}
