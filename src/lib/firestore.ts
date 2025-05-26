import { app } from './firebase';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

// Add TypeScript declaration for the global variable
declare global {
  interface Window {
    __FIRESTORE_DB__?: Firestore;
  }
}

// Variable para almacenar la instancia de Firestore
let firestoreDb: Firestore | null = null;

/**
 * Función para inicializar Firestore
 * Esta función solo debe ejecutarse en el lado del cliente
 */
function initializeFirestore(): Firestore | null {
  // Si no estamos en el cliente, no inicializar
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Si ya tenemos una instancia, devolverla
  if (firestoreDb) {
    return firestoreDb;
  }
  
  // Si no hay app de Firebase, no podemos inicializar Firestore
  if (!app) {
    console.error('Firestore: Firebase App is not initialized. Firestore will not be available. Check .env.local file and Firebase configuration.');
    return null;
  }

  try {
    // Inicializar Firestore
    firestoreDb = getFirestore(app);
    console.log('Firestore: Initialized successfully');
    
    // Conectar al emulador en desarrollo si está configurado
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === 'true') {
      try {
        const host = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost';
        const port = parseInt(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || '8080');
        connectFirestoreEmulator(firestoreDb, host, port);
        console.log(`Firestore: Connected to emulator at ${host}:${port}`);
      } catch (emulatorError) {
        console.warn('Firestore: Failed to connect to emulator:', emulatorError);
      }
    }
    
    // Almacenar en variable global para depuración
    if (typeof window !== 'undefined') {
      window.__FIRESTORE_DB__ = firestoreDb;
    }
    
    return firestoreDb;
  } catch (error) {
    console.error('Firestore: Error initializing:', error);
    return null;
  }
}

// Exportar la instancia de Firestore
// Solo inicializar en el lado del cliente
export const db = typeof window !== 'undefined' ? initializeFirestore() : null;

/**
 * Función para verificar si Firestore está disponible
 * @returns true si Firestore está disponible, false en caso contrario
 */
export function isFirestoreAvailable(): boolean {
  console.log('Verificando disponibilidad de Firestore, db:', db);
  if (!db) {
    console.error('Firestore no está disponible. Verifica la configuración de Firebase.');
    return false;
  }
  return true;
}
