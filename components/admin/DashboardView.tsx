"use client";

import { staffRoleLabel } from '@/lib/staff-role';
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
  /** When set (e.g. school admin only), table shows delete and uses this handler. */
  onDeleteReport?: (report: Report) => void | Promise<void>;
  isDemo?: boolean; // Optional prop to hide/show certain elements or show "Demo Mode" banner
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
  onDeleteReport,
  isDemo = false,
}: DashboardViewProps) {
  const canDelete = Boolean(onDeleteReport) && !isDemo;

  const newReportsCount = reports.filter(report => report.status === 'new').length;
  const investigatingCount = reports.filter(report => report.status === 'Under Investigation').length;

  const handleStatusCardClick = (status: ReportStatus) => {
    setStatusFilter(status);
  };

  const handleStatusCardKeyDown = (e: React.KeyboardEvent, status: ReportStatus) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStatusCardClick(status);
    }
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
        <div className="flex min-h-[50vh] items-center justify-center text-slate-600">
            <p>Loading…</p>
        </div>
    );
  }

  // In demo mode, we might not have a user, so we handle that case.
  // In real mode, the parent container redirects if no user.
  
  const metricCardClass =
    'group rounded-xl border border-slate-200/80 bg-white p-6 text-center shadow-sm ring-1 ring-slate-900/5 transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {isDemo && (
        <div className="bg-blue-600 text-center text-sm font-medium text-white py-2.5 px-4">
          You are viewing a demo dashboard. Data shown here is for illustration only.
        </div>
      )}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">School dashboard</p>
              {user?.schoolName ? (
                <>
                  <h1
                    className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                    title={user.schoolName}
                  >
                    {user.schoolName}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Reports and analytics below are for your school only.
                  </p>
                </>
              ) : user?.schoolId ? (
                <p className="mt-2 font-mono text-sm text-slate-600" title={user.schoolId}>
                  School ID: {user.schoolId}
                </p>
              ) : (
                <h1 className="mt-2 text-2xl font-bold text-slate-900">Dashboard</h1>
              )}
              {user?.email ? (
                <p className="mt-3 text-sm text-slate-500">
                  Signed in as <span className="font-medium text-slate-700">{user.email}</span>
                  {user.role ? (
                    <span className="ml-2 inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      {staffRoleLabel(user.role)}
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
            {isDemo ? (
              <a
                href="/"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Back to home
              </a>
            ) : null}
          </div>
        </div>
      </header>
      <main className="py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
            {/* Analytics Section */}
            <section className="mb-10" aria-labelledby="at-a-glance-heading">
                <div className="mb-5 flex flex-col gap-1 sm:mb-6">
                  <h2 id="at-a-glance-heading" className="text-lg font-semibold text-slate-900 sm:text-xl">
                    At a glance
                  </h2>
                  <p className="text-sm text-slate-600">Select a card to filter the report list.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                    {/* Total Reports Card */}
                    <div
                      role="button"
                      tabIndex={0}
                      className={metricCardClass}
                      onClick={() => handleStatusCardClick('all')}
                      onKeyDown={(e) => handleStatusCardKeyDown(e, 'all')}
                    >
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total reports</h3>
                        <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900 sm:text-4xl">{reports.length}</p>
                    </div>
                    {/* New Reports Card */}
                    <div
                      role="button"
                      tabIndex={0}
                      className={metricCardClass}
                      onClick={() => handleStatusCardClick('new')}
                      onKeyDown={(e) => handleStatusCardKeyDown(e, 'new')}
                    >
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700">New reports</h3>
                        <p className="mt-3 text-3xl font-bold tabular-nums text-amber-900 sm:text-4xl">{newReportsCount}</p>
                    </div>
                    {/* Under Investigation Card */}
                    <div
                      role="button"
                      tabIndex={0}
                      className={metricCardClass}
                      onClick={() => handleStatusCardClick('Under Investigation')}
                      onKeyDown={(e) => handleStatusCardKeyDown(e, 'Under Investigation')}
                    >
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-700">Under investigation</h3>
                        <p className="mt-3 text-3xl font-bold tabular-nums text-blue-900 sm:text-4xl">{investigatingCount}</p>
                    </div>
                    {/* Pie Chart Card */}
                    <div className="flex min-h-[160px] flex-col justify-center rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:min-h-[180px] lg:min-h-0">
                        {reports.length > 0 ? (
                            <div className="h-[140px] w-full max-w-[200px] mx-auto">
                              <Pie
                                data={chartData}
                                options={{
                                  maintainAspectRatio: false,
                                  plugins: { legend: { display: false } },
                                }}
                              />
                            </div>
                        ) : (
                            <p className="text-center text-sm text-slate-500">No reports yet to chart.</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Reports Table Section */}
            <section
              className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5"
              aria-labelledby="reports-heading"
            >
                <div className="border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 id="reports-heading" className="text-lg font-semibold text-slate-900 sm:text-xl">
                          Submitted reports
                        </h2>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                            <div className="w-full sm:w-auto sm:min-w-[11rem]">
                                <label htmlFor="statusFilter" className="mb-1 block text-xs font-medium text-slate-600 sm:sr-only">
                                  Status
                                </label>
                                <select 
                                    id="statusFilter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as ReportStatus)}
                                    className="block w-full rounded-lg border-slate-200 py-2 pl-3 pr-10 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                >
                                    <option value="all">All statuses</option>
                                    <option value="new">New</option>
                                    <option value="Under Investigation">Under investigation</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                            </div>
                            <div className="w-full sm:w-auto sm:min-w-[11rem]">
                                <label htmlFor="sortOrder" className="mb-1 block text-xs font-medium text-slate-600 sm:sr-only">
                                  Sort
                                </label>
                                <select 
                                    id="sortOrder"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                                    className="block w-full rounded-lg border-slate-200 py-2 pl-3 pr-10 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                >
                                    <option value="desc">Newest first</option>
                                    <option value="asc">Oldest first</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 bg-white">
                        <thead className="bg-slate-50/80">
                            <tr>
                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Date</th>
                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Type</th>
                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Status</th>
                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Reference</th>
                                {canDelete ? (
                                  <th scope="col" className="w-1 px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                                    <span className="sr-only">Delete</span>
                                  </th>
                                ) : null}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportsLoading ? (
                                <tr>
                                    <td colSpan={canDelete ? 5 : 4} className="px-6 py-12 text-center text-sm text-slate-500">Loading reports…</td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={canDelete ? 5 : 4} className="px-6 py-12 text-center text-sm text-slate-500">No reports match this filter.</td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                <tr
                                  key={report.id}
                                  onClick={() => onReportClick(report)}
                                  className="cursor-pointer transition-colors hover:bg-slate-50/80"
                                >
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700 sm:px-6">{report.createdAt.toDate().toLocaleDateString()}</td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-800 sm:px-6">{report.bullyingType}</td>
                                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                                            report.status === 'new' ? 'bg-amber-100 text-amber-900' :
                                            report.status === 'Under Investigation' ? 'bg-blue-100 text-blue-900' :
                                            'bg-emerald-100 text-emerald-900'
                                        }`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-slate-700 sm:px-6">{report.referenceCode}</td>
                                    {canDelete && onDeleteReport ? (
                                      <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void onDeleteReport(report);
                                          }}
                                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-800 shadow-sm transition hover:bg-red-50"
                                        >
                                          Delete
                                        </button>
                                      </td>
                                    ) : null}
                                </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
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
