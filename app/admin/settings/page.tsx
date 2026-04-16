"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';

const AdminSettingsPage = () => {
  const [user, loading] = useAuthState(auth);
  const [notifyNewReports, setNotifyNewReports] = useState(true);
  const [notifyNewMessages, setNotifyNewMessages] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolIdLoading, setSchoolIdLoading] = useState(true);

  const [teacherEmailInput, setTeacherEmailInput] = useState('');
  const [teacherInviteLoading, setTeacherInviteLoading] = useState(false);
  const [teacherInviteError, setTeacherInviteError] = useState<string | null>(null);
  const [teacherInviteSuccess, setTeacherInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        const settingsRef = doc(db, 'users', user.uid, 'adminSettings', 'notifications');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          const settings = docSnap.data();
          setNotifyNewReports(settings.newReports ?? true);
          setNotifyNewMessages(settings.newMessages ?? true);
        }
      }
    };

    if (!loading) {
      fetchSettings();
    }
  }, [user, loading]);

  useEffect(() => {
    const loadSchoolId = async () => {
      if (!user) {
        setSchoolId(null);
        setSchoolIdLoading(false);
        return;
      }
      setSchoolIdLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        let sid: string | undefined =
          userDoc.exists() && typeof userDoc.data()?.schoolId === 'string'
            ? userDoc.data()!.schoolId
            : undefined;
        if (!sid) {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (adminDoc.exists() && typeof adminDoc.data()?.schoolId === 'string') {
            sid = adminDoc.data()!.schoolId;
          }
        }
        setSchoolId(sid || null);
      } catch {
        setSchoolId(null);
      } finally {
        setSchoolIdLoading(false);
      }
    };

    if (!loading) {
      void loadSchoolId();
    }
  }, [user, loading]);

  const handleSettingChange = async (setting: 'newReports' | 'newMessages', value: boolean) => {
    if (user) {
      try {
        const settingsRef = doc(db, 'users', user.uid, 'adminSettings', 'notifications');
        await setDoc(settingsRef, { [setting]: value }, { merge: true });

        if (setting === 'newReports') {
          setNotifyNewReports(value);
        } else if (setting === 'newMessages') {
          setNotifyNewMessages(value);
        }

        setFeedbackMessage('Settings updated successfully!');
        setTimeout(() => setFeedbackMessage(''), 3000);
      } catch (error) {
        console.error('Error updating settings:', error);
        setFeedbackMessage('Failed to update settings.');
        setTimeout(() => setFeedbackMessage(''), 3000);
      }
    }
  };

  const handleSendTeacherInvite = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !schoolId) return;
      const trimmed = teacherEmailInput.trim();
      if (!trimmed) return;
      setTeacherInviteLoading(true);
      setTeacherInviteError(null);
      setTeacherInviteSuccess(null);
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/schools/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ schoolId, email: trimmed }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Could not send invitation');
        }
        if (data.success !== true) {
          throw new Error('Invalid response from server');
        }
        setTeacherInviteSuccess(`Invitation sent to ${trimmed}. They should check their inbox.`);
        setTeacherEmailInput('');
      } catch (err) {
        setTeacherInviteError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setTeacherInviteLoading(false);
      }
    },
    [user, schoolId, teacherEmailInput]
  );

  if (loading || schoolIdLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-600">Loading…</div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-600">Please log in to view this page.</div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-2xl space-y-8 px-4 pb-8">
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Settings</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
        <p className="mt-2 text-sm text-slate-600">Choose which email alerts you receive.</p>
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">New reports</h2>
              <p className="text-sm text-slate-500">Email when a new report is submitted.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifyNewReports}
                onChange={(e) => handleSettingChange('newReports', e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative h-6 w-11 shrink-0 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-blue-300/40"></div>
            </label>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">New anonymous messages</h2>
              <p className="text-sm text-slate-500">Email when a student sends a new message.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifyNewMessages}
                onChange={(e) => handleSettingChange('newMessages', e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative h-6 w-11 shrink-0 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-blue-300/40"></div>
            </label>
          </div>
        </div>
        {feedbackMessage && <p className="mt-6 text-center text-sm font-medium text-slate-600">{feedbackMessage}</p>}
      </div>

      {schoolId ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Add a teacher</h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter their work email. We&apos;ll send a single-use link to join this school&apos;s dashboard using your
            school&apos;s subscription. They must sign in or sign up with that same email.
          </p>
          <form
            className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end max-w-xl"
            onSubmit={handleSendTeacherInvite}
          >
            <div className="flex-1 min-w-0">
              <label htmlFor="settings-teacher-invite-email" className="sr-only">
                Teacher email
              </label>
              <input
                id="settings-teacher-invite-email"
                type="email"
                autoComplete="email"
                value={teacherEmailInput}
                onChange={(e) => setTeacherEmailInput(e.target.value)}
                placeholder="colleague@school.edu"
                disabled={teacherInviteLoading}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:bg-slate-50"
              />
            </div>
            <button
              type="submit"
              disabled={teacherInviteLoading || !teacherEmailInput.trim()}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-blue-300"
            >
              {teacherInviteLoading ? 'Sending…' : 'Send invite email'}
            </button>
          </form>
          {teacherInviteSuccess && (
            <p className="mt-3 text-sm font-medium text-emerald-800">{teacherInviteSuccess}</p>
          )}
          {teacherInviteError && <p className="mt-3 text-sm text-red-700">{teacherInviteError}</p>}
        </div>
      ) : (
        <p className="text-center text-sm text-slate-600">
          Teacher invites appear here after your account is linked to a school (complete onboarding from the
          dashboard if needed).
        </p>
      )}
    </div>
  );
};

export default AdminSettingsPage;
