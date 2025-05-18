
"use server";
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firestore';
import type { Company, UserRole } from '@/lib/types';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc, deleteDoc, deleteField } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

if (!db) {
  console.warn("Firestore is not initialized. Company service will not work.");
}

// No longer using getCurrentUserUid for getUserCompanies directly
// const getCurrentUserUid = (): string | null => {
//   if (!auth) return null;
//   return auth.currentUser?.uid || null;
// };

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

// Modified to accept userId as a parameter
export async function getUserCompanies(userId: string): Promise<Company[]> {
  if (!db) return [];
  if (!userId) {
    console.warn("getUserCompanies called without a userId.");
    return [];
  }

  try {
    // Query companies where the userId is a key in the members map
    // and their role is either 'admin' or 'viewer'.
    const q = query(collection(db, 'companies'), where(`members.${userId}`, 'in', ['admin', 'viewer']));
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
      // Authorization for this specific function might be handled by the calling client component,
      // or by Firestore rules. If called from server, need a way to get auth context.
      // For now, assuming client-side checks are primary for display.
      return company;
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
  // For Server Actions that modify data, relying on client-passed UID for canUserManageCompany
  // can be insecure if not coupled with strong Firestore rules.
  // Assuming Firestore rules will enforce that only an admin member can update.
  // const currentUserUid = (await auth?.currentUser?.getIdTokenResult())?.token; // Example for getting user server-side via token, complex
  // For now, we'll rely on the client providing its UID for the canUserManageCompany check
  // and Firestore rules to be the ultimate gatekeeper.
  const tempAuth = auth; // Temporary to get currentUser if available for logging, not for security logic
  const currentUserUid = tempAuth?.currentUser?.uid;


  if (!currentUserUid || !(await canUserManageCompany(companyId, currentUserUid))) {
    return { error: "No autorizado para actualizar esta empresa. Se requiere ser administrador." };
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

async function findUserByEmail(email: string): Promise<{ uid: string, displayName: string | null } | null> {
  if (!db) return null;
  console.warn("findUserByEmail is using a placeholder strategy. This is not secure for production and will likely not find arbitrary users. It will create a placeholder UID based on the email.");
  return { uid: `placeholder_uid_for_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, displayName: email };
}


export async function addCompanyMember(companyId: string, email: string, role: UserRole): Promise<{ success: boolean} | { error: string}> {
  if (!db) return { error: "Firestore no está inicializado." };
  const tempAuth = auth;
  const currentUserUid = tempAuth?.currentUser?.uid;

  if (!currentUserUid || !(await canUserManageCompany(companyId, currentUserUid))) {
    return { error: "No autorizado para añadir miembros a esta empresa." };
  }

  const company = await getCompanyById(companyId);
  if (!company) return { error: "Empresa no encontrada." };

  const userToAdd = await findUserByEmail(email);
  if (!userToAdd?.uid) {
    return { error: `No se pudo determinar el UID para el correo ${email}.` };
  }

  if (company.members && company.members[userToAdd.uid]) {
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
  const tempAuth = auth;
  const currentUserUid = tempAuth?.currentUser?.uid;

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

    revalidatePath(`/dashboard/empresas/${companyId}/configuracion`);
    return { success: true };
  } catch (error) {
    console.error("Error removing company member:", error);
    return { error: "No se pudo eliminar el miembro." };
  }
}

export async function deleteCompany(companyId: string): Promise<{ success: boolean} | { error: string}> {
  if (!db) return { error: "Firestore no está inicializado." };
  const tempAuth = auth;
  const currentUserUid = tempAuth?.currentUser?.uid;
  const company = await getCompanyById(companyId); // This get uses client SDK, may fail due to permissions if called from server context without auth

  if (!company) {
    return { error: "Empresa no encontrada o acceso denegado." };
  }
  if (!currentUserUid || company.ownerUid !== currentUserUid) {
    return { error: "Solo el propietario puede eliminar la empresa." };
  }

  try {
    const companyDocRef = doc(db, 'companies', companyId);
    await deleteDoc(companyDocRef);
    revalidatePath('/dashboard/empresas');
    return { success: true };
  } catch (error) {
    console.error("Error deleting company:", error);
    return { error: "No se pudo eliminar la empresa." };
  }
}

// This function is called by other server actions.
// It attempts to get company data. It should be robust.
export async function canUserManageCompany(companyId: string, userId?: string | null): Promise<boolean> {
  if (!db || !userId) return false;

  // getCompanyById itself might have auth issues if called from a server context
  // without client's auth. We must ensure it can fetch the company document.
  // For now, assuming Firestore rules allow a logged-in user (even on server via some mechanism)
  // to read the company if they are a member. This is a tricky part.
  // A more robust `getCompanyById` for server use might need Admin SDK or specific rules.
  const companyDocRef = doc(db, 'companies', companyId);
  try {
    const companySnap = await getDoc(companyDocRef);
    if (companySnap.exists()) {
      const companyData = companySnap.data() as Omit<Company, 'id'>; // Cast to ensure members field exists
      if (companyData.members && companyData.members[userId] === 'admin') {
        return true;
      }
    }
  } catch (error) {
      // If getDoc fails due to permissions, it means the server context (even if acting for a user)
      // can't read the document, so they definitely can't manage it.
      console.error(`Permission error or other issue in canUserManageCompany for company ${companyId}, user ${userId}:`, error);
      return false;
  }
  return false;
}
