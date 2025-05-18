
"use server";
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firestore'; 
import type { Company, UserRole } from '@/lib/types';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

if (!db) {
  console.warn("Firestore is not initialized. Company service will not work.");
}

// Esta función se mantiene para otros servicios que puedan necesitarla,
// pero createCompany ahora recibirá el UID directamente.
const getCurrentUserUid = (): string | null => {
  if (!auth) return null;
  return auth.currentUser?.uid || null;
};

// Modificar la firma para aceptar ownerUid
export async function createCompany(name: string, ownerUid: string): Promise<{ id: string } | { error: string }> {
  if (!db) return { error: "Firestore no está inicializado." };
  
  // El UID ahora viene como parámetro, validamos que se haya proporcionado
  if (!ownerUid) {
    return { error: "UID de usuario no proporcionado para crear la empresa." };
  }

  try {
    const companyData: Omit<Company, 'id'> = {
      name,
      ownerUid: ownerUid, // Usar el UID pasado como parámetro
      members: {
        [ownerUid]: 'admin' as UserRole, // Usar el UID pasado como parámetro
      },
      createdAt: serverTimestamp() as any, 
      updatedAt: serverTimestamp() as any,
    };
    const docRef = await addDoc(collection(db, 'companies'), companyData);
    revalidatePath('/dashboard/empresas');
    return { id: docRef.id };
  } catch (error)
