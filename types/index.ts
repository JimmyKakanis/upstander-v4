import { Timestamp } from 'firebase/firestore';

export interface AdminUser {
  uid: string;
  email: string | null;
  schoolId: string;
}

export interface ConversationMessage {
  sender: 'student' | 'admin';
  message: string;
  createdAt: Timestamp;
}

export interface Report {
  id: string;
  typeOfBullying: 'Verbal' | 'Physical' | 'Cyber' | 'Social Exclusion';
  description: string;
  date?: string;
  time?: string;
  location?: string;
  status: 'new' | 'Under Investigation' | 'Resolved';
  createdAt: Timestamp;
  schoolId: string;
  referenceCode: string;
  notes?: Array<{
    note: string;
    createdAt: Timestamp;
  }>;
  conversation?: ConversationMessage[];
}
