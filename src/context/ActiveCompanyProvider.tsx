
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Company } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import { useAuthContext } from './AuthProvider';

interface ActiveCompanyContextType {
  activeCompanyId: string | null;
  setActiveCompanyId: (companyId: string | null) => void;
  activeCompanyDetails: Company | null;
  isLoadingActiveCompany: boolean;
  refreshActiveCompanyDetails: () => void;
}

const ActiveCompanyContext = createContext<ActiveCompanyContextType | undefined>(undefined);

export function ActiveCompanyProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuthContext();
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null);
  const [activeCompanyDetails, setActiveCompanyDetailsState] = useState<Company | null>(null);
  const [isLoadingActiveCompany, setIsLoadingActiveCompany] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCompanyId = localStorage.getItem('activeCompanyId');
      if (storedCompanyId) {
        setActiveCompanyIdState(storedCompanyId);
      }
    }
  }, []);

  const setActiveCompanyId = useCallback((companyId: string | null) => {
    setActiveCompanyIdState(companyId);
    if (companyId) {
      localStorage.setItem('activeCompanyId', companyId);
    } else {
      localStorage.removeItem('activeCompanyId');
      setActiveCompanyDetailsState(null); // Clear details if no company is active
    }
  }, []);

  const fetchCompanyDetails = useCallback(async (companyId: string) => {
    if (!db || !user || authLoading) return;
    setIsLoadingActiveCompany(true);
    try {
      const companyDocRef = doc(db, 'companies', companyId);
      const companySnap = await getDoc(companyDocRef);
      if (companySnap.exists()) {
        const companyData = { id: companySnap.id, ...companySnap.data() } as Company;
        // Basic check: is user a member of this company?
        if (companyData.members && companyData.members[user.uid]) {
            setActiveCompanyDetailsState(companyData);
        } else {
            // User is not a member of the stored active company, clear it.
            setActiveCompanyDetailsState(null);
            setActiveCompanyId(null); 
        }
      } else {
        setActiveCompanyDetailsState(null);
        setActiveCompanyId(null); // Company not found, clear it.
      }
    } catch (error) {
      console.error("Error fetching active company details:", error);
      setActiveCompanyDetailsState(null);
    } finally {
      setIsLoadingActiveCompany(false);
    }
  }, [user, authLoading, setActiveCompanyId]);


  useEffect(() => {
    if (activeCompanyId && user && !authLoading) {
      fetchCompanyDetails(activeCompanyId);
    } else if (!activeCompanyId) {
        setActiveCompanyDetailsState(null); // Ensure details are cleared if no ID
    }
  }, [activeCompanyId, user, authLoading, fetchCompanyDetails]);

  const refreshActiveCompanyDetails = useCallback(() => {
    if (activeCompanyId) {
        fetchCompanyDetails(activeCompanyId);
    }
  }, [activeCompanyId, fetchCompanyDetails]);

  return (
    <ActiveCompanyContext.Provider value={{ activeCompanyId, setActiveCompanyId, activeCompanyDetails, isLoadingActiveCompany, refreshActiveCompanyDetails }}>
      {children}
    </ActiveCompanyContext.Provider>
  );
}

export function useActiveCompany() {
  const context = useContext(ActiveCompanyContext);
  if (context === undefined) {
    throw new Error('useActiveCompany must be used within an ActiveCompanyProvider');
  }
  return context;
}
