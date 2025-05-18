
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileSpreadsheet, UploadCloud, AlertTriangle, Loader2 } from "lucide-react";
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { useRouter } from "next/navigation";

export default function TransaccionesDashboardPage() {
  const { activeCompanyId, activeCompanyDetails, isLoadingActiveCompany } = useActiveCompany();
  const router = useRouter();

  if (isLoadingActiveCompany) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando...</p>
      </div>
    );
  }

  if (!activeCompanyId) {
     return (
      <Card className="text-center py-10 border-destructive">
        <CardHeader>
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <CardTitle className="text-xl text-destructive">No hay empresa activa</CardTitle>
          <CardDescription>Por favor, selecciona una empresa para ver sus transacciones.</CardDescription>
        </CardHeader>
        <CardContent>
             <Button onClick={() => router.push('/dashboard')}>Volver al Dashboard</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">
          Transacciones {activeCompanyDetails ? `de ${activeCompanyDetails.name}` : ''}
        </h2>
         <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/cuentas`}> 
                <UploadCloud className="mr-2 h-4 w-4" /> Importar Cartola
            </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <FileSpreadsheet className="h-8 w-8 text-primary mb-2" />
          <CardTitle>Listado de Transacciones</CardTitle>
          <CardDescription>
            Aquí se mostrarán todas las transacciones importadas de tus cartolas bancarias para {activeCompanyDetails?.name}.
            Actualmente, esta sección está en desarrollo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Próximamente podrás:</p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Ver un listado detallado de ingresos y egresos.</li>
            <li>Filtrar por fecha, cuenta, categoría y monto.</li>
            <li>Buscar transacciones específicas.</li>
            <li>Ver transacciones clasificadas automáticamente por IA.</li>
          </ul>
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
            <p className="font-semibold">Nota Importante:</p>
            <p>La funcionalidad de importación y procesamiento de archivos .xlsx, junto con la clasificación por IA, se implementará en las siguientes etapas.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
