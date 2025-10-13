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
        
        // Optional: You could even do a quick check here to ensure the report itself exists
        // before redirecting, but the [reportId] page already handles non-existent reports.

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
    <div className="max-w-md mx-auto mt-8 sm:mt-16">
      <div className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Check Report Status</h2>
          <p className="text-slate-600 mb-8">
            Enter the anonymous reference code you received when you submitted your report.
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="referenceCode" className="block text-sm font-medium text-slate-700">
              Reference Code
            </label>
            <input
              type="text"
              id="referenceCode"
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., FR2025-A8B2"
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
            >
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
