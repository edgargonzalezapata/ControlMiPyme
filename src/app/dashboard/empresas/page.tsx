
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Briefcase, Loader2, Edit, Trash2, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuthContext } from '@/context/AuthProvider';
import { useActiveCompany } from '@/context/ActiveCompanyProvider'; // Import useActiveCompany
import type { Company } from '@/lib/types';
import CreateCompanyForm from './_components/CreateCompanyForm';
import { collection, query, where, onSnapshot, Unsubscribe, doc, deleteDoc as firebaseDeleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firestore';
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

export default function EmpresasGestionDashboardPage() {
  const { user, loading: authLoading, isFirebaseReady } = useAuthContext();
  const { setActiveCompanyId } = useActiveCompany(); // Get setActiveCompanyId
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    if (isFirebaseReady && !authLoading && user?.uid && db) {
      setIsLoadingCompanies(true);
      try {
        const q = query(collection(db, 'companies'), where(`members.${user.uid}`, 'in', ['admin', 'viewer']));
        
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const userCompanies = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Company));
          setCompanies(userCompanies);
          setIsLoadingCompanies(false);
        }, (error) => {
          console.error("Error al cargar empresas con snapshot:", error);
          toast({ title: "Error al cargar empresas", description: "No se pudieron obtener los datos en tiempo real.", variant: "destructive" });
          setCompanies([]);
          setIsLoadingCompanies(false);
        });

      } catch (error) {
        console.error("Error al construir la consulta:", error);
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

  const handleDeleteCompany = async (companyToDelete: Company) => {
    if (!user || !db) {
      toast({ title: "Error", description: "No autenticado o base de datos no disponible.", variant: "destructive" });
      return;
    }

    if (companyToDelete.ownerUid !== user.uid) {
      toast({ title: "Acción no permitida", description: "Solo el propietario puede eliminar la empresa.", variant: "destructive" });
      return;
    }

    setIsDeleting(companyToDelete.id);
    try {
      const companyDocRef = doc(db, 'companies', companyToDelete.id);
      await firebaseDeleteDoc(companyDocRef); 
      toast({ title: "Empresa Eliminada", description: `La empresa "${companyToDelete.name}" ha sido eliminada.` });
    } catch (error: any) {
      console.error("Error deleting company from client:", error);
      let errorMessage = "No se pudo eliminar la empresa.";
      if (error.code === 'permission-denied') {
        errorMessage = "Error de permisos al eliminar la empresa.";
      } else if (error.message) {
        errorMessage += ` Detalles: ${error.message}`;
      }
      toast({ title: "Error al Eliminar", description: errorMessage, variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAccessCompany = (companyId: string) => {
    setActiveCompanyId(companyId);
    router.push('/dashboard'); // Navigate to the main dashboard for the selected company
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
    <div className="container px-3 sm:px-4 mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestionar Empresas</h1>
        <CreateCompanyForm />
      </div>

      {companies.length === 0 && !isLoadingCompanies ? (
        <Card className="text-center py-8 sm:py-12">
          <CardHeader>
            <Briefcase className="mx-auto h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
            <CardTitle className="text-xl sm:text-2xl">No tienes empresas registradas</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Crea tu primera empresa para empezar a gestionar tus finanzas.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">Usa el botón "Nueva Empresa" para comenzar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {companies.map((company: Company) => (
            <Card key={company.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <span className="truncate">{company.name}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {company.ownerUid === user?.uid ? "Propietario" : `Miembro (${company.members[user?.uid || ''] || 'lector'})`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                 <Button onClick={() => handleAccessCompany(company.id)} className="w-full mt-2 sm:mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <span className="mr-1 sm:mr-2">Acceder</span> <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4"/>
                </Button>
              </CardContent>
              <CardFooter className="flex flex-wrap sm:flex-nowrap justify-end gap-2 pt-3 sm:pt-4 border-t">
                <Button asChild variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setActiveCompanyId(company.id); }}>
                  <Link href="/dashboard/configuracion" className="text-xs sm:text-sm">
                    <Edit className="mr-1 sm:mr-2 h-3 w-3" /> <span className="hidden xs:inline">Configurar</span><span className="xs:hidden">Config</span>
                  </Link>
                </Button>
                {company.ownerUid === user?.uid && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isDeleting === company.id} onClick={(e) => e.stopPropagation()} className="text-xs sm:text-sm">
                        {isDeleting === company.id ? <Loader2 className="mr-1 sm:mr-2 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 sm:mr-2 h-3 w-3" />}
                        <span className="hidden xs:inline">Eliminar</span><span className="xs:hidden">Elim</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
                          onClick={() => handleDeleteCompany(company)}
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
