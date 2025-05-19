import { app } from './firebase'; // Assuming app is correctly initialized here
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

// Add TypeScript declaration for the global variable
declare global {
  interface Window {
    __FIRESTORE_DB__?: Firestore;
  }
}

// Define the database with proper typing
let db: Firestore | null = null;

// Add backup check for app from global
const getApp = () => {
  if (app) return app;
  if (typeof window !== 'undefined' && window.__FIREBASE_APP__) {
    console.log('Firestore: Using Firebase app from global variable');
    return window.__FIREBASE_APP__;
  }
  return null;
};

const firebaseApp = getApp();

if (firebaseApp) {
  console.log('Firestore: Attempting to initialize with Firebase app', firebaseApp);
  // Check if Firestore is already initialized, common in HMR scenarios
  try {
    db = getFirestore(firebaseApp);
    console.log('Firestore: Initialized successfully via getFirestore');
    // Store in window for debugging
    if (typeof window !== 'undefined') {
      window.__FIRESTORE_DB__ = db;
    }
  } catch (e) {
    // Initialize Firestore if not already done.
    // This might happen if getFirestore(app) is called before initializeFirestore in some environments.
    // Adjust as per your specific Firebase SDK version and setup.
    // For modular SDK v9+, initializeFirestore is more for specific settings like persistence.
    // getFirestore(app) should generally suffice.
    console.warn("Firestore: Instance not found, attempting to initialize with initializeFirestore.", e);
    try {
      db = initializeFirestore(firebaseApp, {
        // Optional settings:
        // localCache: persistentLocalCache(/* settings */)
      });
      console.log('Firestore: Initialized successfully via initializeFirestore');
      // Store in window for debugging
      if (typeof window !== 'undefined') {
        window.__FIRESTORE_DB__ = db;
      }
    } catch (initError) {
      console.error("Firestore: Failed to initialize:", initError);
      db = null; // Explicitly set to null if initialization fails
    }
  }
} else {
  console.warn("Firestore: Firebase App is not initialized. Firestore will not be available. Check .env.local file and Firebase configuration.");
  db = null; // Firestore is not available if Firebase app isn't initialized
}

if (!db && firebaseApp && process.env.NODE_ENV !== 'test') {
    // This warning is a bit redundant if `app` itself is null, handled above.
    // More relevant if `app` exists but `getFirestore(app)` failed silently or returned something falsy.
    console.error("Firestore: Could not be initialized. Check your Firebase config and SDK setup.");
} else if (db) {
    console.log('Firestore: Instance is ready to use');
}

export { db };
