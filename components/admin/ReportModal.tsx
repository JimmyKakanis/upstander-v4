"use client";

import { Report, ConversationMessage } from '@/types';
import { doc, Timestamp, arrayUnion, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useState, useEffect, useRef } from 'react';

interface ReportModalProps {
  report: Report;
  onClose: () => void;
  onUpdate: (updatedReport: Report) => void;
  isDemo?: boolean;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  const isEmpty = !value || value.trim() === '';
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 sm:text-base">
        {isEmpty ? <span className="text-slate-400 italic">Not provided</span> : value}
      </dd>
    </div>
  );
}

export default function ReportModal({ report, onClose, onUpdate, isDemo = false }: ReportModalProps) {
  const [newNote, setNewNote] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!report.id) return;

    if (isDemo) {
        setMessagesLoading(false);
        setMessages([
            {
                sender: 'reporter',
                text: 'I am worried about going to school tomorrow.',
                timestamp: Timestamp.now()
            },
            {
                sender: 'admin',
                text: 'We are here to help. Can you tell us more?',
                timestamp: Timestamp.now()
            }
        ]);
        return;
    }

    setMessagesLoading(true);
    const conversationRef = doc(db, 'conversations', report.id);

    const unsubscribe = onSnapshot(conversationRef, (docSnap) => {
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
    });

    return () => unsubscribe();
  }, [report.id, isDemo]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStatusChange = async (newStatus: 'Under Investigation' | 'Resolved') => {
    if (isDemo) {
        onUpdate({ ...report, status: newStatus });
        onClose();
        return;
    }

    try {
      const reportRef = doc(db, 'reports', report.id);
      await updateDoc(reportRef, { status: newStatus });
      onUpdate({ ...report, status: newStatus });
      onClose();
    } catch (error) {
      console.error("Error updating report status: ", error);
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim() === '') return;

    const noteToAdd = {
        note: newNote,
        createdAt: Timestamp.now()
    };

    if (isDemo) {
        const updatedNotes = [...(report.notes || []), noteToAdd];
        const updatedReport = { ...report, notes: updatedNotes };
        onUpdate(updatedReport);
        setNewNote('');
        return;
    }

    try {
        const reportRef = doc(db, 'reports', report.id);
        await updateDoc(reportRef, {
            notes: arrayUnion(noteToAdd)
        });
        
        const updatedNotes = [...(report.notes || []), noteToAdd];
        const updatedReport = { ...report, notes: updatedNotes };
        onUpdate(updatedReport);
        setNewNote('');
    } catch (error) {
        console.error("Error adding note: ", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !report.id) return;

    const messageText = newMessage;
    const optimisticMessage: ConversationMessage = {
      text: messageText,
      sender: 'admin',
      timestamp: Timestamp.now(),
    };

    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    setNewMessage('');

    if (isDemo) {
        return;
    }

    const authToken = await auth.currentUser?.getIdToken();
    if (!authToken) {
      console.error("Not authenticated");
      return;
    }

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          reportId: report.id,
          text: messageText,
          sender: 'admin',
        }),
      });
    } catch (error) {
        console.error("Error sending message:", error);
        setMessages(prevMessages => prevMessages.filter(msg => msg.timestamp !== optimisticMessage.timestamp));
        setNewMessage(messageText);
    }
  };

  const statusBadgeClass =
    report.status === 'new'
      ? 'bg-amber-100 text-amber-900'
      : report.status === 'Under Investigation'
        ? 'bg-blue-100 text-blue-900'
        : 'bg-emerald-100 text-emerald-900';

  const whatHappenedText = report.whatHappened?.trim() || '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[min(90vh,880px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white font-sans shadow-2xl ring-1 ring-slate-900/5">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Report</p>
            <h2 id="report-modal-title" className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Report details
            </h2>
            <p className="mt-1 font-mono text-sm text-slate-500">{report.referenceCode}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5" aria-label="Report summary">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5">
              <DetailItem label="Type of bullying" value={report.bullyingType} />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass}`}>
                    {report.status}
                  </span>
                </dd>
              </div>
              <DetailItem label="Date of incident" value={report.date || ''} />
              <DetailItem label="Time of incident" value={report.time || ''} />
              <DetailItem label="Location" value={report.location || ''} />
              <DetailItem label="Year level" value={report.yearLevel || ''} />
              <div className="sm:col-span-2">
                <DetailItem label="Involved parties" value={report.involvedParties || ''} />
              </div>
            </dl>
          </section>

          <section className="mt-6" aria-labelledby="what-happened-heading">
            <h3 id="what-happened-heading" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              What happened
            </h3>
            <div className="mt-2 min-h-[4.5rem] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 sm:text-base">
              {whatHappenedText ? (
                <p className="whitespace-pre-wrap">{whatHappenedText}</p>
              ) : (
                <p className="text-slate-400 italic">No description provided.</p>
              )}
            </div>
          </section>

          <div className="mt-8 grid grid-cols-1 gap-8 border-t border-slate-200 pt-8 lg:grid-cols-2 lg:gap-10">
            <section aria-labelledby="staff-notes-heading">
              <h3 id="staff-notes-heading" className="text-base font-semibold text-slate-900">
                Private staff notes
              </h3>
              <p className="mt-1 text-xs text-slate-500">Only visible to staff at your school.</p>
              <div className="mt-4 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    {report.notes?.slice().sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map((note, index) => (
                        <div key={index} className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
                            <p className="text-sm text-slate-800">{note.note}</p>
                            <p className="mt-2 text-right text-xs text-slate-400">{note.createdAt.toDate().toLocaleString()}</p>
                        </div>
                    ))}
                    {(!report.notes || report.notes.length === 0) && (
                        <p className="py-6 text-center text-sm text-slate-400 italic">No notes yet.</p>
                    )}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleAddNote(); }} className="mt-3 flex gap-2">
                    <input 
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note…"
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    />
                    <button type="submit" className="shrink-0 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800">
                        Add
                    </button>
              </form>
            </section>

            <section aria-labelledby="conversation-heading">
              <h3 id="conversation-heading" className="text-base font-semibold text-slate-900">
                Student conversation
              </h3>
              <p className="mt-1 text-xs text-slate-500">Messages stay anonymous for the student.</p>
              <div
                ref={messagesContainerRef}
                className="mt-4 flex h-52 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:h-56"
              >
                    {messagesLoading ? (
                      <p className="py-8 text-center text-sm text-slate-400 italic">Loading conversation…</p>
                    ) : messages.length > 0 ? (
                      messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                msg.sender === 'admin' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-800'
                            }`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                {msg.timestamp && (
                                  <p className={`mt-1 text-right text-xs ${msg.sender === 'admin' ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {msg.timestamp.toDate().toLocaleTimeString()}
                                  </p>
                                )}
                            </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-8 text-center text-sm text-slate-400 italic">No messages yet.</p>
                    )}
              </div>
              <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                    <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Reply to student…"
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    />
                    <button type="submit" className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                        Send
                    </button>
              </form>
            </section>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3">
          <button 
            type="button"
            onClick={() => handleStatusChange('Under Investigation')}
            disabled={report.status === 'Under Investigation'}
            className="rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Mark as under investigation
          </button>
          <button 
            type="button"
            onClick={() => handleStatusChange('Resolved')}
            disabled={report.status === 'Resolved'}
            className="rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Mark as resolved
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
