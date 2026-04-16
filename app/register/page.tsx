"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    schoolName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    studentCount: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 1. Create Firebase Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.contactEmail, formData.password);
      const user = userCredential.user;

      // Update basic profile
      await updateProfile(user, {
        displayName: formData.contactName
      });

      // 2. Create User Document (basic setup before API call)
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.contactEmail,
        uid: user.uid,
        createdAt: new Date(),
        displayName: formData.contactName,
        phoneNumber: formData.contactPhone
      });

      // 3. Call API to Create School and Link User
      const idToken = await user.getIdToken();
      const response = await fetch('/api/schools/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
            schoolName: formData.schoolName,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            studentCount: formData.studentCount,
            contactName: formData.contactName,
            contactPhone: formData.contactPhone
        })
      });

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          body: text.substring(0, 500) // First 500 chars for debugging
        });
        throw new Error(`Server returned ${response.status} ${response.statusText}. Expected JSON but got ${contentType}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register school');
      }

      await user.getIdToken(true);

      // 4. Redirect to Subscription
      router.push('/admin/subscribe');

    } catch (error: unknown) {
      console.error("Registration error:", error);
      setError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25';

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="mb-6 flex justify-center">
            <Image src="/logo.svg" alt="Upstander Logo" width={200} height={51} />
        </Link>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900">
          Register your school
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-8 shadow-sm ring-1 ring-slate-900/5 sm:px-10">
            
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="relative flex items-center justify-between">
                <div className="absolute left-0 top-1/2 z-0 h-1 w-full -translate-y-1/2 bg-slate-200" aria-hidden />
                <div className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                <div className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                <div className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
            </div>
            <div className="mt-2 flex justify-between text-xs font-medium text-slate-500">
                <span>School info</span>
                <span>Contact info</span>
                <span>Account</span>
            </div>
          </div>

          {error && (
            <div className="relative mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
            </div>
          )}

          <form onSubmit={step === 3 ? handleSubmit : handleNext} className="space-y-6">
            
            {/* Step 1: School Information */}
            {step === 1 && (
                <>
                    <div>
                        <label htmlFor="schoolName" className="block text-sm font-medium text-slate-700">School name</label>
                        <input type="text" name="schoolName" id="schoolName" required value={formData.schoolName} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
                        <input type="text" name="address" id="address" required value={formData.address} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-slate-700">City</label>
                            <input type="text" name="city" id="city" required value={formData.city} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-slate-700">State</label>
                            <input type="text" name="state" id="state" required value={formData.state} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="zip" className="block text-sm font-medium text-slate-700">ZIP code</label>
                            <input type="text" name="zip" id="zip" required value={formData.zip} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="studentCount" className="block text-sm font-medium text-slate-700">Est. student count</label>
                            <input type="number" name="studentCount" id="studentCount" required value={formData.studentCount} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                </>
            )}

            {/* Step 2: Contact Information */}
            {step === 2 && (
                <>
                     <div>
                        <label htmlFor="contactName" className="block text-sm font-medium text-slate-700">Administrator name</label>
                        <input type="text" name="contactName" id="contactName" required value={formData.contactName} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700">Email address</label>
                        <input type="email" name="contactEmail" id="contactEmail" required value={formData.contactEmail} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="contactPhone" className="block text-sm font-medium text-slate-700">Phone number</label>
                        <input type="tel" name="contactPhone" id="contactPhone" required value={formData.contactPhone} onChange={handleChange} className={inputClass} />
                    </div>
                </>
            )}

            {/* Step 3: Account Security */}
            {step === 3 && (
                <>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                        <input type="password" name="password" id="password" required minLength={8} value={formData.password} onChange={handleChange} className={inputClass} />
                        <p className="mt-1 text-xs text-slate-500">Must be at least 8 characters.</p>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm password</label>
                        <input type="password" name="confirmPassword" id="confirmPassword" required minLength={8} value={formData.confirmPassword} onChange={handleChange} className={inputClass} />
                    </div>
                </>
            )}

            <div className={`flex gap-3 pt-6 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                {step > 1 ? (
                    <button type="button" onClick={handleBack} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400">
                        Back
                    </button>
                ) : null}
                <button type="submit" disabled={loading} className="inline-flex justify-center rounded-lg border border-transparent bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50">
                    {loading ? 'Creating account…' : (step === 3 ? 'Create account' : 'Next')}
                </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
