"use server";

import { auth } from '@/lib/firebase';
import { db } from '@/lib/firestore';
import type { Company, UserRole } from '@/lib/types';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc, deleteDoc, deleteField } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

if (!db) {
  console.warn("Firestore is not initialized. Company service will not work.");
}

const getCurrentUserUid = (): string | null => {
  // This is problematic for server actions as auth.currentUser is client-side.
  // Server actions should receive UID or verify token.
  // For now, this will likely be null if called from a pure server action context.
  return auth?.currentUser?.uid || null;
};

export async function createCompany(name: string, ownerUid: string): Promise<{ id: string } | { error: string }> {
  if (!db) return { error: "Firestore no está inicializado." };

  if (!ownerUid) {
    return { error: "UID de usuario no proporcionado para crear la empresa." };
  }

  try {
    const companyData: Omit<Company, 'id'> = {
      name,
      ownerUid,
      members: {
        [ownerUid]: 'admin' as UserRole,
      },
      currency: 'CLP', // Default currency for Chilean peso
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };
    const docRef = await addDoc(collection(db, 'companies'), companyData);
    revalidatePath('/dashboard/empresas'); // Page for managing companies
    return { id: docRef.id };
  } catch (error: any) {
    console.error("Error creating company:", error);
    let errorMessage = "No se pudo crear la empresa.";
    if (error.message) {
      errorMessage += ` Detalles: ${error.message}`;
    }
    if (error.code) {
      errorMessage += ` (Código: ${error.code})`;
    }
    return { error: errorMessage };
  }
}

// This function is called by client components now, passing the user's UID.
export async function getUserCompanies(userId: string): Promise<Company[]> {
  if (!db) return [];
  if (!userId) {
    console.warn("getUserCompanies called without a userId.");
    return [];
  }

  try {
    const q = query(collection(db, 'companies'), where(`members.${userId}`, 'in', ['admin', 'viewer']));
    const querySnapshot = await getDocs(q);
    const companies = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Company));
    return companies;
  } catch (error) {
    console.error("Error fetching user companies:", error);
    return [];
  }
}

// getCompanyById is mainly used server-side by other server actions or for initial props (less common now)
// Client-side components should fetch directly if auth-dependent for read rules.
// Or, ensure this is called by a context that has the necessary permissions (e.g. admin SDK if needed)
export async function getCompanyById(companyId: string): Promise<Company | null> {
  if (!db) return null;
  try {
    const companyDocRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyDocRef);

    if (companySnap.exists()) {
      return { id: companySnap.id, ...companySnap.data() } as Company;
    }
    return null;
  } catch (error: any) {
    console.error("Error fetching company by ID:", error);
     if (error.code === 'permission-denied') {
        console.error("Firestore permission denied when fetching company by ID:", companyId);
    }
    return null;
  }
}


export async function updateCompany(companyId: string, newName: string): Promise<{ success: boolean} | { error: string}> {
  if (!db) return { error: "Firestore no está inicializado." };
  
  const currentUserUid = getCurrentUserUid(); // This is still potentially problematic

  if (!currentUserUid || !(await canUserManageCompany(companyId, currentUserUid))) {
    return { error: "No autorizado para actualizar esta empresa. Se requiere ser administrador." };
  }

  try {
    const companyDocRef = doc(db, 'companies', companyId);
    await updateDoc(companyDocRef, {
      name: newName,
      updatedAt: serverTimestamp(),
    });
    revalidatePath('/dashboard/configuracion'); // For the active company config page
    revalidatePath('/dashboard/empresas'); // For the list of companies
    // We also need a way to tell ActiveCompanyProvider to refresh details if this is the active company
    return { success: true };
  } catch (error) {
    console.error("Error updating company:", error);
    return { error: "No se pudo actualizar la empresa." };
  }
}

