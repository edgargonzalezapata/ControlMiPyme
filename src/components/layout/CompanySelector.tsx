
"use client";
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from '@/context/AuthProvider';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import type { Company } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import { ChevronsUpDown, Building } from 'lucide-react';

export function CompanySelector() {
  const { user, loading: authLoading } = useAuthContext();
  const { activeCompanyId, setActiveCompanyId, activeCompanyDetails, isLoadingActiveCompany } = useActiveCompany();
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  useEffect(() => {
    if (user && !authLoading && db) {
      setIsLoadingCompanies(true);
      const q = query(collection(db, 'companies'), where(`members.${user.uid}`, 'in', ['admin', 'viewer']));
      getDocs(q).then(querySnapshot => {
        const companiesData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Company));
        setUserCompanies(companiesData);
        
        // If there's a stored activeCompanyId but no details (e.g., first load),
        // and it's not in the fetched list, clear it.
        if (activeCompanyId && !activeCompanyDetails && companiesData.length > 0) {
            if (!companiesData.find(c => c.id === activeCompanyId)) {
                setActiveCompanyId(null);
            }
        }
        // If no active company is set and user has companies, set the first one as active by default?
        // For now, let user explicitly select.

      }).catch(error => {
        console.error("Error fetching user companies for selector:", error);
      }).finally(() => {
        setIsLoadingCompanies(false);
      });
    } else if (!user && !authLoading) {
        setUserCompanies([]); // Clear companies if user logs out
    }
  }, [user, authLoading, activeCompanyId, activeCompanyDetails, setActiveCompanyId]);

  const handleCompanyChange = (companyId: string) => {
    if (companyId === "no-company") {
        setActiveCompanyId(null);
    } else {
        setActiveCompanyId(companyId);
    }
  };

  if (authLoading || isLoadingCompanies || !user) {
    return (
        <div className="flex items-center justify-center h-9 w-[180px] px-3 text-sm text-muted-foreground bg-muted/50 rounded-md">
            Cargando...
        </div>
    );
  }

  if (userCompanies.length === 0) {
    return (
         <div className="flex items-center justify-center h-9 w-auto px-3 text-sm text-muted-foreground bg-muted/50 rounded-md">
            Sin empresas
        </div>
    );
  }
  
  return (
    <Select
      value={activeCompanyId || "no-company"}
      onValueChange={handleCompanyChange}
      disabled={isLoadingActiveCompany}
    >
      <SelectTrigger className="w-auto min-w-[180px] max-w-[250px] h-9 text-sm focus:ring-primary focus:ring-offset-0 focus:ring-1">
        <div className="flex items-center gap-2 truncate">
            <Building className="h-4 w-4 text-muted-foreground" />
            <SelectValue>
             {activeCompanyDetails ? (
                <span className="truncate font-medium">{activeCompanyDetails.name}</span>
             ) : "Seleccionar Empresa"}
            </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {activeCompanyId && (
            <SelectItem value="no-company" className="text-muted-foreground italic">
                Ninguna (Ver general)
            </SelectItem>
        )}
        {userCompanies.map(company => (
          <SelectItem key={company.id} value={company.id}>
            {company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
