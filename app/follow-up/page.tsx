"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function FollowUpPage() {
  const router = useRouter();
  const [referenceCode, setReferenceCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (referenceCode.trim() === '') {
        setError("Please enter a valid reference code.");
        setLoading(false);
        return;
    }

    try {
      const followUpRef = doc(db, 'followUpAccess', referenceCode.trim());
      const followUpSnap = await getDoc(followUpRef);

      if (!followUpSnap.exists()) {
        setError('No report found with that reference code. Please check the code and try again.');
      } else {
        const reportId = followUpSnap.data().reportId;
        router.push(`/follow-up/${reportId}`);
      }
    } catch (err) {
      console.error("Error logging in with reference code: ", err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-xl border border-slate-200/80 bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Students</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Check report status</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Enter the anonymous reference code you received when you submitted your report.
          </p>
        </div>
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div>
            <label htmlFor="referenceCode" className="block text-sm font-medium text-slate-700">
              Reference code
            </label>
            <input
              type="text"
              id="referenceCode"
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              placeholder="e.g. FR2026-A8B2"
            />
          </div>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-800">{error}</p>
          )}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-400"
            >
              {loading ? 'Checking…' : 'Check status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
