'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, FileUp } from 'lucide-react';

export default function ImportarFacturasPage() {
  const router = useRouter();

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold ml-4">Importar Facturas</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-blue-500" />
                Facturas Emitidas
              </CardTitle>
              <CardDescription>
                Importa facturas emitidas por tu empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Utiliza esta opción para importar facturas que has emitido a tus clientes. 
                Estas facturas aparecerán en la sección "Facturas Emitidas".
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => router.push('/dashboard/facturacion/importar/emitidas')}
              >
                Importar Facturas Emitidas
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Facturas Recibidas
              </CardTitle>
              <CardDescription>
                Importa facturas recibidas de tus proveedores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Utiliza esta opción para importar facturas que has recibido de tus proveedores. 
                Estas facturas aparecerán en la sección "Facturas Recibidas".
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => router.push('/dashboard/facturacion/importar/recibidas')}
              >
                Importar Facturas Recibidas
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
