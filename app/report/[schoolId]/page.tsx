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
  contactEmail?: string;
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
    contactEmail: "",
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
      <div className="max-w-md mx-auto mt-8 sm:mt-16">
        <div className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid URL</h1>
          <p className="text-slate-600">
            It looks like you&apos;ve reached this page with an incorrect link. Please use the unique URL provided by your school to submit a report.
          </p>
        </div>
      </div>
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
        contactEmail: "",
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
        <div className="max-w-md mx-auto mt-8 sm:mt-16">
            <div className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Submitted</h2>
                    <p className="text-slate-600 mb-6">Thank you for helping keep our school safe.</p>
                    
                    <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-slate-700 mb-2">Your anonymous reference code is:</p>
                      <p className="text-xl font-mono bg-white py-2 px-3 inline-block rounded-md text-slate-800 border border-slate-300">{referenceCode}</p>
                    </div>

                    <p className="text-sm text-slate-600 mb-8">
                      You can use this code to check the status of your report or to add more information later. Keep it safe.
                    </p>
                    <button
                    onClick={handleNewReport}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                    Submit Another Report
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 sm:mt-16">
      <div className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
            Anonymous Report
            </h1>
            <p className="text-slate-600 mt-2">for {schoolId}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="bullyingType" className="block text-sm font-medium text-slate-700">
                Type of Bullying
                </label>
                <select
                id="bullyingType"
                name="bullyingType"
                value={formData.bullyingType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                <option>Verbal</option>
                <option>Physical</option>
                <option>Cyber</option>
                <option>Social Exclusion</option>
                </select>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Description of Incident
                </label>
                <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700">
                Your Email (Optional, for updates)
                </label>
                <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-2 text-xs text-slate-500">
                    Providing an email is optional, but it allows us to contact you with questions if needed. Your email will remain confidential.
                </p>
            </div>

            <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700">
                Date (Optional)
                </label>
                <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="time" className="block text-sm font-medium text-slate-700">
                Time (Optional)
                </label>
                <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                Location (Optional)
                </label>
                <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>
            
            <div className="pt-2">
                <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
                >
                {isLoading ? 'Submitting...' : 'Submit Report Anonymously'}
                </button>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
