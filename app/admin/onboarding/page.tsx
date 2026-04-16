"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function OnboardingPage() {
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Check if already has school
        try {
            // Check 'users' collection first (new standard)
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().schoolId) {
                 router.push('/admin/dashboard');
                 return;
            }
            
            // Fallback check 'admins' collection (legacy)
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (adminDoc.exists() && adminDoc.data().schoolId) {
                 router.push('/admin/dashboard');
                 return;
            }
        } catch (error) {
            console.error("Error checking user profile:", error);
        }
      } else {
        router.push('/login');
      }
      setInitializing(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !schoolName.trim()) return;

    setLoading(true);
    setSubmitError(null);
    try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/schools/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ schoolName })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create school');
        }

        await auth.currentUser?.getIdToken(true);
        router.push('/admin/dashboard');
    } catch (error) {
        console.error("Error creating school:", error);
        setSubmitError(
          error instanceof Error ? error.message : "Failed to create school. Please try again."
        );
    } finally {
        setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-600">Loading…</div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-xl border border-slate-200/80 bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
            <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-slate-900">Welcome to Upstander</h1>
            <p className="mb-8 text-center text-sm leading-6 text-slate-600 sm:text-base">Create your school workspace to get started.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {submitError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 whitespace-pre-wrap">
                    {submitError}
                  </div>
                )}
                <div>
                    <label htmlFor="schoolName" className="block text-sm font-medium text-slate-700">School name</label>
                    <input 
                        type="text" 
                        id="schoolName"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                        placeholder="e.g. Springfield High School"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="flex w-full justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                    {loading ? 'Creating…' : 'Create school'}
                </button>
            </form>
        </div>
    </div>
  );
}
