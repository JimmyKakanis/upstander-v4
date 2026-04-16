import { Timestamp } from 'firebase/firestore';

export interface AdminUser {
  uid: string;
  email: string | null;
  schoolId?: string; // Made optional as it might not be set yet during onboarding
  stripeId?: string;
  stripeLink?: string;
  status?: string; // Subscription status: 'active', 'trialing', 'past_due', 'canceled', etc.
}

export interface ConversationMessage {
  sender: 'reporter' | 'admin';
  text: string;
  timestamp: Timestamp;
}

export interface Report {
  id: string;
  bullyingType: string;
  involvedParties: string;
  yearLevel: string;
  whatHappened: string;
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
}

export type ReportStatus = 'new' | 'Under Investigation' | 'Resolved' | 'all';
export type SortOrder = 'desc' | 'asc';
