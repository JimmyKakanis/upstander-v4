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
    <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Check Report Status</h2>
      <p className="text-center text-gray-600 mb-6">
        Enter the anonymous reference code you received when you submitted your report.
      </p>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="referenceCode" className="text-sm font-medium text-gray-700 block mb-2">
            Reference Code
          </label>
          <input
            type="text"
            id="referenceCode"
            value={referenceCode}
            onChange={(e) => setReferenceCode(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., FR2025-A8B2"
          />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </div>
      </form>
    </div>
  );
}
