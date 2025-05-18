
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthProvider';
import { getCompanyById } from '@/lib/companyService'; // canUserManageCompany is also used but not directly imported
import type { Company } from '@/lib/types';
import { Loader2, LayoutDashboard, Banknote, Settings, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EmpresaDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading, isFirebaseReady } = useAuthContext();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const empresaId = params.empresaId as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loadingCompany, setLoadingCompany] = useState(true);

  useEffect(() => {
    if (!isFirebaseReady || authLoading) return;

    if (!user) {
      router.push('/'); // Redirect to login if not authenticated
      return;
    }

    if (empresaId && user?.uid) {
      const fetchCompanyData = async () => {
        setLoadingCompany(true);
        const fetchedCompany = await getCompanyById(empresaId);
        if (fetchedCompany) {
          if (fetchedCompany.members && fetchedCompany.members[user.uid]) {
            setCompany(fetchedCompany);
            setIsAuthorized(true);
            setIsAdmin(fetchedCompany.members[user.uid] === 'admin');
          } else {
            setIsAuthorized(false);
          }
        } else {
          setIsAuthorized(false); // Company not found
        }
        setLoadingCompany(false);
      };
      fetchCompanyData();
    }
  }, [empresaId, user, authLoading, router, isFirebaseReady]);

  if (authLoading || loadingCompany || isAuthorized === null || !isFirebaseReady) {
    return (
      <div className="flex min-h-[calc(100vh-15rem)] flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando datos de la empresa...</p>
      </div>
    );
  }

  if (!user) {
     return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirigiendo...</p>
      </div>
    );
  }

  if (!isAuthorized || !company) {
    return (
      <div className="container mx-auto text-center py-10">
        <h1 className="text-2xl font-semibold text-destructive">Acceso Denegado o Empresa No Encontrada</h1>
        <p className="text-muted-foreground mt-2">No tienes permiso para ver esta empresa o no existe.</p>
        <Button onClick={() => router.push('/empresas')} className="mt-6">Volver a Mis Empresas</Button>
      </div>
    );
  }

  const navItems = [
    { href: `/empresas/${empresaId}`, label: 'Resumen', icon: LayoutDashboard },
    { href: `/empresas/${empresaId}/cuentas`, label: 'Cuentas', icon: Banknote },
    { href: `/empresas/${empresaId}/transacciones`, label: 'Transacciones', icon: FileText },
    ...(isAdmin ? [{ href: `/empresas/${empresaId}/configuracion`, label: 'Configuración', icon: Settings }] : []),
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/empresas')} className="mb-4">
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
