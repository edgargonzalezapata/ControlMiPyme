
"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react'; // Added useState and useEffect here
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, UserCircle, ArrowRight, Building, Banknote, FileText, Users, Settings, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/context/AuthProvider';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import Image from 'next/image';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { activeCompanyId, activeCompanyDetails, isLoadingActiveCompany } = useActiveCompany();
  const [isUserAdminOfActiveCompany, setIsUserAdminOfActiveCompany] = useState(false);

  useEffect(() => {
    if (activeCompanyDetails && user) {
      setIsUserAdminOfActiveCompany(activeCompanyDetails.members[user.uid] === 'admin');
    } else {
      setIsUserAdminOfActiveCompany(false);
    }
  }, [activeCompanyDetails, user]);

  if (isLoadingActiveCompany && activeCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Cargando datos de la empresa activa...</p>
      </div>
    );
  }

  const summaryCards = activeCompanyId && activeCompanyDetails ? [
    { title: "Cuentas Bancarias", description: "Gestiona tus cuentas", href: `/dashboard/cuentas`, icon: Banknote },
    { title: "Transacciones", description: "Importa y visualiza movimientos", href: `/dashboard/transacciones`, icon: FileText },
    ...(isUserAdminOfActiveCompany ? [{ title: "Configuración Empresa", description: "Administra empresa activa", href: `/dashboard/configuracion`, icon: Settings }] : [])
  ] : [];


  return (
    <div className="space-y-8">
      {!activeCompanyId && (
        <Card className="shadow-lg">
          <CardHeader className="bg-muted/20 p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Foto de perfil"
                  width={80}
                  height={80}
                  className="rounded-full border-4 border-primary shadow-md"
                  data-ai-hint="user avatar"
                />
              ) : (
                <div className="w-20 h-20 bg-primary text-primary-foreground flex items-center justify-center rounded-full border-4 border-primary/50 shadow-md text-3xl">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle size={40} />}
                </div>
              )}
              <div>
                <CardTitle className="text-3xl font-bold text-foreground">
                  ¡Bienvenido, {user?.displayName?.split(' ')[0] || 'Usuario'}!
                </CardTitle>
                <CardDescription className="text-md text-muted-foreground mt-1">
                  Selecciona una empresa desde el menú superior para comenzar o gestiona tus empresas.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
           <CardContent className="p-6">
            <p className="text-muted-foreground">
              Utiliza el selector de empresas en la barra de navegación para activar una empresa y ver su dashboard específico.
            </p>
            <Button asChild className="w-full sm:w-auto mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/dashboard/empresas">
                Gestionar Mis Empresas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {activeCompanyId && activeCompanyDetails && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Dashboard de {activeCompanyDetails.name}</CardTitle>
              <CardDescription>
                Resumen y accesos directos para <span className="font-semibold">{activeCompanyDetails.name}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Utiliza el menú de la izquierda para navegar o los accesos directos a continuación.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summaryCards.map(card => (
              <Card key={card.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{card.title}</CardTitle>
                  <card.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground pb-4">{card.description}</p>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href={card.href}>
                      Ir a {card.title} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Rápidas (Próximamente)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Aquí verás un resumen de ingresos, egresos y saldo del período actual para {activeCompanyDetails.name}.</p>
            </CardContent>
          </Card>
        </>
      )}
       <Card className="mt-8 bg-accent/10 border-accent/30">
        <CardHeader>
            <CardTitle>Próximas Funcionalidades Generales</CardTitle>
            <CardDescription>Estamos trabajando para traerte más herramientas útiles:</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Importación y procesamiento de cartolas bancarias (.xlsx).</li>
                <li>Clasificación automática de transacciones con IA.</li>
                <li>Visualización detallada de transacciones con filtros y búsqueda.</li>
                <li>Paneles de resumen financiero por empresa.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
