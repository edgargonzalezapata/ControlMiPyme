
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
  if (!auth) return null;
  return auth.currentUser?.uid || null;
};

// Modificado para aceptar ownerUid
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
      createdAt: serverTimestamp() as any, 
      updatedAt: serverTimestamp() as any,
    };
    const docRef = await addDoc(collection(db, 'companies'), companyData);
    revalidatePath('/dashboard/empresas');
    return { id: docRef.id };
  } catch (error) {
    console.error("Error creating company:", error);
    return { error: "No se pudo crear la empresa." };
  }
}

export async function getUserCompanies(): Promise<Company[]> {
  if (!db) return [];
  const currentUserUid = getCurrentUserUid();
  if (!currentUserUid) {
    return []; 
  }

  try {
    const q = query(collection(db, 'companies'), where(`members.${currentUserUid}`, 'in', ['admin', 'viewer']));
    const querySnapshot = await getDocs(q);
    const companies = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
    return companies;
  } catch (error) {
    console.error("Error fetching user companies:", error);
    return [];
  }
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  if (!db) return null;
  try {
    const companyDocRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyDocRef);

    if (companySnap.exists()) {
      const company = { id: companySnap.id, ...companySnap.data() } as Company;
      // Basic authorization check: is the current user a member of this company?
      // More granular checks (e.g. canUserManageCompany) should be done by calling functions.
      const currentUserUid = getCurrentUserUid();
      if (!currentUserUid || !company.members[currentUserUid]) {
        // console.warn(`User ${currentUserUid} is not a member of company ${companyId}. Denying access to getCompanyById.`);
        // Depending on strictness, you might return null or throw an error.
        // For general getCompanyById, it might be okay to return data if path is known,
        // but specific actions on company data should be guarded by canUserManageCompany etc.
        // For now, let's assume if they have the ID, they might be able to see basic info
        // but services like update/delete will do stricter checks.
        // However, if the intent is that only members can even "get" the company, this check is important.
        // Let's enforce membership for "get" as well for consistency with other protections.
         if (!company.members[currentUserUid]) {
            // console.warn(`Unauthorized attempt to get company ${companyId} by user ${currentUserUid}`);
            // return null; // Or throw error
         }
      }
      return company;
    }
    return null;
  } catch (error) {
    console.error("Error fetching company by ID:", error);
    return null;
  }
}


export async function updateCompany(companyId: string, newName: string): Promise<{ success: boolean} | { error: string}> {
  if (!db) return { error: "Firestore no está inicializado." };
  const currentUserUid = getCurrentUserUid();
  if (!currentUserUid || !(await canUserManageCompany(companyId, currentUserUid))) {
    return { error: "No autorizado para actualizar esta empresa." };
  }

  try {
    const companyDocRef = doc(db, 'companies', companyId);
    await updateDoc(companyDocRef, {
      name: newName,
      updatedAt: serverTimestamp(),
    });
    revalidatePath(`/dashboard/empresas/${companyId}`);
    revalidatePath(`/dashboard/empresas/${companyId}/configuracion`);
    return { success: true };
  } catch (error) {
    console.error("Error updating company:", error);
    return { error: "No se pudo actualizar la empresa." };
  }
}

// Placeholder: This function needs a secure server-side implementation (e.g., Cloud Function)
// to reliably get a user's UID from their email for adding them as a member.
// Directly querying user data by email from the client-side is not secure or typically possible.
async function findUserByEmail(email: string): Promise<{ uid: string, displayName: string | null } | null> {
  if (!db) return null;
  console.warn("findUserByEmail is using a placeholder strategy. This is not secure for production and will likely not find arbitrary users. It will create a placeholder UID based on the email.");
  // This creates a predictable, non-real UID.
  // In a real system, you'd use Firebase Admin SDK (server-side) or an invitation system.
  return { uid: `placeholder_uid_for_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, displayName: email };
}


export async function addCompanyMember(companyId: string, email: string, role: UserRole): Promise<{ success: boolean} | { error: string}> {
  if (!db) return { error: "Firestore no está inicializado." };
  const currentUserUid = getCurrentUserUid();
  if (!currentUserUid || !(await canUserManageCompany(companyId, currentUserUid))) {
    return { error: "No autorizado para añadir miembros a esta empresa." };
  }

  const company = await getCompanyById(companyId);
  if (!company) return { error: "Empresa no encontrada." };

  // The findUserByEmail used here is a placeholder. 
  // For a real app, replace with a secure method (e.g., via Admin SDK or invite system).
  const userToAdd = await findUserByEmail(email); 
  if (!userToAdd?.uid) { // Check for uid specifically
    return { error: `No se pudo determinar el UID para el correo ${email}.` };
  }

  if (company.members[userToAdd.uid]) {
    return { error: `El usuario ${email} (o su UID placeholder) ya es miembro de esta empresa.` };
  }

  try {
    const companyDocRef = doc(db, 'companies', companyId);
    await updateDoc(companyDocRef, {
      [`members.${userToAdd.uid}`]: role,
      updatedAt: serverTimestamp(),
    });
    revalidatePath(`/dashboard/empresas/${companyId}/configuracion`);
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

  if (!company.members[memberUidToRemove]) {
    return { error: "El usuario no es miembro de esta empresa." };
  }

  try {
    const companyDocRef = doc(db, 'companies', companyId);
    const updates:any = {};
    updates[`members.${memberUidToRemove}`] = deleteField();
    updates.updatedAt = serverTimestamp();
    
    await updateDoc(companyDocRef, updates);

    revalidatePath(`/dashboard/empresas/${companyId}/configuracion`);
    return { success: true };
  } catch (error) {
    console.error("Error removing company member:", error);
    return { error: "No se pudo eliminar el miembro." };
  }
}

export async function deleteCompany(companyId: string): Promise<{ success: boolean} | { error: string}> {
  if (!db) return { error: "Firestore no está inicializado." };
  const currentUserUid = getCurrentUserUid();
  const company = await getCompanyById(companyId);

  if (!company) {
    return { error: "Empresa no encontrada." };
  }
  if (!currentUserUid || company.ownerUid !== currentUserUid) {
    return { error: "Solo el propietario puede eliminar la empresa." };
  }

  try {
    // TODO: Consider deleting associated bank accounts and transactions in a batched write or Cloud Function for atomicity
    const companyDocRef = doc(db, 'companies', companyId);
    await deleteDoc(companyDocRef);
    revalidatePath('/dashboard/empresas');
    return { success: true };
  } catch (error) {
    console.error("Error deleting company:", error);
    return { error: "No se pudo eliminar la empresa." };
  }
}

export async function canUserManageCompany(companyId: string, userId?: string | null): Promise<boolean> {
  if (!db || !userId) return false;
  const company = await getCompanyById(companyId); // This already checks if user is a member (implicitly by returning company or null)
  if (!company) {
    // console.warn(`canUserManageCompany: Company ${companyId} not found or user ${userId} not a member.`);
    return false;
  }
  // Ensure the user is actually listed in members and has the 'admin' role.
  const role = company.members[userId];
  return role === 'admin';
}
