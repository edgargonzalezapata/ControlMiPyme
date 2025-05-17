import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'; // Renamed signOut to firebaseSignOut
import { auth } from './firebase'; // auth can be null if Firebase isn't configured

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  if (!auth) {
    console.error("Firebase Auth is not initialized. Cannot sign in.");
    throw new Error("Firebase Auth no está inicializado.");
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    // Convert Firebase error codes to user-friendly messages if desired
    throw error;
  }
}

export async function signOutUser() {
  if (!auth) {
    console.error("Firebase Auth is not initialized. Cannot sign out.");
    // Optionally throw an error or handle gracefully
    return;
  }
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
}
