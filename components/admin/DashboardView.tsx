"use client";

import { useState } from 'react';
import { Report, AdminUser, ReportStatus, SortOrder } from '@/types';
import ReportModal from '@/components/admin/ReportModal';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DashboardViewProps {
  user: AdminUser | null; // For display purposes
  reports: Report[];
  loading: boolean;
  reportsLoading: boolean;
  statusFilter: ReportStatus;
  setStatusFilter: (status: ReportStatus) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  onSignOut: () => void;
  selectedReport: Report | null;
  onReportClick: (report: Report) => void;
  onCloseReportModal: () => void;
  onUpdateReport: (report: Report) => void;
  isDemo?: boolean; // Optional prop to hide/show certain elements or show "Demo Mode" banner
  teacherInviteLoading?: boolean;
  teacherInviteError?: string | null;
  teacherInviteSuccess?: string | null;
  onSendTeacherInvite?: (email: string) => void | Promise<void>;
}

export default function DashboardView({
  user,
  reports,
  loading,
  reportsLoading,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  onSignOut,
  selectedReport,
  onReportClick,
  onCloseReportModal,
  onUpdateReport,
  isDemo = false,
  teacherInviteLoading = false,
  teacherInviteError = null,
  teacherInviteSuccess = null,
  onSendTeacherInvite,
}: DashboardViewProps) {
  const [teacherEmailInput, setTeacherEmailInput] = useState('');

  const newReportsCount = reports.filter(report => report.status === 'new').length;
  const investigatingCount = reports.filter(report => report.status === 'Under Investigation').length;

  const handleStatusCardClick = (status: ReportStatus) => {
    setStatusFilter(status);
  };

  const reportCounts = reports.reduce((acc, report) => {
    const type = report.bullyingType || 'Unknown';
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

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  // In demo mode, we might not have a user, so we handle that case.
  // In real mode, the parent container redirects if no user.
  
  return (
    <div className="min-h-screen bg-slate-50">
      {isDemo && (
        <div className="bg-blue-600 text-white text-center py-2 px-4 text-sm font-medium">
          You are viewing a Demo Dashboard. Data shown here is for illustration purposes only.
        </div>
      )}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between min-h-16 py-3 gap-4 flex-wrap items-center">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3 min-w-0">
              <h1 className="text-xl font-bold text-slate-800 shrink-0">Upstander Dashboard</h1>
              {user?.schoolName ? (
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-slate-900 truncate" title={user.schoolName}>
                    {user.schoolName}
                  </p>
                  <p className="text-xs text-slate-500">Reports shown are for this school only.</p>
                </div>
              ) : user?.schoolId ? (
                <p className="text-sm text-slate-500 font-mono truncate" title={user.schoolId}>
                  School ID: {user.schoolId}
                </p>
              ) : null}
            </div>
            <div className="flex items-center">
                {user && <p className="mr-4 text-sm text-slate-600">Welcome, {user.email}</p>}
                {!isDemo && (
                  <button 
                    onClick={onSignOut}
                    className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 transition-colors"
                  >
                    Logout
                  </button>
                )}
                {isDemo && (
                   <a 
                   href="/"
                   className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                 >
                   Back to Home
                 </a>
                )}
            </div>
          </div>
        </div>
      </nav>
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {!isDemo && onSendTeacherInvite && user?.schoolId && (
              <div className="mb-8 px-4 sm:px-0">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-800">Add a teacher</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Enter their work email. We&apos;ll send a single-use link to join this school&apos;s dashboard using your school&apos;s subscription. They must sign in or sign up with that same email.
                  </p>
                  <form
                    className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end max-w-xl"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!teacherInviteLoading) void onSendTeacherInvite(teacherEmailInput);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <label htmlFor="teacher-invite-email" className="sr-only">
                        Teacher email
                      </label>
                      <input
                        id="teacher-invite-email"
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
                  {teacherInviteError && (
                    <p className="mt-3 text-sm text-red-600">{teacherInviteError}</p>
                  )}
                </div>
              </div>
            )}
            {/* Analytics Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 px-4 sm:px-0">At a Glance</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Reports Card */}
                    <div className="bg-white border border-slate-200 p-5 rounded-lg text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStatusCardClick('all')}>
                        <h3 className="text-sm font-medium text-slate-500">Total Reports</h3>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{reports.length}</p>
                    </div>
                    {/* New Reports Card */}
                    <div className="bg-white border border-slate-200 p-5 rounded-lg text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStatusCardClick('new')}>
                        <h3 className="text-sm font-medium text-yellow-600">New Reports</h3>
                        <p className="mt-2 text-3xl font-bold text-yellow-800">{newReportsCount}</p>
                    </div>
                    {/* Under Investigation Card */}
                    <div className="bg-white border border-slate-200 p-5 rounded-lg text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStatusCardClick('Under Investigation')}>
                        <h3 className="text-sm font-medium text-blue-600">Under Investigation</h3>
                        <p className="mt-2 text-3xl font-bold text-blue-800">{investigatingCount}</p>
                    </div>
                    {/* Pie Chart Card */}
                    <div className="md:col-span-1 bg-white border border-slate-200 p-4 rounded-lg flex justify-center items-center" style={{ maxHeight: '150px' }}>
                        {reports.length > 0 ? (
                            <Pie data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                        ) : (
                            <p className="text-sm text-slate-500">No data for chart</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Reports Table Section */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800">Submitted Reports</h2>
                        <div className="flex space-x-4">
                            <div>
                                <label htmlFor="statusFilter" className="sr-only">Filter by status</label>
                                <select 
                                    id="statusFilter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as ReportStatus)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                                    className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option value="desc">Newest First</option>
                                    <option value="asc">Oldest First</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type of Bullying</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reference Code</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {reportsLoading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">Loading reports...</td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">No reports found for the selected filter.</td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                <tr key={report.id} onClick={() => onReportClick(report)} className="cursor-pointer hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{report.createdAt.toDate().toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{report.bullyingType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            report.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                                            report.status === 'Under Investigation' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-700">{report.referenceCode}</td>
                                </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          {selectedReport && (
            <ReportModal 
              report={selectedReport} 
              onClose={onCloseReportModal}
              onUpdate={onUpdateReport}
            />
          )}
        </div>
      </main>
    </div>
  );
}
