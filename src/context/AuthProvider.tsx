"use client";
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth as firebaseAuthInstance } from '@/lib/firebase'; // Renamed to avoid conflict

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirebaseReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Initialize isFirebaseReady based on the presence of firebaseAuthInstance at the time of AuthProvider mount.
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    console.log("AuthProvider: Checking Firebase Auth initialization status");
    console.log("AuthProvider: firebaseAuthInstance exists?", !!firebaseAuthInstance);
    
    if (!firebaseAuthInstance) {
      console.warn("Firebase Auth is not initialized in AuthProvider. Skipping auth state listener.");
      setLoading(false);
      setIsFirebaseReady(false); // Explicitly set to false
      return;
    }
    
    console.log("AuthProvider: Firebase Auth is initialized, setting up auth state listener");
    setIsFirebaseReady(true); // Firebase is available

    const unsubscribe = onAuthStateChanged(firebaseAuthInstance, (currentUser) => {
      console.log("AuthProvider: Auth state changed, user:", currentUser ? `UID: ${currentUser.uid}` : "null");
      setUser(currentUser);
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this effect runs once on mount

  return (
    <AuthContext.Provider value={{ user, loading, isFirebaseReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
