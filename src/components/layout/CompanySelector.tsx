"use client";
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from '@/context/AuthProvider';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import type { Company } from '@/lib/types';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import { ChevronsUpDown, Building, Briefcase, Loader2 } from 'lucide-react';

export function CompanySelector() {
  const { user, loading: authLoading } = useAuthContext();
  const { activeCompanyId, setActiveCompanyId, activeCompanyDetails, isLoadingActiveCompany } = useActiveCompany();
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // Método alternativo para obtener empresas del usuario
  const fetchUserCompanies = async (userId: string) => {
    if (!db || !userId) {
      return [];
    }
    
    setIsLoadingCompanies(true);
    
    try {
      // Enfoque 1: Obtener todas las empresas de las que el usuario es propietario
      // Esta consulta debería funcionar siempre con nuestras reglas
      const ownerQuery = query(
        collection(db, 'companies'),
        where("ownerUid", "==", userId)
      );
      
      const querySnapshot = await getDocs(ownerQuery);
      
      // Convertir documentos a objetos Company
      const companies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Company));
      
      return companies;
    } catch (error) {
      console.error("Error fetching user companies for selector:", error);
      return [];
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchUserCompanies(user.uid).then(companies => {
        setUserCompanies(companies);
        
        // Verificar si el ID de empresa activa es válido
        if (activeCompanyId && !activeCompanyDetails && companies.length > 0) {
          if (!companies.find(c => c.id === activeCompanyId)) {
            setActiveCompanyId(null);
          }
        }
      });
    } else if (!user && !authLoading) {
      setUserCompanies([]);
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
      <div className="flex items-center gap-2 h-9 sm:h-10 px-3 sm:px-4 text-sm text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm animate-pulse w-full sm:w-auto">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
        <span className="hidden sm:inline">Cargando empresas...</span>
        <span className="sm:hidden">Cargando...</span>
      </div>
    );
  }

  if (userCompanies.length === 0) {
    return (
      <div className="flex items-center gap-2 h-9 sm:h-10 px-3 sm:px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-lg shadow-sm w-full sm:w-auto">
        <Briefcase className="h-4 w-4 text-indigo-500" />
        <span className="font-medium">Sin empresas</span>
      </div>
    );
  }
  
  return (
    <div className="w-full sm:w-auto">
      <Select
        value={activeCompanyId || "no-company"}
        onValueChange={handleCompanyChange}
        disabled={isLoadingActiveCompany}
      >
        <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[280px] h-9 sm:h-10 px-3 sm:px-4 text-sm sm:text-base bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-400 focus:ring-1 rounded-lg shadow-sm transition-all duration-200">
          <div className="flex items-center gap-2 truncate">
            {isLoadingActiveCompany ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500 flex-shrink-0" />
            ) : (
              <Building className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            )}
            <SelectValue>
              {isLoadingActiveCompany ? (
                <span className="text-gray-500">Cargando...</span>
              ) : activeCompanyDetails ? (
                <span className="truncate font-medium text-gray-800 dark:text-gray-200 max-w-[120px] sm:max-w-none">{activeCompanyDetails.name}</span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">Seleccionar Empresa</span>
              )}
              {!isLoadingActiveCompany && !activeCompanyDetails && (
                <span className="text-gray-500 dark:text-gray-400 sm:hidden">Empresa</span>
              )}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="w-[280px] sm:w-auto">
          {activeCompanyId && (
            <SelectItem value="no-company" className="text-gray-500 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/30 transition-colors">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="italic">Ninguna (Ver general)</span>
              </div>
            </SelectItem>
          )}
          <div className="py-1 px-1">
            {userCompanies.map((company, index) => (
              <SelectItem 
                key={company.id} 
                value={company.id} 
                className="font-medium rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all duration-200 my-0.5"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></div>
                  <span className="truncate">{company.name}</span>
                </div>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
