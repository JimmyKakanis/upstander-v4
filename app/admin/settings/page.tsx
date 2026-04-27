"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { isSchoolAdminRole, normalizeStaffRole, staffRoleLabel } from '@/lib/staff-role';

type MemberRow = {
  uid: string;
  email: string;
  role: string | null;
  displayName: string | null;
};

const AdminSettingsPage = () => {
  const router = useRouter();
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

  const [staffList, setStaffList] = useState<MemberRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState<
    { email: string; expiresAtMs: number; joinUrl?: string }[]
  >([]);
  const [copiedInviteKey, setCopiedInviteKey] = useState<string | null>(null);
  const [staffListLoading, setStaffListLoading] = useState(false);
  const [staffListError, setStaffListError] = useState<string | null>(null);
  const [billingOwnerUid, setBillingOwnerUid] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'teacher'>('teacher');
  const [memberSaveLoading, setMemberSaveLoading] = useState(false);
  const [removeLoadingUid, setRemoveLoadingUid] = useState<string | null>(null);
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(true);
  const [roleGateLoading, setRoleGateLoading] = useState(true);

  const loadSchoolMembers = useCallback(async () => {
    if (!user) return;
    setStaffListLoading(true);
    setStaffListError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/schools/members', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not load staff list');
      }
      setStaffList(Array.isArray(data.members) ? data.members : []);
      setPendingInvites(
        Array.isArray(data.pendingInvites) ? data.pendingInvites : []
      );
      setBillingOwnerUid(
        typeof data.billingOwnerUid === 'string' && data.billingOwnerUid
          ? data.billingOwnerUid
          : null
      );
    } catch (e) {
      setStaffListError(e instanceof Error ? e.message : 'Could not load staff list');
      setStaffList([]);
      setPendingInvites([]);
      setBillingOwnerUid(null);
    } finally {
      setStaffListLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIsSchoolAdmin(true);
      setRoleGateLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setRoleGateLoading(true);
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/me/dashboard-bootstrap', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && typeof data.isSchoolAdmin === 'boolean') {
          setIsSchoolAdmin(data.isSchoolAdmin);
        } else if (!cancelled && res.ok) {
          setIsSchoolAdmin(
            isSchoolAdminRole(typeof data.role === 'string' ? data.role : null)
          );
        }
      } finally {
        if (!cancelled) setRoleGateLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const copyPendingInviteLink = useCallback(
    async (row: { email: string; expiresAtMs: number; joinUrl?: string }) => {
      let url = row.joinUrl;
      if (url?.startsWith('/')) {
        url = `${window.location.origin}${url}`;
      }
      if (!url) return;
      const key = `${row.email}:${row.expiresAtMs}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopiedInviteKey(key);
        setTimeout(() => setCopiedInviteKey(null), 2000);
      } catch {
        window.prompt('Copy this link to share with your colleague:', url);
        setCopiedInviteKey(key);
        setTimeout(() => setCopiedInviteKey(null), 2000);
      }
    },
    []
  );

  const openEdit = (m: MemberRow) => {
    setMemberActionError(null);
    setEditing(m);
    setEditDisplayName(m.displayName?.trim() || '');
    const n = normalizeStaffRole(m.role);
    setEditRole(n === 'admin' ? 'admin' : 'teacher');
  };

  const saveMember = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !schoolId || !editing) return;
      setMemberSaveLoading(true);
      setMemberActionError(null);
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(`/api/schools/members/${encodeURIComponent(editing.uid)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            schoolId,
            displayName: editDisplayName.trim(),
            role: editRole,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Could not save');
        }
        setEditing(null);
        await loadSchoolMembers();
      } catch (err) {
        setMemberActionError(err instanceof Error ? err.message : 'Could not save');
      } finally {
        setMemberSaveLoading(false);
      }
    },
    [user, schoolId, editing, editDisplayName, editRole, loadSchoolMembers]
  );

  const removeMember = useCallback(
    async (m: MemberRow) => {
      if (!user || !schoolId) return;
      const label = m.email && m.email !== '—' ? m.email : 'this person';
      if (
        !confirm(
          `Remove ${label} from this school? They will lose dashboard access. Their login account is not deleted.`
        )
      ) {
        return;
      }
      setRemoveLoadingUid(m.uid);
      setMemberActionError(null);
      try {
        const idToken = await user.getIdToken();
        const url = new URL(
          `/api/schools/members/${encodeURIComponent(m.uid)}`,
          window.location.origin
        );
        url.searchParams.set('schoolId', schoolId);
        const res = await fetch(url.toString(), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Could not remove');
        }
        if (m.uid === user.uid) {
          await signOut(auth);
          router.push('/login');
          return;
        }
        if (m.uid === editing?.uid) setEditing(null);
        await loadSchoolMembers();
      } catch (err) {
        setMemberActionError(err instanceof Error ? err.message : 'Could not remove');
      } finally {
        setRemoveLoadingUid(null);
      }
    },
    [user, schoolId, loadSchoolMembers, editing, router]
  );

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

  useEffect(() => {
    if (!loading && user && schoolId && isSchoolAdmin) {
      void loadSchoolMembers();
    }
  }, [loading, user, schoolId, isSchoolAdmin, loadSchoolMembers]);

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
        void loadSchoolMembers();
      } catch (err) {
        setTeacherInviteError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setTeacherInviteLoading(false);
      }
    },
    [user, schoolId, teacherEmailInput, loadSchoolMembers]
  );

  if (loading || schoolIdLoading || roleGateLoading) {
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

      {schoolId && isSchoolAdmin ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">School staff</h2>
          <p className="mt-1 text-sm text-slate-600">
            People who can access this school&apos;s dashboard, and invitations that haven&apos;t been used yet.
          </p>
          {staffListLoading && (
            <p className="mt-4 text-sm text-slate-500">Loading list…</p>
          )}
          {staffListError && (
            <p className="mt-4 text-sm text-red-700">{staffListError}</p>
          )}
          {memberActionError && !editing && (
            <p className="mt-4 text-sm text-red-700" role="alert">
              {memberActionError}
            </p>
          )}
          {!staffListLoading && !staffListError && pendingInvites.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-800">Pending invitations</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                An email was sent; they still need to open the link and sign in (or create an account) with this
                address. If they didn’t receive the email, copy the link and send it to them (for example by school
                chat).
              </p>
              <div className="mt-2 overflow-x-auto rounded-lg border border-amber-100 bg-amber-50/30">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-amber-100/80 bg-amber-50/80">
                      <th className="px-4 py-2 font-medium text-slate-700">Email</th>
                      <th className="px-4 py-2 font-medium text-slate-700">Status</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-700">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInvites.map((p) => {
                      const rowKey = `${p.email}:${p.expiresAtMs}`;
                      const showCopied = copiedInviteKey === rowKey;
                      return (
                        <tr key={p.email} className="border-b border-amber-50/80 last:border-0">
                          <td className="px-4 py-2.5 text-slate-900">{p.email}</td>
                          <td className="px-4 py-2.5 text-slate-600">
                            <span className="font-medium text-amber-800">Awaiting sign-up</span>
                            <span className="text-slate-500">
                              {' '}
                              · link expires {new Date(p.expiresAtMs).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {p.joinUrl ? (
                              <button
                                type="button"
                                onClick={() => void copyPendingInviteLink(p)}
                                className="rounded-lg border border-amber-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-amber-100/50"
                              >
                                {showCopied ? 'Copied!' : 'Copy link'}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!staffListLoading && !staffListError && staffList.length === 0 && pendingInvites.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">No staff or open invitations yet. Send an invite below.</p>
          )}
          {!staffListLoading && !staffListError && staffList.length > 0 && (
            <div className={pendingInvites.length > 0 ? 'mt-6' : 'mt-4'}>
              {pendingInvites.length > 0 && (
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Active accounts</h3>
              )}
              <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-4 py-2 font-medium text-slate-700">Email</th>
                    <th className="px-4 py-2 font-medium text-slate-700">Name</th>
                    <th className="px-4 py-2 font-medium text-slate-700">Role</th>
                    <th className="px-4 py-2 text-right font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((m) => {
                    const isYou = user?.uid === m.uid;
                    const roleLabel = staffRoleLabel(m.role);
                    const isBilling = Boolean(billingOwnerUid && m.uid === billingOwnerUid);
                    return (
                      <tr
                        key={m.uid}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="px-4 py-2.5 text-slate-900">{m.email}</td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {m.displayName?.trim() || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {roleLabel}
                          {isYou ? (
                            <span className="ml-2 text-xs font-medium text-blue-600">(you)</span>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(m)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              title={
                                isBilling
                                  ? 'The billing account cannot be removed from the school'
                                  : undefined
                              }
                              disabled={isBilling || removeLoadingUid === m.uid}
                              onClick={() => void removeMember(m)}
                              className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-800 shadow-sm transition enabled:hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {removeLoadingUid === m.uid ? 'Removing…' : 'Remove'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {editing ? (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
              onClick={() => {
                if (!memberSaveLoading) setEditing(null);
              }}
              role="presentation"
            >
              <div
                className="w-full max-w-md rounded-xl border border-slate-200/80 bg-white p-6 shadow-lg ring-1 ring-slate-900/5"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="edit-member-title" className="text-lg font-semibold text-slate-900">
                  Edit member
                </h3>
                <p className="mt-1 truncate text-sm text-slate-500">{editing.email}</p>
                <form onSubmit={saveMember} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="edit-member-name" className="block text-sm font-medium text-slate-700">
                      Display name
                    </label>
                    <input
                      id="edit-member-name"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      maxLength={200}
                      autoComplete="name"
                      disabled={memberSaveLoading}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-member-role" className="block text-sm font-medium text-slate-700">
                      Role
                    </label>
                    <select
                      id="edit-member-role"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as 'admin' | 'teacher')}
                      disabled={
                        memberSaveLoading ||
                        Boolean(billingOwnerUid && editing.uid === billingOwnerUid)
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="admin">School admin</option>
                      <option value="teacher">Teacher</option>
                    </select>
                    {billingOwnerUid && editing.uid === billingOwnerUid ? (
                      <p className="mt-1.5 text-xs text-slate-500">
                        The person who pays for the subscription must keep the school admin role.
                      </p>
                    ) : null}
                  </div>
                  {memberActionError && (
                    <p className="text-sm text-red-700" role="alert">
                      {memberActionError}
                    </p>
                  )}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!memberSaveLoading) setEditing(null);
                      }}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={memberSaveLoading}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {memberSaveLoading ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {schoolId && isSchoolAdmin ? (
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
      ) : null}

      {!schoolId ? (
        <p className="text-center text-sm text-slate-600">
          Teacher invites appear here after your account is linked to a school (complete onboarding from the
          dashboard if needed).
        </p>
      ) : null}
    </div>
  );
};

export default AdminSettingsPage;
