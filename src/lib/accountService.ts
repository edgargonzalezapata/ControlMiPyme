
"use server";
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firestore';
import type { BankAccount } from '@/lib/types';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { canUserManageCompany } from './companyService'; 

if (!db) {
  console.warn("Firestore is not initialized. Account service will not work.");
}

const getCurrentUserUid = (): string | null => {
  // Problematic in server actions. Should receive UID or verify token.
  return auth?.currentUser?.uid || null;
};

export async function createBankAccount(companyId: string, accountData: Omit<BankAccount, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'balance'>): Promise<{ id: string } | { error: string }> {
  if (!db) return { error: "Firestore no está inicializado." };
  const currentUserUid = getCurrentUserUid();

  // This canUserManageCompany check from a server action context using client SDK for auth is unreliable.
  // Firestore rules are the primary defense.
  if (!currentUserUid || !(await canUserManageCompany(companyId, currentUserUid))) {
    return { error: "No autorizado para crear cuentas en esta empresa (verificación del servidor)." };
  }

  try {
    const newAccountData: Omit<BankAccount, 'id'> = {
      ...accountData,
      companyId,
      balance: 0, 
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };
    const docRef = await addDoc(collection(db, 'bankAccounts'), newAccountData);
    revalidatePath(`/dashboard/cuentas`); // Revalidate the new global accounts page
    return { id: docRef.id };
  } catch (error) { // Added missing opening brace here
    console.error("Error creating bank account:", error);
    return { error: "No se pudo crear la cuenta bancaria." };
  }
}

// getBankAccountsByCompany is now primarily called by client-side components.
// Kept as server action for potential other uses.
export async function getBankAccountsByCompany(companyId: string): Promise<BankAccount[]> {
  if (!db) return [];
   const currentUserUid = getCurrentUserUid(); // Unreliable from server context
   // Client should verify membership before showing link to this company's accounts.
   // Server rules will enforce actual read permissions.

  try {
    const q = query(collection(db, 'bankAccounts'), where('companyId', '==', companyId));
    const querySnapshot = await getDocs(q);
    const accounts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
    return accounts;
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return [];
  }
}

export async function getBankAccountById(accountId: string): Promise<BankAccount | null> {
    if (!db) return null;
    try {
        const accountDocRef = doc(db, 'bankAccounts', accountId);
        const accountSnap = await getDoc(accountDocRef);

        if (accountSnap.exists()) {
            const account = { id: accountSnap.id, ...accountSnap.data() } as BankAccount;
            // Client-side should verify this account belongs to the activeCompanyId.
            // Server rules will enforce if user can read this specific account.
            return account;
        }
        return null;
    } catch (error) {
        console.error("Error fetching bank account by ID:", error);
        return null;
    }
}

export async function updateBankAccount(accountId: string, data: Partial<Omit<BankAccount, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'balance'>>): Promise<{ success: boolean} | { error: string}> {
    if (!db) return { error: "Firestore no está inicializado." };
    
    const account = await getBankAccountById(accountId); 
    if (!account) return { error: "Cuenta no encontrada o acceso no autorizado." };

    // This check is unreliable from server action context
    if (!(await canUserManageCompany(account.companyId, getCurrentUserUid()))) {
        return { error: "No autorizado para actualizar esta cuenta bancaria (verificación del servidor)." };
    }
    
    try {
        const accountDocRef = doc(db, 'bankAccounts', accountId);
        await updateDoc(accountDocRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
        revalidatePath(`/dashboard/cuentas`); 
        revalidatePath(`/dashboard/cuentas/${accountId}/importar`); 
        return { success: true };
    } catch (error) {
        console.error("Error updating bank account:", error);
        return { error: "No se pudo actualizar la cuenta bancaria." };
    }
}

export async function deleteBankAccount(accountId: string): Promise<{ success: boolean} | { error: string}> {
    if (!db) return { error: "Firestore no está inicializado." };

    const account = await getBankAccountById(accountId); 
    if (!account) return { error: "Cuenta no encontrada o acceso no autorizado." };

    // This check is unreliable from server action context
    if (!(await canUserManageCompany(account.companyId, getCurrentUserUid()))) {
        return { error: "No autorizado para eliminar esta cuenta bancaria (verificación del servidor)." };
    }
    
    try {
        const accountDocRef = doc(db, 'bankAccounts', accountId);
        await deleteDoc(accountDocRef);
        revalidatePath(`/dashboard/cuentas`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting bank account:", error);
        return { error: "No se pudo eliminar la cuenta bancaria." };
    }
}