async function findUserByEmail(email: string): Promise<{ uid: string, displayName: string | null } | null> {
  if (!db) return null;
  console.warn("findUserByEmail is using a placeholder strategy. This is not secure for production. Ideally, use a Firebase Function or Admin SDK to look up users by email.");
  // This placeholder is NOT for real user lookup. It's a simplification.
  // In a real app, you'd need a secure way to get UID from email, e.g., via Firebase Admin SDK.
  return { uid: `placeholder_uid_for_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, displayName: email };
}


export async function addCompanyMember(companyId: string, email: string, role: UserRole): Promise<{ success: boolean} | { error: string}> {
  if (!db) return { error: "Firestore no está inicializado." };
  const currentUserUid = getCurrentUserUid();

  if (!currentUserUid || !(await canUserManageCompany(companyId, currentUserUid))) {
    return { error: "No autorizado para añadir miembros a esta empresa." };
  }

  const company = await getCompanyById(companyId); // This call might fail if rules are strict based on request.auth
  if (!company) return { error: "Empresa no encontrada." };

  const userToAdd = await findUserByEmail(email);
  if (!userToAdd?.uid) {
    return { error: `No se pudo determinar el UID para el correo ${email}. (Usando placeholder)` };
  }

  if (company.members && company.members[userToAdd.uid]) {
    return { error: `El usuario ${email} ya es miembro de esta empresa.` };
  }

  try {
    const companyDocRef = doc(db, 'companies', companyId);
    await updateDoc(companyDocRef, {
      [`members.${userToAdd.uid}`]: role,
      updatedAt: serverTimestamp(),
    });
    revalidatePath(`/dashboard/configuracion`);
    // Need to refresh active company details if this is the active one
    return { success: true };
  } catch (error) {
    console.error("Error adding company member:", error);
    return { error: "No se pudo añadir el miembro." };
  }
}

export async function removeCompanyMember(companyId: string, memberUidToRemove: string): Promise<{ success: boolean} | { error: string}> {
  if (!db) return { error: "Firestore no está inicializado." };
  const currentUserUid = getCurrentUserUid();

  if (!currentUserUid || !(await canUserManageCompany(companyId, currentUserUid))) {
    return { error: "No autorizado para eliminar miembros de esta empresa." };
  }

  const company = await getCompanyById(companyId);
  if (!company) return { error: "Empresa no encontrada." };

  if (company.ownerUid === memberUidToRemove) {
    return { error: "No se puede eliminar al propietario de la empresa."};
  }

  if (!company.members || !company.members[memberUidToRemove]) {
    return { error: "El usuario no es miembro de esta empresa." };
  }

  try {
    const companyDocRef = doc(db, 'companies', companyId);
    const updates:any = {};
    updates[`members.${memberUidToRemove}`] = deleteField();
    updates.updatedAt = serverTimestamp();

    await updateDoc(companyDocRef, updates);
    revalidatePath(`/dashboard/configuracion`);
    // Need to refresh active company details
    return { success: true };
  } catch (error) {
    console.error("Error removing company member:", error);
    return { error: "No se pudo eliminar el miembro." };
  }
}

// This function is called by client-side now for deletion
// export async function deleteCompany(companyId: string): Promise<{ success: boolean} | { error: string}> { ... }
// We keep the server action for potential future use or direct server calls, but client will use direct deleteDoc
export async function deleteCompany(companyId: string): Promise<{ success: boolean} | { error: string}> {
  if (!db) return { error: "Firestore no está inicializado." };
  const currentUserUid = getCurrentUserUid();
  
  // This getCompanyById call here will likely fail due to request.auth being null from server action context
  // The client-side deletion logic handles ownership check before calling this.
  // For this server action to be secure standalone, it would need Admin SDK or token verification.
  const company = await getCompanyById(companyId); 

  if (!company) {
    return { error: "Empresa no encontrada o acceso denegado por el servidor." };
  }
  if (!currentUserUid || company.ownerUid !== currentUserUid) {
    // This check relies on currentUserUid which is unreliable in server actions using client SDK
    return { error: "Solo el propietario puede eliminar la empresa (verificación del servidor)." };
  }

  try {
    const companyDocRef = doc(db, 'companies', companyId);
    await deleteDoc(companyDocRef);
    revalidatePath('/dashboard/empresas'); // For the list of companies
    revalidatePath('/dashboard'); // Main dashboard if this was the active company
    return { success: true };
  } catch (error) {
    console.error("Error deleting company (server action):", error);
    return { error: "No se pudo eliminar la empresa (server action)." };
  }
}


export async function canUserManageCompany(companyId: string, userId?: string | null): Promise<boolean> {
  if (!db || !userId) return false;
  // This function, if called from a server action, will suffer from request.auth == null.
  // It's more reliable if companyData is passed in, or if it uses Admin SDK.
  try {
    const companyDocRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyDocRef); // This read needs to be allowed by Firestore rules for the server env
    if (companySnap.exists()) {
      const companyData = companySnap.data() as Omit<Company, 'id'>;
      if (companyData.members && companyData.members[userId] === 'admin') {
        return true;
      }
    }
  } catch (error) {
      console.error(`Permission error or other issue in canUserManageCompany for company ${companyId}, user ${userId}:`, error);
      return false;
  }
  return false;
}
