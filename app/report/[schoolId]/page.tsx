"use client";

import { useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { useParams } from 'next/navigation';

const generateReferenceCode = (docId: string) => {
  const year = new Date().getFullYear();
  const docPart = docId.substring(0, 4).toUpperCase();
  return `FR${year}-${docPart}`;
};

const bullyingTypes = [
  "Verbal", 
  "Physical", 
  "Cyber", 
  "Social Exclusion", 
  "Discrimination",
  "Harassment",
  "Theft or Damage to Property",
  "Threats or Intimidation",
  "Spreading Rumors",
  "Other"
] as const;

type BullyingType = typeof bullyingTypes[number];

interface ReportFormState {
  involvedParties: string;
  bullyingType: BullyingType;
  yearLevel: string;
  whatHappened: string;
  date?: string;
  time?: string;
  location?: string;
}

const isTestingMode = true;

export default function ReportPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;

  const [formData, setFormData] = useState<ReportFormState>({
    involvedParties: "",
    bullyingType: "Verbal",
    yearLevel: "",
    whatHappened: "",
    date: "",
    time: "",
    location: "",
  });
  const [statementOfTruth, setStatementOfTruth] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [hasSeenReminder, setHasSeenReminder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);


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

  const handleTextareaFocus = () => {
    if (!hasSeenReminder) {
      setIsReminderModalOpen(true);
    }
  };

  const handleCloseReminder = () => {
    setIsReminderModalOpen(false);
    setHasSeenReminder(true);
    textareaRef.current?.focus();
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
        involvedParties: "",
        bullyingType: "Verbal",
        yearLevel: "",
        whatHappened: "",
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
                Type of Bullying?
                </label>
                <select
                id="bullyingType"
                name="bullyingType"
                value={formData.bullyingType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                {bullyingTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
                </select>
            </div>

            <div>
                <label htmlFor="involvedParties" className="block text-sm font-medium text-slate-700">
                Who is involved / needs help?
                </label>
                <input
                type="text"
                id="involvedParties"
                name="involvedParties"
                value={formData.involvedParties}
                onChange={handleChange}
                required={!isTestingMode}
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="yearLevel" className="block text-sm font-medium text-slate-700">
                Year level / grade?
                </label>
                <input
                type="text"
                id="yearLevel"
                name="yearLevel"
                value={formData.yearLevel}
                onChange={handleChange}
                required={!isTestingMode}
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="whatHappened" className="block text-sm font-medium text-slate-700">
                What did you see?
                </label>
                <textarea
                id="whatHappened"
                name="whatHappened"
                ref={textareaRef}
                rows={4}
                value={formData.whatHappened}
                onChange={handleChange}
                onFocus={handleTextareaFocus}
                required={!isTestingMode}
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                Where did this happen?
                </label>
                <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required={!isTestingMode}
                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700">
                When did this happen (approximately)?
                </label>
                <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required={!isTestingMode}
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
            
            <div className="pt-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <input
                    id="truth-statement"
                    name="truth-statement"
                    type="checkbox"
                    checked={statementOfTruth}
                    onChange={(e) => setStatementOfTruth(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="truth-statement" className="font-medium text-gray-700">
                    Statement of Truth
                  </label>
                  <p className="text-gray-500">
                  I confirm that this report is a truthful account of what I witnessed or experienced. I understand that submitting a deliberately false or malicious report is a serious breach of school policy and undermines our community's safety.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
                <button
                type="submit"
                disabled={isLoading || (!isTestingMode && (!statementOfTruth || !formData.involvedParties || !formData.yearLevel || !formData.whatHappened || !formData.location || !formData.date))}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
                >
                {isLoading ? 'Submitting...' : 'Submit Report Anonymously'}
                </button>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        </form>
      </div>
      {isReminderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-4">A Reminder on Truthfulness</h3>
            <p className="text-slate-600 mb-6">
              Please remember that this report must be a truthful account of what you witnessed or experienced. Submitting a deliberately false or malicious report is a serious breach of school policy and may have legal consequences.
            </p>
            <button
              onClick={handleCloseReminder}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
