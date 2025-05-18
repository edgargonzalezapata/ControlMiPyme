
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import type { Company } from '@/lib/types';
import { Loader2, LayoutDashboard, Banknote, Settings, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EmpresaDetailDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading, isFirebaseReady } = useAuthContext();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const empresaId = params?.empresaId as string; // params puede ser null inicialmente

  const [company, setCompany] = useState<Company | null>(null);
  const [isAuthorizedMember, setIsAuthorizedMember] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loadingCompanyData, setLoadingCompanyData] = useState(true);

  useEffect(() => {
    if (!isFirebaseReady || authLoading) {
      // AuthProvider está manejando el estado de carga inicial o Firebase no está listo
      return;
    }

    if (!user) {
      // No hay usuario, redirigir a la página de inicio (DashboardLayout también podría manejar esto)
      router.push('/'); 
      return;
    }

    if (empresaId && user.uid) {
      const fetchCompanyData = async () => {
        setLoadingCompanyData(true);
        if (!db) {
          console.error("Firestore DB no está disponible.");
          setIsAuthorizedMember(false);
          setLoadingCompanyData(false);
          return;
        }
        try {
          const companyDocRef = doc(db, 'companies', empresaId);
          const companySnap = await getDoc(companyDocRef);

          if (companySnap.exists()) {
            const fetchedCompany = { id: companySnap.id, ...companySnap.data() } as Company;
            // Verificar si el usuario actual es miembro
            if (fetchedCompany.members && fetchedCompany.members[user.uid]) {
              setCompany(fetchedCompany);
              setIsAuthorizedMember(true);
              setIsAdmin(fetchedCompany.members[user.uid] === 'admin');
            } else {
              // Usuario no es miembro
              setIsAuthorizedMember(false);
            }
          } else {
            // Empresa no encontrada
            setIsAuthorizedMember(false);
          }
        } catch (error) {
          console.error("Error fetching company data in layout:", error);
          setIsAuthorizedMember(false);
        } finally {
          setLoadingCompanyData(false);
        }
      };
      fetchCompanyData();
    } else if (!empresaId && isFirebaseReady && !authLoading && user) {
        // empresaId no está disponible aún, pero el resto está listo.
        // Esto puede suceder brevemente mientras los params se resuelven.
        // No hacer nada o mostrar un cargador más específico si es necesario.
        setLoadingCompanyData(true); // Mantener cargando hasta que empresaId esté disponible
    }
  }, [empresaId, user, authLoading, router, isFirebaseReady]);

  if (authLoading || loadingCompanyData || isAuthorizedMember === null || !isFirebaseReady) {
    return (
      <div className="flex min-h-[calc(100vh-20rem)] flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando datos de la empresa...</p>
      </div>
    );
  }

  if (!isAuthorizedMember) {
    return (
      <div className="container mx-auto text-center py-10">
        <h1 className="text-2xl font-semibold text-destructive">Acceso Denegado o Empresa No Encontrada</h1>
        <p className="text-muted-foreground mt-2">No tienes permiso para ver esta empresa o no existe.</p>
        <Button onClick={() => router.push('/dashboard/empresas')} className="mt-6">Volver a Mis Empresas</Button>
      </div>
    );
  }
  
  if (!company) {
    // Este caso no debería ocurrir si isAuthorizedMember es true y loadingCompanyData es false,
    // pero es un fallback.
     return (
      <div className="container mx-auto text-center py-10">
        <p>Cargando empresa...</p>
      </div>
     );
  }


  const navItems = [
    { href: `/dashboard/empresas/${empresaId}`, label: 'Resumen', icon: LayoutDashboard },
    { href: `/dashboard/empresas/${empresaId}/cuentas`, label: 'Cuentas', icon: Banknote },
    { href: `/dashboard/empresas/${empresaId}/transacciones`, label: 'Transacciones', icon: FileText },
    ...(isAdmin ? [{ href: `/dashboard/empresas/${empresaId}/configuracion`, label: 'Configuración', icon: Settings }] : []),
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/empresas')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Mis Empresas
        </Button>
        <h1 className="text-3xl font-bold text-foreground">{company.name}</h1>
        <p className="text-muted-foreground">Gestiona la información financiera de tu empresa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <aside className="md:col-span-3">
          <Card>
            <CardContent className="p-4">
              <nav className="flex flex-col gap-2">
                {navItems.map(item => (
                  <Link key={item.href} href={item.href} passHref>
                    <Button
                      variant={pathname === item.href ? "default" : "ghost"}
                      className="w-full justify-start"
                      aria-current={pathname === item.href ? "page" : undefined}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>
        <main className="md:col-span-9">
          {children}
        </main>
      </div>
    </div>
  );
}
