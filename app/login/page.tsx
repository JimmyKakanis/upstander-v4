"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { getAuthErrorMessage } from '@/lib/auth-errors';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin/dashboard';
  const initialSignUp =
    searchParams.get('signup') === 'true' || redirect.includes('/join');
  const isCompletingSchoolInvite = redirect.includes('/join');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialSignUp);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (isSignUp) {
        const { createUserWithEmailAndPassword } = await import("firebase/auth");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: email,
            uid: userCredential.user.uid,
            createdAt: new Date(),
        });

        console.log('Signed up successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Logged in successfully!');
      }
      router.push(redirect);
    } catch (error) {
      console.error("Error authenticating:", error);
      setError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setInfo(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address above, then click “Forgot password?” again.");
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      setInfo("Check your inbox for a reset link. It may take a minute to arrive.");
    } catch (error) {
      console.error("Password reset error:", error);
      setError(getAuthErrorMessage(error));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt="Upstander Logo" width={200} height={51} className="mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isSignUp ? 'Create Staff Account' : 'Staff Login'}
        </h2>
        {isCompletingSchoolInvite && (
          <p className="text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            You are finishing a school invitation. If you have <strong>never</strong> used Upstander before,
            stay on <strong>Create Staff Account</strong> (or choose &quot;Need an account? Sign up&quot;) and register with the
            <strong> same email</strong> the invite was sent to, then choose a password. If you already have an account, switch to Log in.
          </p>
        )}
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 block">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-sm text-blue-600 hover:text-blue-500 disabled:text-blue-300"
                >
                  {resetLoading ? "Sending…" : "Forgot password?"}
                </button>
              )}
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
          {info && (
            <p className="text-sm text-green-800 bg-green-50 border border-green-200 p-3 rounded-lg">
              {info}
            </p>
          )}
          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {loading ? (isSignUp ? 'Creating Account...' : 'Logging in...') : (isSignUp ? 'Sign Up' : 'Login')}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
            <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setInfo(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-500 focus:outline-none"
            >
                {isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
            </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
