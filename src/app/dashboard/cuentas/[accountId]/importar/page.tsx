
"use client";
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UploadCloud, Loader2, FileCheck2, FileWarning, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BankAccount, Transaction } from '@/lib/types'; // Asegúrate que Transaction esté definido
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { useAuthContext } from '@/context/AuthProvider';
import { processBankStatement, type ParsedTransaction } from '@/lib/transactionService';
import { doc, getDoc, writeBatch, collection, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firestore';

export default function ImportarCartolaDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.accountId as string;
  const { activeCompanyId, activeCompanyDetails, isLoadingActiveCompany, refreshActiveCompanyDetails } = useActiveCompany();
  const { user, loading: authLoading } = useAuthContext();

  const [account, setAccount] = useState<BankAccount | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchAccountDetails = useCallback(async () => {
    if (!accountId || !activeCompanyId || !db) {
      setIsAccountLoading(false);
      return;
    }
    setIsAccountLoading(true);
    try {
      const accountDocRef = doc(db, 'bankAccounts', accountId);
      const accountSnap = await getDoc(accountDocRef);
      if (accountSnap.exists()) {
        const fetchedAccount = { id: accountSnap.id, ...accountSnap.data() } as BankAccount;
        if (fetchedAccount.companyId === activeCompanyId) {
          setAccount(fetchedAccount);
        } else {
          toast({ title: "Error de Acceso", description: "Esta cuenta no pertenece a la empresa activa.", variant: "destructive" });
          router.push(`/dashboard/cuentas`);
          setAccount(null);
        }
      } else {
        toast({ title: "Error", description: "Cuenta bancaria no encontrada.", variant: "destructive" });
        router.push(`/dashboard/cuentas`);
        setAccount(null);
      }
    } catch (error) {
      console.error("Error fetching bank account details:", error);
      toast({ title: "Error", description: "No se pudo cargar la información de la cuenta.", variant: "destructive" });
      setAccount(null);
    } finally {
      setIsAccountLoading(false);
    }
  }, [accountId, activeCompanyId, router, toast]);

  useEffect(() => {
    if (activeCompanyId && accountId && !authLoading) { // Ensure user context is also ready
      fetchAccountDetails();
    } else if (!activeCompanyId && !isLoadingActiveCompany && !authLoading) {
        setIsAccountLoading(false); // If no active company, stop loading
    }
  }, [accountId, activeCompanyId, fetchAccountDetails, isLoadingActiveCompany, authLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadWarnings([]); // Clear previous warnings
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && selectedFile.type !== 'application/vnd.ms-excel.sheet.macroEnabled.12') {
        toast({ title: "Archivo no válido", description: "Por favor, selecciona un archivo .xlsx o .xlsm.", variant: "destructive" });
        setFile(null);
        if (event.target) event.target.value = "";
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadWarnings([]);
    if (!file) {
      toast({ title: "Error", description: "Por favor, selecciona un archivo .xlsx o .xlsm.", variant: "destructive" });
      return;
    }
    if (!account || !activeCompanyId || !user?.uid || !db) {
      toast({ title: "Error", description: "No se ha podido cargar la información requerida (empresa activa, cuenta o usuario).", variant: "destructive" });
      return;
    }

    // Verificar si el usuario es admin (necesario para la regla de creación de transacciones)
    if (!activeCompanyDetails || activeCompanyDetails.members[user.uid] !== 'admin') {
        toast({ title: "No Autorizado", description: "Solo los administradores de la empresa pueden importar transacciones.", variant: "destructive" });
        return;
    }

    setIsLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await processBankStatement(arrayBuffer, file.name);

      if (result.warnings && result.warnings.length > 0) {
        setUploadWarnings(result.warnings);
      }

      if (result.error || !result.data || result.data.length === 0) {
        toast({ title: "Error al Procesar Archivo", description: result.error || "No se pudieron extraer transacciones válidas del archivo.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const parsedTransactions = result.data;
      const batch = writeBatch(db);
      const transactionsCollectionRef = collection(db, 'transactions');

      parsedTransactions.forEach((parsedTx) => {
        const transactionDocRef = doc(transactionsCollectionRef); // Auto-generate ID
        const transactionDataToSave: Omit<Transaction, 'id'> = {
          companyId: activeCompanyId,
          accountId: accountId,
          date: Timestamp.fromDate(new Date(parsedTx.date)), // Date is already ISO string from service
          description: parsedTx.description,
          amount: parsedTx.amount,
          type: parsedTx.type,
          originalFileName: file.name,
          importedAt: serverTimestamp() as Timestamp,
          // category and notes can be added later
        };
        batch.set(transactionDocRef, transactionDataToSave);
      });

      await batch.commit();
      toast({ title: "Éxito", description: `${parsedTransactions.length} transacciones importadas de "${file.name}". ${result.warnings && result.warnings.length > 0 ? `${result.warnings.length} advertencias.` : ''}` });
      
      // Actualizar el saldo de la cuenta (opcional, pero bueno para mantener consistencia)
      // Esta es una operación de lectura y luego escritura, podría ser una Cloud Function para mayor robustez.
      let newBalance = account.balance;
      parsedTransactions.forEach(tx => newBalance += tx.amount);
      const accountDocRef = doc(db, 'bankAccounts', accountId);
      await updateDoc(accountDocRef, { balance: newBalance, updatedAt: serverTimestamp() });
      refreshActiveCompanyDetails(); // To refresh details in context if they include balances linked to accounts

      router.push(`/dashboard/transacciones?accountId=${accountId}`); // Navegar a la vista de transacciones

    } catch (error: any) {
      console.error("Error durante la importación o guardado:", error);
      toast({ title: "Error Crítico en Importación", description: error.message || "Ocurrió un error inesperado al guardar las transacciones.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading || isLoadingActiveCompany || isAccountLoading) {
    return (
      <div className="flex min-h-[calc(100vh-15rem)] flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  if (!activeCompanyId) {
    return (
      <div className="max-w-2xl mx-auto">
         <Card className="text-center py-10 border-destructive">
            <CardHeader> <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /> <CardTitle className="text-xl text-destructive">No hay empresa activa</CardTitle> <CardDescription>Por favor, selecciona una empresa para importar cartolas.</CardDescription> </CardHeader>
            <CardContent> <Button onClick={() => router.push('/dashboard')}>Volver al Dashboard</Button> </CardContent>
        </Card>
      </div>
    );
  }

  if (!account) {
    return (
       <div className="max-w-lg mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-semibold text-destructive">Cuenta no encontrada o no accesible</h1>
        <CardDescription className="mt-2 mb-4">La cuenta no existe o no pertenece a la empresa activa.</CardDescription>
        <Button onClick={() => router.push(`/dashboard/cuentas`)} className="mt-4">Volver a Cuentas</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/cuentas')} className="mb-4">
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
              <Label htmlFor="cartolaFile">Archivo .xlsx o .xlsm</Label>
              <Input
                id="cartolaFile"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsm,application/vnd.ms-excel.sheet.macroEnabled.12"
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
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Asegúrate que el archivo esté en formato .xlsx o .xlsm.</li>
                <li>Columnas esperadas (los nombres pueden variar ligeramente): Fecha, Descripción, y columnas para Cargos y/o Abonos.</li>
                <li>El sistema intentará identificar las columnas automáticamente.</li>
                <li>Las fechas deben estar en un formato reconocible por Excel/Javascript.</li>
                <li>Los montos deben ser numéricos (ej: 1234.50 o 1234,50).</li>
              </ul>
            </div>
            {uploadWarnings.length > 0 && (
                 <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-md text-yellow-700 text-sm space-y-1">
                    <div className="flex items-center font-semibold">
                        <Info className="h-5 w-5 mr-2"/> Advertencias durante la importación:
                    </div>
                    <ul className="list-disc list-inside ml-4">
                        {uploadWarnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                        ))}
                    </ul>
                </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/cuentas')} disabled={isLoading}>Cancelar</Button>
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

// Necesitas la importación de updateDoc para actualizar el saldo
import { updateDoc } from 'firebase/firestore';
