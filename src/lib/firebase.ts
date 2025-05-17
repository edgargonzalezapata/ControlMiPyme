import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
if (!getApps().length) {
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase API Key is missing. Firebase will not be initialized. Please set NEXT_PUBLIC_FIREBASE_API_KEY in your .env.local file.");
    // Potentially throw an error or handle this state if Firebase is critical at boot
    app = null; 
  } else {
    app = initializeApp(firebaseConfig);
  }
} else {
  app = getApp();
}

const auth = app ? getAuth(app) : null; // Get auth instance only if app was initialized

// It's good practice to ensure auth is available before trying to use it.
// Components using auth should check if it's null.
if (!auth && process.env.NODE_ENV !== 'test' && firebaseConfig.apiKey) { // Added apiKey check here
    console.error("Firebase Authentication could not be initialized. Check your Firebase config.");
}


export { app, auth };
