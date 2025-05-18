
"use server";
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firestore'; 
import type { Company, UserRole } from '@/lib/types';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

if (!db) {
  console.warn("Firestore is not initialized. Company service will not work.");
}

const getCurrentUserUid = (): string | null => {
  if (!auth) return null;
  return auth.currentUser?.uid || null;
};

export async function createCompany(name: string): Promise<{ id: string } | { error: string }> {
  if (!db) return { error: "Firestore no está inicializado." };
  const currentUserUid = getCurrentUserUid();
  if (!currentUserUid) {
    return { error: "Usuario no autenticado." };
  }

  try {
    const companyData: Omit<Company, 'id'> = {
      name,
      ownerUid: currentUserUid,
      members: {
        [currentUserUid]: 'admin' as UserRole,
      },
      createdAt: serverTimestamp() as any, 
      updatedAt: serverTimestamp() as any,
    };
    const docRef = await addDoc(collection(db, 'companies'), companyData);
    revalidatePath('/dashboard/empresas'); // Ruta actualizada
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
    const q = query(collection(db, 'companies'), where(`members.${currentUserUid}`, "!=", null));
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
      return { id: companySnap.id, ...companySnap.data() } as Company;
    }
    return null;
  } catch (error) {
    console.error("Error fetching company by ID:", error);
    return null;
  }
}

export async function canUserManageCompany(companyId: string, userId?: string | null): Promise<boolean> {
  const uid = userId || getCurrentUserUid();
  if (!uid) return false;

  const company = await getCompanyById(companyId);
  if (!company) return false;
  
  return company.members[uid] === 'admin';
}


export async function updateCompany(companyId: string, name: string): Promise<{ success: boolean } | { error: string }> {
    if (!db) return { error: "Firestore no está inicializado." };
    const currentUserUid = getCurrentUserUid();
    if (!currentUserUid || !(await canUserManageCompany(companyId, currentUserUid))) {
        return { error: "No autorizado para actualizar esta empresa." };
    }

    try {
        const companyDocRef = doc(db, 'companies', companyId);
        await updateDoc(companyDocRef, {
            name,
            updatedAt: serverTimestamp(),
        });
        revalidatePath(`/dashboard/empresas`); // Ruta actualizada
        revalidatePath(`/dashboard/empresas/${companyId}`); // Ruta actualizada
        return { success: true };
    } catch (error) {
        console.error("Error updating company:", error);
        return { error: "No se pudo actualizar la empresa." };
    }
}

export async function addCompanyMember(companyId: string, email: string, role: UserRole): Promise<{ success: boolean } | { error: string }> {
    if (!db) return { error: "Firestore no está inicializado." };
    const currentUserUid = getCurrentUserUid();
    if (!currentUserUid || !(await canUserManageCompany(companyId, currentUserUid))) {
        return { error: "No autorizado para añadir miembros." };
    }
    const targetUserUid = "placeholder_uid_for_" + email.split('@')[0]; 

    try {
        const companyDocRef = doc(db, 'companies', companyId);
        await updateDoc(companyDocRef, {
            [`members.${targetUserUid}`]: role,
            updatedAt: serverTimestamp(),
        });
        revalidatePath(`/dashboard/empresas/${companyId}/configuracion`); // Ruta actualizada
        return { success: true };
    } catch (error) {
        console.error("Error adding company member:", error);
        return { error: "No se pudo añadir el miembro." };
    }
}

export async function removeCompanyMember(companyId: string, memberUid: string): Promise<{ success: boolean } | { error: string }> {
    if (!db) return { error: "Firestore no está inicializado." };
    const currentUserUid = getCurrentUserUid();
    if (!currentUserUid || !(await canUserManageCompany(companyId, currentUserUid))) {
        return { error: "No autorizado para remover miembros." };
    }
    
    const company = await getCompanyById(companyId);
    if (company && company.ownerUid === memberUid) {
        return { error: "No se puede remover al propietario de la empresa." };
    }

    try {
        const companyDocRef = doc(db, 'companies', companyId);
        const companyData = await getCompanyById(companyId);
        if (!companyData) return { error: "Empresa no encontrada."};
        
        const updatedMembers = { ...companyData.members };
        delete updatedMembers[memberUid];

        await updateDoc(companyDocRef, {
            members: updatedMembers,
            updatedAt: serverTimestamp(),
        });

        revalidatePath(`/dashboard/empresas/${companyId}/configuracion`); // Ruta actualizada
        return { success: true };
    } catch (error) {
        console.error("Error removing company member:", error);
        return { error: "No se pudo remover el miembro." };
    }
}

export async function deleteCompany(companyId: string): Promise<{ success: boolean } | { error: string }> {
    if (!db) return { error: "Firestore no está inicializado." };
    const currentUserUid = getCurrentUserUid();
    if (!currentUserUid || !(await canUserManageCompany(companyId, currentUserUid))) {
        return { error: "No autorizado para eliminar esta empresa." };
    }
    
    const company = await getCompanyById(companyId);
    if (company && company.ownerUid !== currentUserUid) {
        return { error: "Solo el propietario puede eliminar la empresa." };
    }

    try {
        const companyDocRef = doc(db, 'companies', companyId);
        await deleteDoc(companyDocRef);
        revalidatePath('/dashboard/empresas'); // Ruta actualizada
        return { success: true };
    } catch (error) {
        console.error("Error deleting company:", error);
        return { error: "No se pudo eliminar la empresa." };
    }
}
