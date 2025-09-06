"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Report } from '@/types';

export default function ReportDashboardPage() {
    const params = useParams();
    const reportId = params.reportId as string;
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        if (!reportId) return;

        const reportRef = doc(db, 'reports', reportId);

        const unsubscribe = onSnapshot(reportRef, (docSnap) => {
            if (docSnap.exists()) {
                setReport({ id: docSnap.id, ...docSnap.data() } as Report);
                setError(null);
            } else {
                setError("Report not found.");
                setReport(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching report:", err);
            setError("Failed to fetch report data.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [reportId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !reportId) return;

        const message = {
            sender: 'student',
            message: newMessage,
            createdAt: Timestamp.now()
        };

        try {
            const reportRef = doc(db, 'reports', reportId);
            await updateDoc(reportRef, {
                conversation: arrayUnion(message)
            });
            setNewMessage('');
        } catch (err) {
            console.error("Error sending message:", err);
            // Optionally, set an error state to inform the user
        }
    };

    if (loading) {
        return <div className="text-center p-8"><p>Loading report...</p></div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-600"><p>{error}</p></div>;
    }

    if (!report) {
        return <div className="text-center p-8"><p>No report data to display.</p></div>;
    }

    return (
        <div className="w-full bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Report Status</h2>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    report.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                    report.status === 'Under Investigation' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                }`}>
                    {report.status}
                </span>
            </div>

            <div className="mb-6">
                <p><strong>Reference Code:</strong> {report.referenceCode}</p>
                <p><strong>Submitted On:</strong> {report.createdAt.toDate().toLocaleDateString()}</p>
            </div>
            
            <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4">Follow-up Conversation</h3>
                <div className="bg-gray-50 p-4 rounded-lg border h-80 overflow-y-auto flex flex-col space-y-4">
                    {/* Conversation messages */}
                    {report.conversation?.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-xs lg:max-w-md ${
                                msg.sender === 'student' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'
                            }`}>
                                <p>{msg.message}</p>
                                <p className="text-xs opacity-75 mt-1 text-right">{msg.createdAt.toDate().toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))}
                    {(!report.conversation || report.conversation.length === 0) && (
                        <p className="text-gray-500 text-center self-center">
                            This is where you can securely and anonymously communicate with a staff member. Send a message to start the conversation.
                        </p>
                    )}
                </div>
                <form onSubmit={handleSendMessage} className="mt-4 flex">
                    <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow p-2 border rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button 
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
