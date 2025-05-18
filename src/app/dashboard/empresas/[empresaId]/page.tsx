
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Importado useParams
import Link from "next/link";
import { useAuthContext } from '@/context/AuthProvider'; // Para obtener el usuario
import { doc, getDoc } from 'firebase/firestore'; // Para acceder a Firestore
import { db } from '@/lib/firestore'; // Instancia de Firestore
import type { Company } from '@/lib/types'; // Tipos
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, FileText, Users, ArrowRight, Loader2 } from "lucide-react";

// No más 'export const dynamic = 'force-dynamic';' ni props de servidor como { params }
// La función principal ya no es async
export default function EmpresaDashboardDetailPage() {
  const router = useRouter();
  const params = useParams(); // Hook para obtener parámetros de ruta
  const { user, loading: authLoading, isFirebaseReady } = useAuthContext();

  const [company, setCompany] = useState<Company | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoadingPage, setIsLoadingPage] = useState(true); // Estado de carga para esta página

  const empresaId = params?.empresaId as string;

  useEffect(() => {
    if (!isFirebaseReady || authLoading) return; // Esperar a que Firebase y la autenticación estén listos

    if (!user) { // Si no hay usuario, no debería estar aquí (layout principal debería redirigir)
      router.push('/');
      return;
    }

    if (empresaId && user.uid) {
      const fetchCompanyDetails = async () => {
        setIsLoadingPage(true);
        if (!db) {
          console.error("Firestore DB no disponible en página de detalle.");
          setCompany(null);
          setIsLoadingPage(false);
          return;
        }
        try {
          const companyDocRef = doc(db, 'companies', empresaId);
          const companySnap = await getDoc(companyDocRef);

          if (companySnap.exists()) {
            const fetchedCompany = { id: companySnap.id, ...companySnap.data() } as Company;
            // Verificar si el usuario es miembro (necesario para ver la página)
            if (fetchedCompany.members && fetchedCompany.members[user.uid]) {
              setCompany(fetchedCompany);
              setIsAdmin(fetchedCompany.members[user.uid] === 'admin');
            } else {
              // No es miembro, redirigir o mostrar error (layout ya lo maneja)
              setCompany(null); // Asegurar que no se muestre contenido
            }
          } else {
            setCompany(null); // Empresa no encontrada
          }
        } catch (error) {
          console.error("Error fetching company details for page:", error);
          setCompany(null);
        } finally {
          setIsLoadingPage(false);
        }
      };
      fetchCompanyDetails();
    } else if (!empresaId && isFirebaseReady && !authLoading && user) {
        setIsLoadingPage(true); // Esperando empresaId
    }

  }, [empresaId, user, authLoading, router, isFirebaseReady]);

  if (isLoadingPage || authLoading || !isFirebaseReady) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Cargando detalles de la empresa...</p>
      </div>
    );
  }

  if (!company) {
    // El layout ya debería haber manejado la redirección si no hay empresa o no está autorizado.
    // Esto es un fallback.
    return (
      <Card>
        <CardHeader>
          <CardTitle>Empresa no encontrada o Acceso Denegado</CardTitle>
          <CardDescription>No se pudo cargar la información de la empresa.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={() => router.push('/dashboard/empresas')}>Volver a Mis Empresas</Button>
        </CardContent>
      </Card>
    );
  }

  const summaryCards = [
    { title: "Cuentas Bancarias", description: "Gestiona tus cuentas", href: `/dashboard/empresas/${empresaId}/cuentas`, icon: Banknote },
    { title: "Transacciones", description: "Importa y visualiza movimientos", href: `/dashboard/empresas/${empresaId}/transacciones`, icon: FileText },
    ...(isAdmin ? [{ title: "Configuración", description: "Administra miembros y empresa", href: `/dashboard/empresas/${empresaId}/configuracion`, icon: Users }] : [])
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
