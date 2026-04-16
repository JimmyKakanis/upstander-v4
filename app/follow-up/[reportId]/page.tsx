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
        return (
          <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-600">
            Loading report…
          </div>
        );
    }

    if (error) {
        return (
          <div className="mx-auto max-w-md px-4 py-16">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800">
              {error}
            </div>
          </div>
        );
    }

    if (!report) {
        return (
          <div className="mx-auto max-w-md px-4 py-16 text-center text-slate-600">
            No report data to display.
          </div>
        );
    }

    const statusClass =
      report.status === 'new'
        ? 'bg-amber-100 text-amber-900'
        : report.status === 'Under Investigation'
          ? 'bg-blue-100 text-blue-900'
          : 'bg-emerald-100 text-emerald-900';

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Your report</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Report status</h2>
                </div>
                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}>
                    {report.status}
                </span>
            </div>

            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-500">Reference code</dt>
                <dd className="mt-1 font-mono text-slate-900">{report.referenceCode}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Submitted</dt>
                <dd className="mt-1 text-slate-900">{report.createdAt.toDate().toLocaleDateString()}</dd>
              </div>
            </dl>
            
            <div className="mt-8 border-t border-slate-100 pt-8">
                <h3 className="text-base font-semibold text-slate-900">Follow-up conversation</h3>
                <p className="mt-1 text-xs text-slate-500">Messages here stay anonymous on your side.</p>
                <div ref={messagesContainerRef} className="mt-4 flex h-80 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    {messagesLoading ? (
                        <p className="self-center py-8 text-center text-sm text-slate-500">Loading conversation…</p>
                    ) : messages.length > 0 ? (
                        messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'reporter' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                    msg.sender === 'reporter' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-800'
                                }`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    {msg.timestamp && (
                                        <p className={`mt-1 text-right text-xs ${msg.sender === 'reporter' ? 'text-blue-100' : 'text-slate-400'}`}>
                                          {msg.timestamp.toDate().toLocaleTimeString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="self-center px-4 py-8 text-center text-sm text-slate-500">
                            You can chat anonymously with a staff member here. Send a message to start.
                        </p>
                    )}
                </div>
                <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                    <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message…"
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    />
                    <button 
                        type="submit"
                        className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
        </div>
    );
}
