"use client";

import { Report, ConversationMessage } from '@/types';
import { doc, Timestamp, arrayUnion, onSnapshot, collection, query, orderBy, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useState, useEffect, useRef } from 'react';

interface ReportModalProps {
  report: Report;
  onClose: () => void;
  onUpdate: (updatedReport: Report) => void;
}

export default function ReportModal({ report, onClose, onUpdate }: ReportModalProps) {
  const [newNote, setNewNote] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!report.id) return;

    setMessagesLoading(true);
    const conversationRef = doc(db, 'conversations', report.id);

    const unsubscribe = onSnapshot(conversationRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Ensure messages are sorted by timestamp
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
  }, [report.id]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStatusChange = async (newStatus: 'Under Investigation' | 'Resolved') => {
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

    const authToken = await auth.currentUser?.getIdToken();
    if (!authToken) {
      console.error("Not authenticated");
      return;
    }

    const messageText = newMessage;
    const optimisticMessage: ConversationMessage = {
      text: messageText,
      sender: 'admin',
      timestamp: Timestamp.now(),
    };

    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    setNewMessage('');

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Report Details</h2>
            <p className="text-sm text-slate-500 font-mono mt-1">{report.referenceCode}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-4xl leading-none transition-colors">&times;</button>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="max-h-[70vh] overflow-y-auto pr-2">
            {/* Report Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Type of Bullying</p>
                        <p className="text-slate-800">{report.bullyingType}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Date of Incident</p>
                        <p className="text-slate-800">{report.date || 'Not provided'}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-slate-500">Location</p>
                        <p className="text-slate-800">{report.location || 'Not provided'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Involved Parties</p>
                        <p className="text-slate-800">{report.involvedParties || 'Not provided'}</p>
                    </div>
                </div>
                <div className="space-y-4">
                     <div>
                        <p className="text-sm font-medium text-slate-500">Status</p>
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            report.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                            report.status === 'Under Investigation' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                            {report.status}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Time of Incident</p>
                        <p className="text-slate-800">{report.time || 'Not provided'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Year Level</p>
                        <p className="text-slate-800">{report.yearLevel || 'Not provided'}</p>
                    </div>
                </div>
            </div>
            
            {/* Description */}
            <div className="mb-6">
                <p className="text-sm font-medium text-slate-500 mb-1">What Happened</p>
                <p className="bg-slate-50 p-4 rounded-lg text-slate-800 border border-slate-200">{report.whatHappened}</p>
            </div>
            
            {/* Container for Notes and Conversation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
              
              {/* Private Notes Section */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Private Staff Notes</h3>
                <div className="space-y-3 mb-4">
                    {report.notes?.slice().sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map((note, index) => (
                        <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-700">{note.note}</p>
                            <p className="text-xs text-slate-400 text-right mt-2">{note.createdAt.toDate().toLocaleString()}</p>
                        </div>
                    ))}
                    {(!report.notes || report.notes.length === 0) && (
                        <p className="text-sm text-slate-400 italic">No notes yet.</p>
                    )}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleAddNote(); }} className="flex">
                    <input 
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a new note..."
                        className="flex-grow p-2 text-sm border-slate-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button type="submit" className="px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-r-md hover:bg-slate-700 transition-colors">
                        Add
                    </button>
                </form>
              </div>

              {/* Conversation Section */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Student Conversation</h3>
                <div ref={messagesContainerRef} className="space-y-4 mb-4 h-48 overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {messagesLoading ? (
                      <p className="text-sm text-slate-400 italic">Loading conversation...</p>
                    ) : messages.length > 0 ? (
                      messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-xs text-sm ${
                                msg.sender === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'
                            }`}>
                                <p>{msg.text}</p>
                                {msg.timestamp && (
                                  <p className="text-xs opacity-75 mt-1 text-right">{msg.timestamp.toDate().toLocaleTimeString()}</p>
                                )}
                            </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 italic">No messages yet.</p>
                    )}
                </div>
                <form onSubmit={handleSendMessage} className="flex">
                    <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Reply to student..."
                        className="flex-grow p-2 text-sm border-slate-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-r-md hover:bg-blue-700 transition-colors">
                        Send
                    </button>
                </form>
              </div>
            </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4 border-t border-slate-200 pt-6">
          <button 
            onClick={() => handleStatusChange('Under Investigation')}
            className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-md hover:bg-blue-200 transition-colors"
          >
            Mark as Under Investigation
          </button>
          <button 
            onClick={() => handleStatusChange('Resolved')}
            className="px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-md hover:bg-green-200 transition-colors"
          >
            Mark as Resolved
          </button>
        </div>
      </div>
    </div>
  );
}
