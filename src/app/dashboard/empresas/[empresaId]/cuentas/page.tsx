
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Banknote, PlusCircle, CreditCard, Landmark } from 'lucide-react';
import { getBankAccountsByCompany } from '@/lib/accountService';
import type { BankAccount } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

interface EmpresaCuentasDashboardPageProps {
  params: { empresaId: string };
}

export default async function EmpresaCuentasDashboardPage({ params }: EmpresaCuentasDashboardPageProps) {
  const { empresaId } = params;
  const accounts = await getBankAccountsByCompany(empresaId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">Cuentas Bancarias</h2>
        <Button asChild size="sm">
          {/* Ruta actualizada */}
          <Link href={`/dashboard/empresas/${empresaId}/cuentas/nueva`}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nueva Cuenta
          </Link>
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="text-center py-10">
          <CardHeader>
            <Landmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl">No hay cuentas bancarias</CardTitle>
            <CardDescription>
              Añade tu primera cuenta bancaria para empezar a registrar transacciones.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account: BankAccount) => (
            <Card key={account.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        {account.accountName}
                    </CardTitle>
                </div>
                <CardDescription>{account.bankName} - {account.accountNumber} ({account.currency})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: account.currency }).format(account.balance)}
                </div>
                <p className="text-xs text-muted-foreground">Saldo actual (calculado)</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Creada: {account.createdAt ? format(account.createdAt.toDate(), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                </p>
                <Button asChild variant="outline" size="sm">
                   {/* Ruta actualizada */}
                  <Link href={`/dashboard/empresas/${empresaId}/cuentas/${account.id}/importar`}>
                    Importar Cartola
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
