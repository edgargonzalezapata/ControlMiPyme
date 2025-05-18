
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type UserRole = 'admin' | 'viewer';

export interface CompanyMember {
  uid: string;
  role: UserRole;
  email?: string; // For display purposes
  displayName?: string; // For display purposes
}

export interface Company {
  id: string;
  name: string;
  ownerUid: string;
  members: { [uid: string]: UserRole }; // uid: role
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BankAccount {
  id: string;
  companyId: string;
  accountName: string;
  accountNumber: string; // Consider masking or encryption for display/storage
  bankName: string;
  currency: string; // e.g., CLP, USD
  balance: number; // This would be a calculated field or updated periodically
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Transaction {
  id: string;
  companyId: string;
  accountId: string;
  date: Timestamp;
  description: string;
  amount: number; // Positive for income, negative for expense
  type: 'ingreso' | 'egreso';
  category?: string; // Classified by AI or user
  originalFileName?: string;
  storagePath?: string; // Path to the original .xlsx file in Firebase Storage
  importedAt: Timestamp;
  notes?: string;
}
