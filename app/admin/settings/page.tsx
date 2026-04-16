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
    return <p className="text-center mt-8">Loading...</p>;
  }

  if (!user) {
    return <p className="text-center mt-8">Please log in to view this page.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4 pb-12 space-y-8">
      <div className="p-6 bg-white rounded-lg shadow border border-gray-200">
        <h1 className="text-2xl font-bold mb-6">Notification settings</h1>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h2 className="font-semibold">New Reports</h2>
              <p className="text-sm text-gray-500">Receive an email when a new report is submitted.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifyNewReports}
                onChange={(e) => handleSettingChange('newReports', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h2 className="font-semibold">New Anonymous Messages</h2>
              <p className="text-sm text-gray-500">Receive an email when a student sends a new message.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifyNewMessages}
                onChange={(e) => handleSettingChange('newMessages', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        {feedbackMessage && <p className="mt-4 text-center text-sm text-gray-600">{feedbackMessage}</p>}
      </div>

      {schoolId ? (
        <div className="p-6 bg-white rounded-lg shadow border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Add a teacher</h2>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>
            <button
              type="submit"
              disabled={teacherInviteLoading || !teacherEmailInput.trim()}
              className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 shrink-0"
            >
              {teacherInviteLoading ? 'Sending…' : 'Send invite email'}
            </button>
          </form>
          {teacherInviteSuccess && (
            <p className="mt-3 text-sm text-green-800">{teacherInviteSuccess}</p>
          )}
          {teacherInviteError && <p className="mt-3 text-sm text-red-600">{teacherInviteError}</p>}
        </div>
      ) : (
        <p className="text-sm text-gray-600 text-center">
          Teacher invites appear here after your account is linked to a school (complete onboarding from the
          dashboard if needed).
        </p>
      )}
    </div>
  );
};

export default AdminSettingsPage;
