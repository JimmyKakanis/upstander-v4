"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, serverTimestamp, runTransaction, getDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

function buildFollowUpUrl(): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '').trim();
  if (base) return `${base}/follow-up`;
  if (typeof window !== 'undefined') return `${window.location.origin}/follow-up`;
  return '/follow-up';
}

function ReportSubmittedView({ referenceCode }: { referenceCode: string }) {
  const followUpUrl = useMemo(() => buildFollowUpUrl(), []);
  const [copied, setCopied] = useState<'code' | 'url' | null>(null);
  const skipLeaveWarning = useRef(false);

  // Warn on tab close / refresh. Browsers only show a generic message, not custom copy.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (skipLeaveWarning.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const copyToClipboard = useCallback(
    async (text: string, kind: 'code' | 'url') => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(kind);
        setTimeout(() => setCopied(null), 2000);
      } catch {
        window.prompt('Copy this text:', text);
        setCopied(kind);
        setTimeout(() => setCopied(null), 2000);
      }
    },
    []
  );

  return (
    <div className="text-left sm:text-center">
      <div
        className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-100/90 p-5 text-left text-base leading-relaxed text-amber-950 shadow-md ring-2 ring-amber-400/25"
        role="status"
      >
        <header className="border-b-2 border-amber-300/50 pb-4 text-center sm:text-left">
          <p className="inline-block rounded-md bg-amber-800 px-3 py-1.5 text-sm font-extrabold uppercase tracking-[0.2em] text-amber-50 shadow-sm">
            Important
          </p>
          <h2 className="mt-4 text-balance text-2xl font-black leading-tight tracking-tight text-amber-950 sm:text-3xl">
            Before you leave this page
          </h2>
          <p className="mt-2 text-balance text-base font-bold text-amber-900">
            Do not close this tab and do not go away until you have done the two steps below.
          </p>
        </header>
        <ol className="mt-5 list-decimal space-y-4 pl-5 text-[0.95rem] marker:font-bold marker:text-amber-800 sm:text-base sm:leading-relaxed">
          <li>
            <span className="font-bold text-amber-950">Save your reference code.</span> Write it on
            paper, in your phone notes, or take a clear photo. This is the only time we show it—if you
            close this page without saving it, we cannot show it again.
          </li>
          <li>
            <span className="font-bold text-amber-950">Come back to follow up anonymously.</span> When
            you are ready to check your report, reply to staff, or get updates, open this same website at
            the address below and enter your code. You will not need to give your name.
            <p
              className="mt-3 break-all rounded-lg border border-amber-300/70 bg-amber-100/60 px-3 py-2.5 text-sm font-mono font-semibold text-amber-950 shadow-sm sm:text-base"
              translate="no"
            >
              {followUpUrl}
            </p>
          </li>
        </ol>
      </div>

      <h3 className="text-balance text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Report Submitted
      </h3>
      <p className="mt-2 mb-6 text-center text-base leading-relaxed text-slate-600">
        Thank you for helping keep our school safe.
      </p>

      <div className="mb-5 rounded-2xl border-2 border-blue-200/90 bg-gradient-to-b from-slate-50 to-white p-5 shadow-md ring-1 ring-slate-200/60">
        <p className="text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-left">
          Your anonymous reference code
        </p>
        <p className="mt-0.5 text-center text-sm font-medium text-slate-700 sm:text-left">
          Copy it or write it down before you go
        </p>
        <p className="mt-4 text-center sm:text-left">
          <span className="inline-block w-full max-w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-center font-mono text-2xl font-bold tracking-[0.18em] text-slate-900 shadow-sm sm:px-5 sm:text-3xl sm:tracking-[0.22em]">
            {referenceCode}
          </span>
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          <button
            type="button"
            onClick={() => copyToClipboard(referenceCode, 'code')}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-50/80 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-blue-100/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {copied === 'code' ? 'Copied!' : 'Copy code'}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(followUpUrl, 'url')}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {copied === 'url' ? 'Copied!' : 'Copy follow-up page link'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-blue-600/25 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mx-auto sm:w-full sm:max-w-md"
          >
            Print or save as PDF
          </button>
        </div>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-slate-600 sm:text-center">
        On the follow-up page, enter your code to read messages from staff and send replies while staying
        anonymous.
      </p>
      <Link
        href="/follow-up"
        onClick={() => {
          skipLeaveWarning.current = true;
        }}
        className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        {"I've saved my code — open follow-up page"}
      </Link>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;
  const [schoolName, setSchoolName] = useState<string>("");

  useEffect(() => {
    if (schoolId) {
      const fetchSchool = async () => {
        try {
          const docRef = doc(db, "schools", schoolId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSchoolName(data.name || schoolId);
          } else {
            // Handle case where school doesn't exist if needed
          }
        } catch (error) {
           console.error("Error fetching school:", error);
        }
      };
      fetchSchool();
    }
  }, [schoolId]);

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
      <div className="max-w-md mx-auto mt-8 sm:mt-16 mb-16 sm:mb-24 px-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-sm ring-1 ring-slate-900/5">
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
    // Use a timeout to ensure the state has updated before focusing
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
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
        <div className="mx-auto mt-8 max-w-2xl mb-16 px-4 sm:mt-16 sm:mb-24 print:max-w-none print:px-0">
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-10 print:shadow-none print:ring-0 print:border-0">
                <ReportSubmittedView referenceCode={referenceCode} />
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 sm:mt-16 mb-16 sm:mb-24 px-4">
      <div className="rounded-xl border border-slate-200/80 bg-white px-8 pt-8 pb-10 shadow-sm ring-1 ring-slate-900/5 sm:pb-12">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
            Anonymous Report
            </h1>
            <p className="text-slate-600 mt-2">for {schoolName || schoolId}</p>
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
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="truth-statement" className="font-medium text-slate-700">
                    Statement of Truth
                  </label>
                  <p className="text-slate-500">
                  I confirm that this report is a truthful account of what I witnessed or experienced. I understand that submitting a deliberately false or malicious report is a serious breach of school policy and undermines our community's safety.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
                <button
                type="submit"
                disabled={isLoading || (!isTestingMode && (!statementOfTruth || !formData.involvedParties || !formData.yearLevel || !formData.whatHappened || !formData.location || !formData.date))}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
                >
                {isLoading ? 'Submitting...' : 'Submit Report Anonymously'}
                </button>
            </div>

            {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
        </form>
      </div>
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-2xl ring-1 ring-slate-900/5">
            <h3 className="mb-3 text-xl font-bold text-slate-900">A reminder on truthfulness</h3>
            <p className="mb-6 text-sm leading-6 text-slate-600">
              Please remember that this report must be a truthful account of what you witnessed or experienced. Submitting a deliberately false or malicious report is a serious breach of school policy and may have legal consequences.
            </p>
            <button
              type="button"
              onClick={handleCloseReminder}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              I understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
