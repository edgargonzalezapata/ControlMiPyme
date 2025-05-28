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
  
  // Si no hay app de Firebase, intentar inicializar de nuevo
  if (!app) {
    console.warn('Firestore: Firebase App is not initialized. Attempting to reinitialize...');
    
    // Importar dinámicamente para evitar problemas de circular dependency
    import('./firebase').then(({ initializeFirebaseManually }) => {
      const firebaseApp = initializeFirebaseManually();
      if (firebaseApp) {
        console.log('Firestore: Firebase App reinitialized successfully');
        // Inicializar Firestore después de reiniciar Firebase
        firestoreDb = getFirestore(firebaseApp);
        console.log('Firestore: Initialized successfully after Firebase reinitialization');
        
        // Guardar en variable global
        if (typeof window !== 'undefined') {
          window.__FIRESTORE_DB__ = firestoreDb;
        }
      } else {
        console.error('Firestore: Failed to reinitialize Firebase App');
      }
    }).catch(error => {
      console.error('Firestore: Error importing firebase module:', error);
    });
    
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
