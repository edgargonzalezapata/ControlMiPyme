"use client";

import { db } from './firestore';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { isFirestoreAvailable } from './firestore';

/**
 * Función para inicializar y verificar las colecciones de Firestore
 * Esta función comprueba si Firestore está disponible y si se puede acceder a las colecciones necesarias
 * @returns Objeto con el resultado de la inicialización
 */
export async function initializeFirestoreCollections(): Promise<{ success: boolean, message: string }> {
  console.log('Verificando disponibilidad de Firestore, db:', db);
  
  // Verificar si Firestore está disponible
  if (!isFirestoreAvailable()) {
    return {
      success: false,
      message: 'Firestore no está disponible. Verifica la configuración de Firebase.'
    };
  }
  
  try {
    // Lista de colecciones que la aplicación necesita
    const collections = ['companies', 'recurringServices', 'serviceBillings'];
    const failedCollections: string[] = [];
    
    // Verificar acceso a cada colección
    for (const collectionName of collections) {
      try {
        // Intentar obtener un documento de la colección
        if (db) {
          const q = query(collection(db, collectionName), limit(1));
          await getDocs(q);
          console.log(`✅ Acceso verificado a la colección: ${collectionName}`);
        } else {
          throw new Error('Firestore no está inicializado');
        }
      } catch (error) {
        // Registrar error y añadir a la lista de colecciones fallidas
        console.error(`❌ Error al acceder a la colección ${collectionName}:`, error);
        failedCollections.push(collectionName);
      }
    }
    
    // Si hay colecciones a las que no se pudo acceder, devolver error
    if (failedCollections.length > 0) {
      return {
        success: false,
        message: `No se pudo acceder a las siguientes colecciones: ${failedCollections.join(', ')}. Verifica los permisos en las reglas de seguridad de Firestore.`
      };
    }
    
    // Todo correcto
    return {
      success: true,
      message: 'Todas las colecciones de Firestore están disponibles.'
    };
  } catch (error) {
    // Error general durante la verificación
    console.error('Error al inicializar colecciones de Firestore:', error);
    return {
      success: false,
      message: 'Error al verificar las colecciones de Firestore. Verifica la consola para más detalles.'
    };
  }
}
