"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { Report, AdminUser } from '@/types';
import ReportModal from '@/components/admin/ReportModal';

type Status = 'new' | 'Under Investigation' | 'Resolved' | 'all';
type SortOrder = 'desc' | 'asc';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const fetchReports = useCallback(async () => {
    if (!user) return; // Don't fetch if user profile isn't loaded
    try {
        let reportsQuery = query(collection(db, "reports"), where("schoolId", "==", user.schoolId));

        if (statusFilter !== 'all') {
            reportsQuery = query(reportsQuery, where("status", "==", statusFilter));
        }

        reportsQuery = query(reportsQuery, orderBy("createdAt", sortOrder));
        
        const querySnapshot = await getDocs(reportsQuery);
        const reportsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Report[];
        setReports(reportsData);
    } catch (error) {
        console.error("Error fetching reports: ", error);
    }
  }, [user, statusFilter, sortOrder]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, now fetch their profile from Firestore
        const adminRef = doc(db, "admins", firebaseUser.uid);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          const adminData = adminSnap.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            schoolId: adminData.schoolId
          });
        } else {
          // Handle case where user is authenticated but has no admin profile
          console.error("Admin profile not found in Firestore.");
          auth.signOut(); // Sign out the user
        }
      } else {
        // User is signed out
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
        fetchReports();
    }
  }, [user, fetchReports]);

  const handleReportUpdate = (updatedReport: Report) => {
    setReports(reports.map(report => report.id === updatedReport.id ? updatedReport : report));
  };


  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  if (!user) {
    // This is a fallback, as the redirect should have already happened.
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
                <p className="mr-4">Welcome, {user.email}</p>
                <button 
                  onClick={() => auth.signOut()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Dashboard content will go here */}
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg">
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Submitted Reports</h2>
                        <div className="flex space-x-4">
                            <div>
                                <label htmlFor="statusFilter" className="sr-only">Filter by status</label>
                                <select 
                                    id="statusFilter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as Status)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="new">New</option>
                                    <option value="Under Investigation">Under Investigation</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="sortOrder" className="sr-only">Sort by date</label>
                                <select 
                                    id="sortOrder"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="desc">Newest First</option>
                                    <option value="asc">Oldest First</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type of Bullying</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference Code</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {reports.map((report) => (
                                <tr key={report.id} onClick={() => setSelectedReport(report)} className="cursor-pointer hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">{report.createdAt.toDate().toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{report.typeOfBullying}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            report.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                                            report.status === 'Under Investigation' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{report.referenceCode}</td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </div>
          {selectedReport && (
            <ReportModal 
              report={selectedReport} 
              onClose={() => setSelectedReport(null)}
              onUpdate={handleReportUpdate}
            />
          )}
        </div>
      </main>
    </div>
  );
}
