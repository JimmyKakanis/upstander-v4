"use client";

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { useParams } from 'next/navigation';

const generateReferenceCode = (docId: string) => {
  const year = new Date().getFullYear();
  const docPart = docId.substring(0, 4).toUpperCase();
  return `FR${year}-${docPart}`;
};

type BullyingType = "Verbal" | "Physical" | "Cyber" | "Social Exclusion";

interface ReportFormState {
  bullyingType: BullyingType;
  description: string;
  date?: string;
  time?: string;
  location?: string;
}

export default function ReportPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;

  const [formData, setFormData] = useState<ReportFormState>({
    bullyingType: "Verbal",
    description: "",
    date: "",
    time: "",
    location: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");


  if (!schoolId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-lg shadow-sm text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid URL</h1>
          <p>
            It looks like you&apos;ve reached this page with an incorrect link. Please use the unique URL provided by your school to submit a report.
          </p>
        </div>
      </main>
    );
  }


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Generate a new document reference with a unique ID
      const newReportRef = doc(collection(db, "reports"));
      
      // Generate the reference code using the new document's ID
      const refCode = generateReferenceCode(newReportRef.id);

      // Create the report data, including the new reference code
      const reportData = {
        ...formData,
        status: "new",
        createdAt: serverTimestamp(),
        schoolId: schoolId,
        referenceCode: refCode
      };

      // Use a transaction to ensure both documents are created atomically
      await runTransaction(db, async (transaction) => {
        const followUpRef = doc(db, "followUpAccess", refCode);
        const followUpData = {
          reportId: newReportRef.id,
          createdAt: serverTimestamp()
        };

        transaction.set(newReportRef, reportData);
        transaction.set(followUpRef, followUpData);
      });

      setReferenceCode(refCode);
      setSubmitted(true);
      
      setFormData({
        bullyingType: "Verbal",
        description: "",
        date: "",
        time: "",
        location: "",
      });

    } catch (err) {
      console.error("Error adding document: ", err);
      setError("Failed to submit report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewReport = () => {
    setSubmitted(false);
    setReferenceCode("");
  };

  if (submitted) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-start p-8 sm:p-24 bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-4">Report Submitted Successfully</h2>
                    <p className="mb-4">Thank you for helping keep our school safe.</p>
                    <p className="mb-2">Your anonymous reference code is:</p>
                    <p className="text-lg font-mono bg-gray-100 p-2 inline-block rounded mb-6">{referenceCode}</p>
                    <p className="text-sm text-gray-600 mb-6">
                    You can use this code if you need to talk to a staff member about this report without revealing your identity.
                    </p>
                    <button
                    onClick={handleNewReport}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                    Submit Another Report
                    </button>
                </div>
            </div>
        </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 sm:p-24 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-8">
          Anonymous Bullying Report for {schoolId}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="bullyingType" className="block text-sm font-medium text-gray-900">
                Type of Bullying
                </label>
                <select
                id="bullyingType"
                name="bullyingType"
                value={formData.bullyingType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                <option>Verbal</option>
                <option>Physical</option>
                <option>Cyber</option>
                <option>Social Exclusion</option>
                </select>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-900">
                Description of Incident
                </label>
                <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-900">
                Date (Optional)
                </label>
                <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-900">
                Time (Optional)
                </label>
                <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-900">
                Location (Optional)
                </label>
                <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>
            
            <div>
                <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                {isLoading ? 'Submitting...' : 'Submit Report'}
                </button>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        </form>
      </div>
    </main>
  );
}
