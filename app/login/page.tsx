"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { normalizeInviteEmail } from '@/lib/email-normalize';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin/dashboard';
  const initialSignUp =
    searchParams.get('signup') === 'true' || redirect.includes('/join');
  const isCompletingSchoolInvite = redirect.includes('/join');
  const inviteEmailPrefill = (searchParams.get('inviteEmail') || '').trim();

  const [email, setEmail] = useState(() => inviteEmailPrefill);
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
    const normalizedEmail = normalizeInviteEmail(email);
    if (!normalizedEmail) {
      setError('Enter a valid email address.');
      setLoading(false);
      return;
    }
    try {
      if (isSignUp) {
        const { createUserWithEmailAndPassword } = await import("firebase/auth");
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          normalizedEmail,
          password
        );
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: normalizedEmail,
            uid: userCredential.user.uid,
            createdAt: new Date(),
        });

        console.log('Signed up successfully!');
      } else {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
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
    const trimmed = normalizeInviteEmail(email);
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
    <div className="flex min-h-[calc(100vh-8rem)] flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-xl border border-slate-200/80 bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
        <div className="mb-8 text-center">
          <Image src="/logo.svg" alt="Upstander Logo" width={200} height={51} className="mx-auto" />
        </div>
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-slate-900">
          {isSignUp ? 'Create staff account' : 'Staff login'}
        </h2>
        {isCompletingSchoolInvite && (
          <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            You are finishing a school invitation. If you have <strong>never</strong> used Upstander before,
            stay on <strong>Create Staff Account</strong> (or choose &quot;Need an account? Sign up&quot;) and register with the
            <strong> same email</strong> the invite was sent to, then choose a password. If you already have an account, switch to Log in.
          </p>
        )}
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-slate-400"
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
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              placeholder="••••••••"
            />
          </div>
          {info && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              {info}
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
          )}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-400"
            >
              {loading ? (isSignUp ? 'Creating account…' : 'Signing in…') : (isSignUp ? 'Sign up' : 'Sign in')}
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
                className="text-sm font-medium text-blue-600 hover:text-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-slate-600">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
