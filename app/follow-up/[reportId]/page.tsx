"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Report, ConversationMessage } from '@/types';

export default function FollowUpConversationPage() {
    const params = useParams();
    const reportId = params.reportId as string;
    const [report, setReport] = useState<Report | null>(null);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!reportId) return;

        const reportRef = doc(db, 'reports', reportId);
        const conversationRef = doc(db, 'conversations', reportId);

        const fetchReport = async () => {
            try {
                const reportSnap = await getDoc(reportRef);
                if (reportSnap.exists()) {
                    setReport({ id: reportSnap.id, ...reportSnap.data() } as Report);
                } else {
                    setError("Report not found.");
                }
            } catch (err) {
                console.error("Error fetching report:", err);
                setError("Failed to fetch report data.");
            } finally {
                setLoading(false);
            }
        };

        fetchReport();

        const unsubscribeMessages = onSnapshot(conversationRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const sortedMessages = (data.messages || []).sort((a: ConversationMessage, b: ConversationMessage) => {
                    return a.timestamp.toMillis() - b.timestamp.toMillis();
                });
                setMessages(sortedMessages);
            } else {
                setMessages([]);
            }
            setMessagesLoading(false);
        }, (err) => {
            console.error("Error fetching conversation:", err);
            setMessagesLoading(false);
        });

        return () => {
            unsubscribeMessages();
        };
    }, [reportId]);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !reportId) return;

        const messageText = newMessage;
        const optimisticMessage: ConversationMessage = {
            text: messageText,
            sender: 'reporter',
            timestamp: Timestamp.now(),
        };

        setMessages(prevMessages => [...prevMessages, optimisticMessage]);
        setNewMessage('');

        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  reportId: reportId,
                  text: messageText,
                  sender: 'reporter',
                }),
              });
        } catch (err) {
            console.error("Error sending message:", err);
            setMessages(prevMessages => prevMessages.filter(msg => msg.timestamp !== optimisticMessage.timestamp));
            setNewMessage(messageText);
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
                <div ref={messagesContainerRef} className="bg-gray-50 p-4 rounded-lg border h-80 overflow-y-auto flex flex-col space-y-4">
                    {messagesLoading ? (
                        <p className="text-gray-500 text-center self-center">Loading conversation...</p>
                    ) : messages.length > 0 ? (
                        messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'reporter' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 rounded-lg max-w-xs lg:max-w-md ${
                                    msg.sender === 'reporter' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'
                                }`}>
                                    <p>{msg.text}</p>
                                    {msg.timestamp && (
                                        <p className="text-xs opacity-75 mt-1 text-right">{msg.timestamp.toDate().toLocaleTimeString()}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
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
