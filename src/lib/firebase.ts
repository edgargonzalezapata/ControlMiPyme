import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from "firebase/auth";

// Add TypeScript declaration for the global variable
declare global {
  interface Window {
    __FIREBASE_APP__?: FirebaseApp;
    __FIREBASE_CONFIG__?: any;
  }
}

// Configuración predeterminada de Firebase
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDOQWd-V--A0lg6_DK6zhgLsvAIEdL6Cd8",
  authDomain: "controlmipyme.firebaseapp.com",
  projectId: "controlmipyme",
  storageBucket: "controlmipyme.appspot.com",
  messagingSenderId: "144622112570",
  appId: "1:144622112570:web:5ae937bebf7ba2b7348a03"
};

// Variable para almacenar la instancia de Firebase
let firebaseApp: FirebaseApp | null = null;

// Función para obtener la configuración de Firebase
function getFirebaseConfig() {
  // Si estamos en el navegador y ya tenemos la configuración guardada, usarla
  if (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__) {
    return window.__FIREBASE_CONFIG__;
  }
  
  // Obtener configuración de las variables de entorno
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  // Verificar que todos los valores requeridos estén presentes
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    console.error('Firebase: Missing required configuration fields:', missingFields);
    throw new Error(`Firebase configuration is missing required fields: ${missingFields.join(', ')}`);
  }

  // Guardar la configuración en el objeto window para futuras referencias
  if (typeof window !== 'undefined') {
    window.__FIREBASE_CONFIG__ = config;
  }
  
  return config;
}

// Función para inicializar Firebase
function initializeFirebase() {
  // Solo inicializar en el lado del cliente
  if (typeof window === 'undefined') {
    console.log('Firebase: Skipping initialization in server-side rendering');
    return null;
  }
  
  // Si ya tenemos una instancia, devolverla
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Verificar si ya hay aplicaciones inicializadas
    const existingApps = getApps();
    console.log("Firebase: Checking existing apps:", existingApps.length);
    
    if (existingApps.length > 0) {
      console.log('Firebase: Using existing app instance');
      firebaseApp = existingApps[0];
      return firebaseApp;
    }
    
    // Obtener la configuración
    const firebaseConfig = getFirebaseConfig();
    
    // Verificar que la configuración sea válida
    console.log("Firebase: Config ready with values:", { 
      hasApiKey: !!firebaseConfig.apiKey,
      hasAuthDomain: !!firebaseConfig.authDomain,
      hasProjectId: !!firebaseConfig.projectId,
      hasStorageBucket: !!firebaseConfig.storageBucket,
      hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
      hasAppId: !!firebaseConfig.appId
    });
    
    // Inicializar Firebase
    firebaseApp = initializeApp(firebaseConfig);
    console.log('Firebase: Initialized successfully');
    
    // Almacenar en variable global para depuración
    if (typeof window !== 'undefined') {
      window.__FIREBASE_APP__ = firebaseApp;
    }
    
    return firebaseApp;
  } catch (error) {
    console.error('Firebase: Error initializing:', error);
    return null;
  }
}

// Exportar la función de inicialización y la instancia
export const app = typeof window !== 'undefined' ? initializeFirebase() : null;

// Get auth instance with proper typing
let auth: Auth | null = null;

// Inicializar auth si app está disponible
if (app) {
  try {
    auth = getAuth(app);
    console.log('Auth initialized successfully');
  } catch (error) {
    console.error('Error initializing Auth:', error);
    auth = null;
  }
} else {
  console.log('Auth: Firebase App is not initialized. Auth will not be available.');
}

// Exportar auth
export { auth };

// It's good practice to ensure auth is available before trying to use it.
// Components using auth should check if it's null.
if (!auth && process.env.NODE_ENV !== 'test' && app && app.options.apiKey) {
  console.error("Firebase Authentication could not be initialized. Check your Firebase config.");
}
