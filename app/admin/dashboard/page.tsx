"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { Report, AdminUser } from '@/types';
import ReportModal from '@/components/admin/ReportModal';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

type Status = 'new' | 'Under Investigation' | 'Resolved' | 'all';
type SortOrder = 'desc' | 'asc';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true); // Simplified loading state
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const newReportsCount = reports.filter(report => report.status === 'new').length;
  const investigatingCount = reports.filter(report => report.status === 'Under Investigation').length;

  const handleStatusCardClick = (status: Status) => {
    setStatusFilter(status);
  };

  const reportCounts = reports.reduce((acc, report) => {
    const type = report.typeOfBullying || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = {
    labels: Object.keys(reportCounts),
    datasets: [
      {
        label: '# of Reports',
        data: Object.values(reportCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Force a token refresh to get the latest custom claims
          await firebaseUser.getIdToken(true);
          const idTokenResult = await firebaseUser.getIdTokenResult();
          console.log("Custom claims from token:", idTokenResult.claims);

          // If a Firebase user is detected, fetch their admin profile from Firestore
          const adminRef = doc(db, "admins", firebaseUser.uid);
          const adminSnap = await getDoc(adminRef);

          if (adminSnap.exists()) {
            // If the profile exists, we have a valid admin user
            const adminData = adminSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              schoolId: adminData.schoolId,
            });
          } else {
            // If no profile, they are not a valid admin. Sign them out.
            console.error("Admin profile not found in Firestore for UID:", firebaseUser.uid);
            await auth.signOut();
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching admin profile:", error);
          await auth.signOut();
          setUser(null);
        } finally {
          // All checks are complete, so we can stop loading
          setLoading(false);
        }
      } else {
        // If no Firebase user, there is no one logged in
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
    if (user) {
        fetchReports(user.schoolId);
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
    router.push('/login');
    return null; // Render nothing while redirecting
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
            <div className="px-4 py-6 sm:px-0">
                <div className="bg-white shadow rounded-lg p-4 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Dashboard Analytics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gray-100 p-4 rounded-lg text-center cursor-pointer hover:bg-gray-200" onClick={() => handleStatusCardClick('all')}>
                            <h3 className="text-sm font-medium text-gray-600">Total Reports</h3>
                            <p className="mt-1 text-3xl font-semibold text-gray-900">{reports.length}</p>
                        </div>
                        <div className="bg-yellow-100 p-4 rounded-lg text-center cursor-pointer hover:bg-yellow-200" onClick={() => handleStatusCardClick('new')}>
                            <h3 className="text-sm font-medium text-yellow-800">New Reports</h3>
                            <p className="mt-1 text-3xl font-semibold text-yellow-900">{newReportsCount}</p>
                        </div>
                        <div className="bg-blue-100 p-4 rounded-lg text-center cursor-pointer hover:bg-blue-200" onClick={() => handleStatusCardClick('Under Investigation')}>
                            <h3 className="text-sm font-medium text-blue-800">Under Investigation</h3>
                            <p className="mt-1 text-3xl font-semibold text-blue-900">{investigatingCount}</p>
                        </div>
                        <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg flex justify-center items-center" style={{ maxHeight: '150px' }}>
                            {reports.length > 0 ? (
                                <Pie data={chartData} options={{ maintainAspectRatio: false }} />
                            ) : (
                                <p className="text-gray-500">No data available for chart.</p>
                            )}
                        </div>
                    </div>
                </div>

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
                                    {reportsLoading ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4">Loading reports...</td>
                                        </tr>
                                    ) : reports.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4">No reports found.</td>
                                        </tr>
                                    ) : (
                                        reports.map((report) => (
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
                                        ))
                                    )}
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
