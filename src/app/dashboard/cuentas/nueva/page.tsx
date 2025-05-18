
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BankAccount } from '@/lib/types';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { useAuthContext } from '@/context/AuthProvider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firestore';

export default function NuevaCuentaDashboardPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { activeCompanyId, activeCompanyDetails, isLoadingActiveCompany } = useActiveCompany();

  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [currency, setCurrency] = useState('CLP');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoadingActiveCompany) {
      toast({ title: "Cargando", description: "Espere a que los detalles de la empresa activa se carguen.", variant: "default" });
      return;
    }

    if (!user || !activeCompanyId || !activeCompanyDetails) {
      toast({ title: "Error", description: "Información de usuario o empresa activa no disponible. Seleccione una empresa.", variant: "destructive" });
      return;
    }

    if (activeCompanyDetails.members[user.uid] !== 'admin') {
      toast({ title: "No autorizado", description: "Solo los administradores pueden crear cuentas bancarias para esta empresa.", variant: "destructive" });
      return;
    }

    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim() || !currency.trim()) {
      toast({ title: "Error", description: "Todos los campos son obligatorios.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    
    const accountDataToCreate: Omit<BankAccount, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'balance'> = {
      accountName,
      accountNumber,
      bankName,
      currency,
    };
    
    const newAccountData: Omit<BankAccount, 'id'> = {
        ...accountDataToCreate,
        companyId: activeCompanyId,
        balance: 0,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
    };

    try {
        if (!db) {
            throw new Error("Conexión a la base de datos no disponible.");
        }
        const docRef = await addDoc(collection(db, 'bankAccounts'), newAccountData);
        toast({ title: "Éxito", description: `Cuenta "${accountName}" creada.` });
        router.push(`/dashboard/cuentas`);
    } catch (error: any) {
        console.error("Error creating bank account on client:", error);
        toast({ title: "Error al crear cuenta", description: error.message || "No se pudo crear la cuenta bancaria en el cliente.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  if (!activeCompanyId && !isLoadingActiveCompany) {
    return (
      <div className="max-w-2xl mx-auto">
         <Card className="text-center py-10 border-destructive">
            <CardHeader>
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <CardTitle className="text-xl text-destructive">No hay empresa activa</CardTitle>
                <CardDescription>Por favor, selecciona una empresa para agregarle una cuenta.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button onClick={() => router.push('/dashboard')}>Volver al Dashboard</Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoadingActiveCompany || (activeCompanyId && !activeCompanyDetails)) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando datos de la empresa activa...</p>
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
          <CardTitle>Crear Nueva Cuenta Bancaria</CardTitle>
          <CardDescription>
            Ingresa los detalles de la cuenta bancaria para la empresa: <span className="font-semibold">{activeCompanyDetails?.name || activeCompanyId}</span>.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="accountName">Nombre de la Cuenta</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Ej: Cuenta Corriente Principal"
                disabled={isLoading || isLoadingActiveCompany}
              />
            </div>
            <div>
              <Label htmlFor="bankName">Nombre del Banco</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ej: Banco Estado"
                disabled={isLoading || isLoadingActiveCompany}
              />
            </div>
            <div>
              <Label htmlFor="accountNumber">Número de Cuenta</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Ej: 1234567890"
                disabled={isLoading || isLoadingActiveCompany}
              />
            </div>
            <div>
              <Label htmlFor="currency">Moneda</Label>
              <Select value={currency} onValueChange={setCurrency} disabled={isLoading || isLoadingActiveCompany}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Selecciona moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                  <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/cuentas')} disabled={isLoading || isLoadingActiveCompany}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || isLoadingActiveCompany || !activeCompanyDetails} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Crear Cuenta
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
