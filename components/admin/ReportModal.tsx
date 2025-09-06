"use client";

import { Report } from '@/types';
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
        onUpdate({ ...report, notes: updatedNotes });
        setNewNote('');
    } catch (error) {
        console.error("Error adding note: ", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Report Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
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
        <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-bold mb-2">Private Notes</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                {report.notes?.map((note, index) => (
                    <div key={index} className="bg-gray-100 p-2 rounded">
                        <p className="text-sm">{note.note}</p>
                        <p className="text-xs text-gray-500 text-right">{note.createdAt.toDate().toLocaleString()}</p>
                    </div>
                ))}
            </div>
            <div>
                <textarea 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new note..."
                    className="w-full p-2 border rounded"
                />
                <button 
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mt-2"
                >
                    Add Note
                </button>
            </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
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
