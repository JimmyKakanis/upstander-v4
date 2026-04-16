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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-6">
            <Image src="/logo.svg" alt="Upstander Logo" width={200} height={51} />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Register Your School
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">sign in to your existing account</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
            
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>School Info</span>
                <span>Contact Info</span>
                <span>Account</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative text-sm">
                {error}
            </div>
          )}

          <form onSubmit={step === 3 ? handleSubmit : handleNext} className="space-y-6">
            
            {/* Step 1: School Information */}
            {step === 1 && (
                <>
                    <div>
                        <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">School Name</label>
                        <input type="text" name="schoolName" id="schoolName" required value={formData.schoolName} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border" />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                        <input type="text" name="address" id="address" required value={formData.address} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                            <input type="text" name="city" id="city" required value={formData.city} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border" />
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                            <input type="text" name="state" id="state" required value={formData.state} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="zip" className="block text-sm font-medium text-gray-700">Zip Code</label>
                            <input type="text" name="zip" id="zip" required value={formData.zip} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border" />
                        </div>
                        <div>
                            <label htmlFor="studentCount" className="block text-sm font-medium text-gray-700">Est. Student Count</label>
                            <input type="number" name="studentCount" id="studentCount" required value={formData.studentCount} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border" />
                        </div>
                    </div>
                </>
            )}

            {/* Step 2: Contact Information */}
            {step === 2 && (
                <>
                     <div>
                        <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">Administrator Name</label>
                        <input type="text" name="contactName" id="contactName" required value={formData.contactName} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border" />
                    </div>
                    <div>
                        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" name="contactEmail" id="contactEmail" required value={formData.contactEmail} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border" />
                    </div>
                    <div>
                        <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <input type="tel" name="contactPhone" id="contactPhone" required value={formData.contactPhone} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border" />
                    </div>
                </>
            )}

            {/* Step 3: Account Security */}
            {step === 3 && (
                <>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" name="password" id="password" required minLength={8} value={formData.password} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border" />
                        <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters.</p>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input type="password" name="confirmPassword" id="confirmPassword" required minLength={8} value={formData.confirmPassword} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border" />
                    </div>
                </>
            )}

            <div className="flex justify-between pt-4">
                {step > 1 ? (
                    <button type="button" onClick={handleBack} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Back
                    </button>
                ) : (
                    <div></div> // Spacer
                )}
                
                <button type="submit" disabled={loading} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                    {loading ? 'Creating Account...' : (step === 3 ? 'Create Account' : 'Next')}
                </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
