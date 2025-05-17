"use client";
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth as firebaseAuth } from '@/lib/firebase'; // Renamed to firebaseAuth to avoid conflict

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAuth) {
      console.warn("Firebase Auth is not initialized. Skipping auth state listener.");
      setLoading(false); // Stop loading as auth cannot be checked
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return { user, loading, isFirebaseReady: !!firebaseAuth };
}
