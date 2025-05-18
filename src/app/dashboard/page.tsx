
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, UserCircle, ArrowRight, Building } from 'lucide-react';
import { useAuthContext } from '@/context/AuthProvider';
import Image from 'next/image';

export default function DashboardPage() {
  const { user } = useAuthContext();

  return (
    <div className="space-y-8">
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
                Estás en el panel de Control Mipyme. Desde aquí puedes gestionar tus empresas y tu perfil.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Utiliza el menú lateral para navegar por las diferentes secciones de la aplicación o los accesos directos a continuación.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" />
                Gestionar Empresas
              </CardTitle>
              <Building className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Crea nuevas empresas, administra miembros y configura cuentas bancarias.
            </p>
            <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/empresas">
                Ir a Mis Empresas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
             <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <UserCircle className="h-6 w-6 text-primary" />
                Ver Mi Perfil
              </CardTitle>
              <UserCircle className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Consulta y revisa la información de tu cuenta de usuario.
            </p>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/perfil">
                Ir a Mi Perfil <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
       <Card className="mt-8 bg-accent/10 border-accent/30">
        <CardHeader>
            <CardTitle>Próximas Funcionalidades</CardTitle>
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
