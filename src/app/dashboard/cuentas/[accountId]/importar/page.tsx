
"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UploadCloud, Loader2, FileCheck2, FileWarning, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBankAccountById } from '@/lib/accountService'; 
import type { BankAccount } from '@/lib/types';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';

export default function ImportarCartolaDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.accountId as string; // accountId is from URL
  const { activeCompanyId, activeCompanyDetails } = useActiveCompany();

  const [account, setAccount] = useState<BankAccount | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (accountId && activeCompanyId) { // Ensure activeCompanyId is available
      const fetchAccount = async () => {
        setIsAccountLoading(true);
        const fetchedAccount = await getBankAccountById(accountId); // This service needs to verify activeCompanyId matches account.companyId
        if (fetchedAccount && fetchedAccount.companyId === activeCompanyId) {
            setAccount(fetchedAccount);
        } else {
            toast({ title: "Error", description: "Cuenta no encontrada, no pertenece a la empresa activa o acceso no autorizado.", variant: "destructive" });
            router.push(`/dashboard/cuentas`);
        }
        setIsAccountLoading(false);
      };
      fetchAccount();
    } else if (!activeCompanyId && !isLoading) {
        setIsAccountLoading(false);
    }
  }, [accountId, activeCompanyId, router, toast, isLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        toast({ title: "Archivo no válido", description: "Por favor, selecciona un archivo .xlsx.", variant: "destructive" });
        setFile(null);
        event.target.value = ""; 
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Error", description: "Por favor, selecciona un archivo .xlsx.", variant: "destructive" });
      return;
    }
    if (!account || !activeCompanyId) {
      toast({ title: "Error", description: "No se ha podido cargar la información de la cuenta o empresa.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    const result = { success: true, message: `Cartola "${file.name}" procesada (simulado).` }; 

    setIsLoading(false);

    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      router.push(`/dashboard/cuentas`); 
    } else {
      toast({ title: "Error al procesar cartola", description: "Función no implementada.", variant: "destructive" });
    }
  };
  
  if (!activeCompanyId && !isAccountLoading) {
    return (
      <div className="max-w-2xl mx-auto">
         <Card className="text-center py-10 border-destructive">
            <CardHeader>
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <CardTitle className="text-xl text-destructive">No hay empresa activa</CardTitle>
                <CardDescription>Por favor, selecciona una empresa para importar cartolas.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button onClick={() => router.push('/dashboard')}>Volver al Dashboard</Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (isAccountLoading) {
    return (
      <div className="flex min-h-[calc(100vh-15rem)] flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando datos de la cuenta...</p>
      </div>
    );
  }

  if (!account) {
    return (
       <div className="max-w-lg mx-auto text-center py-10">
        <h1 className="text-xl font-semibold text-destructive">Cuenta no encontrada</h1>
        <Button onClick={() => router.push(`/dashboard/cuentas`)} className="mt-4">Volver a Cuentas</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Cuentas
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Importar Cartola Bancaria</CardTitle>
          <CardDescription>
            Sube tu archivo de cartola en formato .xlsx para la cuenta: <span className="font-semibold">{account?.accountName} ({account?.accountNumber})</span> de la empresa {activeCompanyDetails?.name}.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cartolaFile">Archivo .xlsx</Label>
              <Input
                id="cartolaFile"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={isLoading}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {file && (
                <p className="text-sm text-muted-foreground flex items-center mt-2">
                  <FileCheck2 className="h-4 w-4 mr-2 text-green-600" /> Archivo seleccionado: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
              <p className="font-semibold">Instrucciones:</p>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Asegúrate que el archivo esté en formato .xlsx.</li>
                <li>Las columnas esperadas son: Fecha, Descripción, Monto (o Ingreso/Egreso).</li>
                <li>El sistema intentará clasificar las transacciones automáticamente.</li>
              </ul>
            </div>
             <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
                <FileWarning className="inline h-4 w-4 mr-1" />
                <strong>Nota:</strong> El procesamiento real del archivo y la clasificación con IA se implementarán en futuras etapas. Esta es una simulación de la subida.
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !file} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Subir y Procesar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
