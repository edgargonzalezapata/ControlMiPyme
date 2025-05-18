
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, FileText, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getCompanyById, canUserManageCompany } from '@/lib/companyService';
import { auth } from "@/lib/firebase"; // For getting current user ID server-side if needed
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

interface EmpresaDashboardPageProps {
  params: { empresaId: string };
}

export default async function EmpresaDashboardPage({ params }: EmpresaDashboardPageProps) {
  const { empresaId } = params;
  const company = await getCompanyById(empresaId);
  
  // Basic check, layout handles detailed auth
  if (!company) {
    return <p>Empresa no encontrada.</p>;
  }

  // Determine if the current user is an admin for this company
  // This is a simplified check here, layout has more robust auth.
  const currentUser = auth?.currentUser;
  const isAdmin = currentUser ? await canUserManageCompany(empresaId, currentUser.uid) : false;

  const summaryCards = [
    { title: "Cuentas Bancarias", description: "Gestiona tus cuentas", href: `/empresas/${empresaId}/cuentas`, icon: Banknote },
    { title: "Transacciones", description: "Importa y visualiza movimientos", href: `/empresas/${empresaId}/transacciones`, icon: FileText },
    ...(isAdmin ? [{ title: "Configuración", description: "Administra miembros y empresa", href: `/empresas/${empresaId}/configuracion`, icon: Users }] : [])
  ];


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bienvenido al Panel de {company.name}</CardTitle>
          <CardDescription>
            Desde aquí puedes acceder a las diferentes secciones para administrar las finanzas de tu empresa.
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
       {/* Placeholder for quick stats - will be dynamic later */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas Rápidas (Próximamente)</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Aquí verás un resumen de ingresos, egresos y saldo del período actual.</p>
        </CardContent>
      </Card>
    </div>
  );
}
