
"use client";
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2, ArrowLeft } from 'lucide-react';
import { createBankAccount } from '@/lib/accountService';
import { useToast } from '@/hooks/use-toast';
import type { BankAccount } from '@/lib/types';

export default function NuevaCuentaPage() {
  const router = useRouter();
  const params = useParams();
  const empresaId = params.empresaId as string;

  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [currency, setCurrency] = useState('CLP');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim() || !currency.trim()) {
      toast({ title: "Error", description: "Todos los campos son obligatorios.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    
    const accountData: Omit<BankAccount, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'balance'> = {
      accountName,
      accountNumber,
      bankName,
      currency,
    };

    const result = await createBankAccount(empresaId, accountData);
    setIsLoading(false);

    if ('id' in result) {
      toast({ title: "Éxito", description: `Cuenta "${accountName}" creada.` });
      router.push(`/empresas/${empresaId}/cuentas`);
    } else {
      toast({ title: "Error al crear cuenta", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Cuentas
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Crear Nueva Cuenta Bancaria</CardTitle>
          <CardDescription>
            Ingresa los detalles de la cuenta bancaria para esta empresa.
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
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="bankName">Nombre del Banco</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ej: Banco Estado"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="accountNumber">Número de Cuenta</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Ej: 1234567890"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="currency">Moneda</Label>
              <Select value={currency} onValueChange={setCurrency} disabled={isLoading}>
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
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Crear Cuenta
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
