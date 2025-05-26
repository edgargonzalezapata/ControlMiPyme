import type { Timestamp } from 'firebase/firestore';

export interface RecurringService {
  id: string;
  companyId: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  billingDay: number; // Día del mes para facturar (1-31)
  nextBillingDate: Timestamp;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ServiceBilling {
  id: string;
  serviceId: string;
  companyId: string;
  billingDate: Timestamp;
  dueDate: Timestamp;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paymentDate?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
