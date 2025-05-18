
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Briefcase, PlusCircle } from 'lucide-react';
import { getUserCompanies } from '@/lib/companyService';
import type { Company } from '@/lib/types';
import CreateCompanyForm from './_components/CreateCompanyForm'; // Ruta relativa ahora dentro de dashboard/empresas

export const dynamic = 'force-dynamic'; 

export default async function EmpresasDashboardPage() {
  const companies = await getUserCompanies();

  return (
    <div className="container mx-auto"> {/* El padding general lo da el DashboardLayout */}
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
                  {company.ownerUid === auth?.currentUser?.uid ? "Propietario" : `Miembro (${company.members[auth?.currentUser?.uid || ''] || 'viewer'})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Haz clic para ver detalles y gestionar cuentas.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  {/* Enlace actualizado a la nueva ruta anidada */}
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

import { auth } from '@/lib/firebase';
