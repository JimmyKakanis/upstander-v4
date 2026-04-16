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

  if (initializing) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome to Upstander</h1>
            <p className="text-gray-600 mb-8 text-center">To get started, please create your school workspace.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {submitError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 whitespace-pre-wrap">
                    {submitError}
                  </div>
                )}
                <div>
                    <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">School Name</label>
                    <input 
                        type="text" 
                        id="schoolName"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. Springfield High School"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Create School'}
                </button>
            </form>
        </div>
    </div>
  );
}
