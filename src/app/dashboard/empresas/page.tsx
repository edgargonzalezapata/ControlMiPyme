"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Briefcase, PlusCircle, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/context/AuthProvider';
import { getUserCompanies } from '@/lib/companyService';
import type { Company } from '@/lib/types';
import CreateCompanyForm from './_components/CreateCompanyForm';

export default function EmpresasDashboardPage() {
  const { user, loading: authLoading, isFirebaseReady } = useAuthContext();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  useEffect(() => {
    if (isFirebaseReady && !authLoading && user?.uid) {
      const fetchCompanies = async () => {
        setIsLoadingCompanies(true);
        try {
          const userCompanies = await getUserCompanies(user.uid);
          setCompanies(userCompanies);
        } catch (error) {
          console.error("Failed to fetch companies:", error);
          setCompanies([]); // Set to empty array on error
        } finally {
          setIsLoadingCompanies(false);
        }
      };
      fetchCompanies();
    } else if (isFirebaseReady && !authLoading && !user) {
      // No user logged in, or UID not available yet
      setCompanies([]);
      setIsLoadingCompanies(false);
    }
    // Explicitly set loading to false if firebase isn't ready or auth is still loading after initial check
    // This prevents indefinite loading if the initial conditions aren't met.
    else if (!isFirebaseReady || authLoading) {
        setIsLoadingCompanies(true); // Keep loading if auth or firebase is not ready
    }

  }, [user, authLoading, isFirebaseReady]);

  if (authLoading || (!isFirebaseReady && isLoadingCompanies)) {
    return (
      <div className="container mx-auto flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando tus datos...</p>
      </div>
    );
  }
  
  if (isLoadingCompanies && isFirebaseReady) {
     return (
      <div className="container mx-auto flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando empresas...</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Mis Empresas</h1>
        <CreateCompanyForm />
      </div>

      {companies.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <Briefcase className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">No tienes empresas registradas</CardTitle>
            <CardDescription>
              Crea tu primera empresa para empezar a gestionar tus finanzas.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">Usa el botón "Nueva Empresa" para comenzar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company: Company) => (
            <Card key={company.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary" />
                  {company.name}
                </CardTitle>
                <CardDescription>
                  {/* Use user.uid from AuthContext */}
                  {company.ownerUid === user?.uid ? "Propietario" : `Miembro (${company.members[user?.uid || ''] || 'lector'})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Haz clic para ver detalles y gestionar cuentas.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href={`/dashboard/empresas/${company.id}`}>Acceder a Empresa</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
