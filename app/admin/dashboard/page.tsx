"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Report, AdminUser, ReportStatus, SortOrder, StaffRole } from '@/types';
import DashboardView from '@/components/admin/DashboardView';

type BootstrapPayload = {
  schoolId: string | null;
  schoolName: string | null;
  hasSubscriptionAccess: boolean;
  role: string | null;
};

async function fetchDashboardBootstrap(idToken: string): Promise<BootstrapPayload> {
  const res = await fetch('/api/me/dashboard-bootstrap', {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = (await res.json().catch(() => ({}))) as BootstrapPayload & { error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not verify account access');
  }
  return {
    schoolId: data.schoolId ?? null,
    schoolName: data.schoolName ?? null,
    hasSubscriptionAccess: Boolean(data.hasSubscriptionAccess),
    role: data.role ?? null,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  /** `undefined` = auth not resolved yet; `null` = signed out */
  const [sessionUser, setSessionUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigatingAway, setNavigatingAway] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReportStatus>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setProfileError(null);
      setNavigatingAway(false);

      if (!firebaseUser) {
        setSessionUser(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSessionUser(firebaseUser);
      setLoading(true);

      try {
        const idToken = await firebaseUser.getIdToken();
        const bootstrap = await fetchDashboardBootstrap(idToken);

        if (!bootstrap.schoolId) {
          setNavigatingAway(true);
          router.push('/admin/onboarding');
          return;
        }

        if (!bootstrap.hasSubscriptionAccess) {
          setNavigatingAway(true);
          router.push('/admin/subscribe');
          return;
        }

        const roleParsed: StaffRole | undefined =
          bootstrap.role === 'admin' || bootstrap.role === 'staff' ? bootstrap.role : undefined;

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          schoolId: bootstrap.schoolId,
          schoolName: bootstrap.schoolName,
          role: roleParsed,
          status: 'active',
        });
      } catch (error) {
        console.error('Error fetching admin profile:', error);
        setProfileError(
          error instanceof Error ? error.message : 'Could not load your account. Check your connection and try again.'
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchReports = useCallback(async (schoolId: string) => {
    setReportsLoading(true);
    try {
        const reportsQuery = query(collection(db, "reports"));
        
        const querySnapshot = await getDocs(reportsQuery);
        let reportsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Report[];

        reportsData = reportsData.filter(report => report.schoolId && report.schoolId === schoolId);

        if (statusFilter !== 'all') {
            reportsData = reportsData.filter(report => report.status === statusFilter);
        }

        reportsData.sort((a, b) => {
            const dateA = a.createdAt.toDate().getTime();
            const dateB = b.createdAt.toDate().getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        setReports(reportsData);
    } catch (error) {
        console.error("Error fetching reports: ", error);
        setReports([]);
    } finally {
        setReportsLoading(false);
    }
  }, [statusFilter, sortOrder]);

  useEffect(() => {
    if (user && user.schoolId) {
        fetchReports(user.schoolId);
    }
  }, [user, fetchReports]);

  const handleReportUpdate = (updatedReport: Report) => {
    setReports(reports.map(report => report.id === updatedReport.id ? updatedReport : report));
    setSelectedReport(updatedReport);
  };

  if (sessionUser === undefined || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (sessionUser === null) {
    router.push('/login');
    return null;
  }

  if (navigatingAway) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-red-700">{profileError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <DashboardView
      user={user}
      reports={reports}
      loading={loading}
      reportsLoading={reportsLoading}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      onSignOut={() => auth.signOut()}
      selectedReport={selectedReport}
      onReportClick={setSelectedReport}
      onCloseReportModal={() => setSelectedReport(null)}
      onUpdateReport={handleReportUpdate}
    />
  );
}
