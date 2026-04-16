"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { Report, AdminUser, ReportStatus, SortOrder } from '@/types';
import DashboardView from '@/components/admin/DashboardView';

/** Read subscription docs without `where('status','in',...)` so we never need a composite index. */
async function hasActiveStripeSubscription(uid: string): Promise<boolean> {
  const paths = [
    collection(db, 'users', uid, 'subscriptions'),
    collection(db, 'customers', uid, 'subscriptions'),
  ];

  for (const colRef of paths) {
    const snap = await getDocs(colRef);
    for (const d of snap.docs) {
      const raw = d.data()?.status;
      const status = typeof raw === 'string' ? raw.toLowerCase() : '';
      if (status === 'active' || status === 'trialing') {
        return true;
      }
    }
  }
  return false;
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
        // 1. Fetch User Data (Stripe & School Info)
        let userData: Record<string, unknown> | null = null;
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          userData = userSnap.data() as Record<string, unknown>;
        }

        let legacyData: Record<string, unknown> | null = null;
        const adminRef = doc(db, 'admins', firebaseUser.uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          legacyData = adminSnap.data() as Record<string, unknown>;
        }

        const schoolId =
          (typeof userData?.schoolId === 'string' && userData.schoolId) ||
          (typeof legacyData?.schoolId === 'string' && legacyData.schoolId) ||
          null;

        // 2. Subscription (Stripe extension → users/.../subscriptions or customers/.../subscriptions)
        const hasActiveSubscription = await hasActiveStripeSubscription(firebaseUser.uid);

        if (!hasActiveSubscription) {
          console.log('No active subscription found. Redirecting to subscribe.');
          setNavigatingAway(true);
          router.push('/admin/subscribe');
          return;
        }

        // 3. School / onboarding
        if (!schoolId) {
          console.log('No school ID found. Redirecting to onboarding.');
          setNavigatingAway(true);
          router.push('/admin/onboarding');
          return;
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          schoolId,
          status: 'active',
        });
      } catch (error) {
        console.error('Error fetching admin profile:', error);
        setProfileError(
          'Could not load your account. Check your connection and try again.'
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
        // Broad query to fetch all reports the user has access to based on rules
        const reportsQuery = query(collection(db, "reports"));
        
        const querySnapshot = await getDocs(reportsQuery);
        let reportsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Report[];

        // Securely filter reports on the client-side, handling cases where schoolId might be missing
        reportsData = reportsData.filter(report => report.schoolId && report.schoolId === schoolId);

        // Apply status filtering on the client-side
        if (statusFilter !== 'all') {
            reportsData = reportsData.filter(report => report.status === statusFilter);
        }

        // Apply sorting on the client-side
        reportsData.sort((a, b) => {
            const dateA = a.createdAt.toDate().getTime();
            const dateB = b.createdAt.toDate().getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        setReports(reportsData);
    } catch (error) {
        console.error("Error fetching reports: ", error);
        setReports([]); // Clear reports on error to prevent displaying stale data
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
