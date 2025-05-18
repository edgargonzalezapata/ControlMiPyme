
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Briefcase, Loader2, Edit, Trash2, ShieldAlert } from 'lucide-react';
import { useAuthContext } from '@/context/AuthProvider';
import type { Company } from '@/lib/types';
import CreateCompanyForm from './_components/CreateCompanyForm';
import { collection, query, where, getDocs, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import { deleteCompany } from '@/lib/companyService'; // Importar deleteCompany
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EmpresasDashboardPage() {
  const { user, loading: authLoading, isFirebaseReady } = useAuthContext();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // companyId being deleted
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    if (isFirebaseReady && !authLoading && user?.uid) {
      setIsLoadingCompanies(true);
      if (!db) {
        console.error("Firestore DB is not available for company listing.");
        setCompanies([]);
        setIsLoadingCompanies(false);
        return;
      }
      try {
        const q = query(collection(db, 'companies'), where(`members.${user.uid}`, 'in', ['admin', 'viewer']));
        
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const userCompanies = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
          setCompanies(userCompanies);
          setIsLoadingCompanies(false);
        }, (error) => {
          console.error("Failed to fetch companies with snapshot:", error);
          toast({ title: "Error al cargar empresas", description: "No se pudieron obtener los datos en tiempo real.", variant: "destructive" });
          setCompanies([]);
          setIsLoadingCompanies(false);
        });

      } catch (error) {
        console.error("Failed to construct query or initial fetch:", error);
        toast({ title: "Error al cargar empresas", description: "Hubo un problema al preparar la consulta.", variant: "destructive" });
        setCompanies([]);
        setIsLoadingCompanies(false);
      }
    } else if (isFirebaseReady && !authLoading && !user) {
      setCompanies([]);
      setIsLoadingCompanies(false);
    } else if (!isFirebaseReady || authLoading) {
      setIsLoadingCompanies(true);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, authLoading, isFirebaseReady, toast]);

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    setIsDeleting(companyId);
    const result = await deleteCompany(companyId);
    if ('success' in result) {
      toast({ title: "Empresa Eliminada", description: `La empresa "${companyName}" ha sido eliminada.` });
      // La lista se actualizará automáticamente por el listener onSnapshot
    } else {
      toast({ title: "Error al Eliminar", description: result.error, variant: "destructive" });
    }
    setIsDeleting(null);
  };


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

      {companies.length === 0 && !isLoadingCompanies ? (
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
                  {company.ownerUid === user?.uid ? "Propietario" : `Miembro (${company.members[user?.uid || ''] || 'lector'})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Haz clic para ver detalles y gestionar cuentas.
                </p>
                 <Button asChild className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href={`/dashboard/empresas/${company.id}`}>Acceder a Empresa</Link>
                </Button>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-4 border-t">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/empresas/${company.id}/configuracion`}>
                    <Edit className="mr-2 h-3 w-3" /> Editar
                  </Link>
                </Button>
                {company.ownerUid === user?.uid && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isDeleting === company.id}>
                        {isDeleting === company.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Trash2 className="mr-2 h-3 w-3" />}
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center"><ShieldAlert className="mr-2 text-destructive h-6 w-6"/>¿Confirmar Eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción es irreversible. Se eliminará la empresa "{company.name}" y todos sus datos asociados.
                          ¿Estás seguro de que quieres continuar?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting === company.id}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCompany(company.id, company.name)}
                          disabled={isDeleting === company.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                           {isDeleting === company.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Sí, eliminar empresa"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

    