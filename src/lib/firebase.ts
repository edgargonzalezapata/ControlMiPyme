import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from "firebase/auth";

// Add TypeScript declaration for the global variable
declare global {
  interface Window {
    __FIREBASE_APP__?: FirebaseApp;
  }
}

// Firebase app instance with proper typing
let app: FirebaseApp | null = null;

// Function to clean environment variables from extra quotes
const cleanEnvValue = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  // Remove surrounding quotes if they exist
  return value.replace(/^["'](.*)["']$/, '$1');
};

// Initialize Firebase only on client side and only once
if (typeof window !== 'undefined') {
  try {
    const existingApps = getApps();
    console.log("Firebase: Checking existing apps:", existingApps.length);
    
    if (existingApps.length === 0) {
      // TEMPORARY: Hard-coded config for development
      // IMPORTANT: In production, use environment variables
      const firebaseConfig = {
        apiKey: "AIzaSyDOQWd-V--A0lg6_DK6zhgLsvAIEdL6Cd8",
        authDomain: "controlmipyme.firebaseapp.com",
        projectId: "controlmipyme",
        storageBucket: "controlmipyme.appspot.com",
        messagingSenderId: "144622112570",
        appId: "1:144622112570:web:5ae937bebf7ba2b7348a03"
      };

      console.log("Firebase: Config ready with values:", { 
        hasApiKey: !!firebaseConfig.apiKey,
        hasAuthDomain: !!firebaseConfig.authDomain,
        hasProjectId: !!firebaseConfig.projectId,
        hasStorageBucket: !!firebaseConfig.storageBucket,
        hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
        hasAppId: !!firebaseConfig.appId
      });

      if (!firebaseConfig.apiKey) {
        console.warn('Firebase API Key is missing. Firebase will not be initialized.');
      } else {
        // Initialize Firebase with wrapped error logging
        try {
          app = initializeApp(firebaseConfig);
          window.__FIREBASE_APP__ = app; // Store in global for debugging
          console.log('Firebase initialized successfully:', !!app);
        } catch (initErr) {
          console.error('Firebase initialization internal error:', initErr);
          app = null;
        }
      }
    } else {
      // Use the existing app instance
      app = existingApps[0];
      window.__FIREBASE_APP__ = app; // Store in global for debugging
      console.log('Using existing Firebase app instance');
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    app = null;
  }
}

// Get auth instance with proper typing
let auth: Auth | null = null;
if (app) {
  try {
    auth = getAuth(app);
    console.log('Firebase Auth initialized successfully:', !!auth);
  } catch (error) {
    console.error("Error initializing Firebase Auth:", error);
    auth = null;
  }
}

// It's good practice to ensure auth is available before trying to use it.
// Components using auth should check if it's null.
if (!auth && process.env.NODE_ENV !== 'test' && app && app.options.apiKey) {
  console.error("Firebase Authentication could not be initialized. Check your Firebase config.");
}

export { app, auth };
