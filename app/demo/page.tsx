"use client";

import { useState } from 'react';
import { Report, AdminUser, ReportStatus, SortOrder } from '@/types';
import DashboardView from '@/components/admin/DashboardView';
import { Timestamp } from 'firebase/firestore';

// Mock Data
const mockUser: AdminUser = {
    uid: 'demo-user',
    email: 'demo@upstander.help',
    schoolId: 'demo-school',
    schoolName: 'Demo High School',
};

const mockReports: Report[] = [
    {
        id: '1',
        bullyingType: 'Verbal',
        involvedParties: 'John Doe, Jane Smith',
        yearLevel: '10',
        whatHappened: 'I heard them calling names in the hallway.',
        date: '2023-10-26',
        time: '12:30 PM',
        location: 'Hallway B',
        status: 'new',
        createdAt: Timestamp.now(),
        schoolId: 'demo-school',
        referenceCode: 'VRB-123',
        notes: []
    },
    {
        id: '2',
        bullyingType: 'Physical',
        involvedParties: 'Unknown',
        yearLevel: '8',
        whatHappened: 'Pushed in the locker room.',
        date: '2023-10-25',
        time: '10:00 AM',
        location: 'Locker Room',
        status: 'Under Investigation',
        createdAt: Timestamp.fromMillis(Date.now() - 86400000), // Yesterday
        schoolId: 'demo-school',
        referenceCode: 'PHY-456',
        notes: [
            {
                note: 'Spoke to PE teacher.',
                createdAt: Timestamp.now()
            }
        ]
    },
    {
        id: '3',
        bullyingType: 'Cyber',
        involvedParties: 'User123',
        yearLevel: '11',
        whatHappened: 'Mean comments on Instagram post.',
        date: '2023-10-20',
        time: '8:00 PM',
        location: 'Online',
        status: 'Resolved',
        createdAt: Timestamp.fromMillis(Date.now() - 172800000), // 2 days ago
        schoolId: 'demo-school',
        referenceCode: 'CYB-789',
        notes: []
    }
];

export default function DemoPage() {
    const [reports, setReports] = useState<Report[]>(mockReports);
    const [statusFilter, setStatusFilter] = useState<ReportStatus>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    const filteredReports = reports.filter(report => {
        if (statusFilter === 'all') return true;
        return report.status === statusFilter;
    }).sort((a, b) => {
        const dateA = a.createdAt.toDate().getTime();
        const dateB = b.createdAt.toDate().getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const handleReportUpdate = (updatedReport: Report) => {
        setReports(reports.map(report => report.id === updatedReport.id ? updatedReport : report));
        setSelectedReport(updatedReport);
    };

    return (
        <DashboardView
            user={mockUser}
            reports={filteredReports}
            loading={false}
            reportsLoading={false}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onSignOut={() => {}}
            selectedReport={selectedReport}
            onReportClick={setSelectedReport}
            onCloseReportModal={() => setSelectedReport(null)}
            onUpdateReport={handleReportUpdate}
            isDemo={true}
        />
    );
}
