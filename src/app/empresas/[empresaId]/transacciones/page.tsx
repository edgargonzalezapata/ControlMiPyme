
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileSpreadsheet, UploadCloud } from "lucide-react";

interface EmpresaTransaccionesPageProps {
  params: { empresaId: string };
}

// This will be a server component for now, fetching data later
export default async function EmpresaTransaccionesPage({ params }: EmpresaTransaccionesPageProps) {
  const { empresaId } = params;
  // In the future, fetch transactions for this company
  // const transactions = await getTransactionsByCompany(empresaId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">Transacciones</h2>
        {/* TODO: Add button to import, linking to account selection or specific account import page */}
         <Button asChild size="sm" variant="outline">
            <Link href={`/empresas/${empresaId}/cuentas`}> {/* Temp link to accounts page */}
                <UploadCloud className="mr-2 h-4 w-4" /> Importar Cartola
            </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <FileSpreadsheet className="h-8 w-8 text-primary mb-2" />
          <CardTitle>Listado de Transacciones</CardTitle>
          <CardDescription>
            Aquí se mostrarán todas las transacciones importadas de tus cartolas bancarias.
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
