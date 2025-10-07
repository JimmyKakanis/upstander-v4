"use client";

import { Report, ConversationMessage } from '@/types';
import { doc, updateDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';

interface ReportModalProps {
  report: Report;
  onClose: () => void;
  onUpdate: (updatedReport: Report) => void;
}

export default function ReportModal({ report, onClose, onUpdate }: ReportModalProps) {
  const [newNote, setNewNote] = useState('');
  const [newMessage, setNewMessage] = useState('');

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

    const message: ConversationMessage = {
        sender: 'admin',
        message: newMessage,
        createdAt: Timestamp.now()
    };

    try {
        const reportRef = doc(db, 'reports', report.id);
        await updateDoc(reportRef, {
            conversation: arrayUnion(message)
        });
        
        const updatedConversation = [...(report.conversation || []), message];
        const updatedReport = { ...report, conversation: updatedConversation };
        onUpdate(updatedReport);
        setNewMessage('');
    } catch (error) {
        console.error("Error sending message:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Report Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">&times;</button>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="max-h-[70vh] overflow-y-auto pr-4">
            <div>
              <p><strong>Reference Code:</strong> {report.referenceCode}</p>
              <p><strong>Type of Bullying:</strong> {report.typeOfBullying}</p>
              <p><strong>Status:</strong> {report.status}</p>
              <p><strong>Date of Incident:</strong> {report.date || 'Not provided'}</p>
              <p><strong>Time of Incident:</strong> {report.time || 'Not provided'}</p>
              <p><strong>Location:</strong> {report.location || 'Not provided'}</p>
              <p className="mt-4"><strong>Description:</strong></p>
              <p className="bg-gray-100 p-2 rounded">{report.description}</p>
            </div>
            
            {/* Container for Notes and Conversation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t pt-4">
              
              {/* Private Notes Section */}
              <div>
                <h3 className="text-lg font-bold mb-2">Private Notes</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto mb-4 bg-gray-50 p-2 rounded">
                    {report.notes?.slice().sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map((note, index) => (
                        <div key={index} className="bg-white p-2 rounded shadow">
                            <p className="text-sm">{note.note}</p>
                            <p className="text-xs text-gray-500 text-right">{note.createdAt.toDate().toLocaleString()}</p>
                        </div>
                    ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleAddNote(); }} className="flex">
                    <input 
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a new note..."
                        className="flex-grow p-2 border rounded-l-md"
                    />
                    <button type="submit" className="px-4 py-2 bg-gray-500 text-white rounded-r-md hover:bg-gray-600">
                        Add Note
                    </button>
                </form>
              </div>

              {/* Conversation Section */}
              <div>
                <h3 className="text-lg font-bold mb-2">Student Conversation</h3>
                <div className="space-y-4 max-h-48 overflow-y-auto mb-4 bg-gray-50 p-2 rounded">
                    {report.conversation?.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-xs ${
                                msg.sender === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                            }`}>
                                <p>{msg.message}</p>
                                <p className="text-xs opacity-75 mt-1 text-right">{msg.createdAt.toDate().toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSendMessage} className="flex">
                    <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Reply to student..."
                        className="flex-grow p-2 border rounded-l-md"
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700">
                        Send
                    </button>
                </form>
              </div>
            </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4 border-t pt-4">
          <button 
            onClick={() => handleStatusChange('Under Investigation')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Mark as Under Investigation
          </button>
          <button 
            onClick={() => handleStatusChange('Resolved')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Mark as Resolved
          </button>
        </div>
      </div>
    </div>
  );
}
