
import { app } from './firebase'; // Assuming app is correctly initialized here
import { getFirestore, initializeFirestore } from 'firebase/firestore';

let db;

if (app) {
  // Check if Firestore is already initialized, common in HMR scenarios
  try {
    db = getFirestore(app);
  } catch (e) {
    // Initialize Firestore if not already done.
    // This might happen if getFirestore(app) is called before initializeFirestore in some environments.
    // Adjust as per your specific Firebase SDK version and setup.
    // For modular SDK v9+, initializeFirestore is more for specific settings like persistence.
    // getFirestore(app) should generally suffice.
    console.warn("Firestore instance not found, attempting to initialize.", e);
    try {
      db = initializeFirestore(app, {
        // Optional settings:
        // localCache: persistentLocalCache(/* settings */)
      });
    } catch (initError) {
      console.error("Failed to initialize Firestore:", initError);
      db = null; // Explicitly set to null if initialization fails
    }
  }
} else {
  console.warn("Firebase App is not initialized. Firestore will not be available.");
  db = null; // Firestore is not available if Firebase app isn't initialized
}

if (!db && app && process.env.NODE_ENV !== 'test') {
    // This warning is a bit redundant if `app` itself is null, handled above.
    // More relevant if `app` exists but `getFirestore(app)` failed silently or returned something falsy.
    console.error("Firestore could not be initialized. Check your Firebase config and SDK setup.");
}

export { db };
