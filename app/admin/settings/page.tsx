"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';

const AdminSettingsPage = () => {
  const [user, loading] = useAuthState(auth);
  const [notifyNewReports, setNotifyNewReports] = useState(true);
  const [notifyNewMessages, setNotifyNewMessages] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');

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

  if (loading) {
    return <p className="text-center mt-8">Loading...</p>;
  }

  if (!user) {
    return <p className="text-center mt-8">Please log in to view this page.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
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
  );
};

export default AdminSettingsPage;

