
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Banknote, PlusCircle, CreditCard, Landmark, Loader2, AlertTriangle } from 'lucide-react';
import type { BankAccount, Company } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { useAuthContext } from '@/context/AuthProvider';
import { collection, query, where, onSnapshot, Unsubscribe, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firestore';

export default function CuentasDashboardPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { activeCompanyId, activeCompanyDetails, isLoadingActiveCompany } = useActiveCompany();
  const router = useRouter();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    if (authLoading || isLoadingActiveCompany) {
      setIsLoadingAccounts(true);
      return;
    }

    if (!user) {
      router.push('/'); // Should be handled by DashboardLayout already
      return;
    }

    if (!activeCompanyId) {
      setIsLoadingAccounts(false);
      setAccounts([]);
      setError("Por favor, selecciona una empresa para ver sus cuentas.");
      return;
    }
    
    // Verify user is member of activeCompanyId (redundant if activeCompanyDetails is already loaded correctly by provider)
    if (activeCompanyDetails && (!activeCompanyDetails.members || !activeCompanyDetails.members[user.uid])) {
        setError("No tienes permiso para ver las cuentas de esta empresa.");
        setIsLoadingAccounts(false);
        setAccounts([]);
        return;
    }


    if (db) {
      setIsLoadingAccounts(true);
      setError(null);
      try {
        const q = query(collection(db, 'bankAccounts'), where('companyId', '==', activeCompanyId));
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedAccounts = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as BankAccount));
          setAccounts(fetchedAccounts);
          setIsLoadingAccounts(false);
        }, (err) => {
          console.error("Error fetching bank accounts with snapshot:", err);
          setError("No se pudieron cargar las cuentas bancarias.");
          setIsLoadingAccounts(false);
        });
      } catch (err) {
        console.error("Error setting up bank accounts snapshot:", err);
        setError("Error al preparar la consulta de cuentas.");
        setIsLoadingAccounts(false);
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, authLoading, activeCompanyId, activeCompanyDetails, isLoadingActiveCompany, router]);

  if (authLoading || isLoadingActiveCompany) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando datos...</p>
      </div>
    );
  }

  if (error) {
     return (
      <Card className="text-center py-10 border-destructive">
        <CardHeader>
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <CardTitle className="text-xl text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        {!activeCompanyId && (
            <CardContent>
                 <Button onClick={() => router.push('/dashboard/empresas')}>Gestionar Empresas</Button>
            </CardContent>
        )}
      </Card>
    );
  }
  
  if (isLoadingAccounts && activeCompanyId) {
     return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando cuentas bancarias...</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">
          Cuentas Bancarias {activeCompanyDetails ? `de ${activeCompanyDetails.name}` : ''}
        </h2>
        {activeCompanyId && (
          <Button asChild size="sm">
            <Link href={`/dashboard/cuentas/nueva`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Nueva Cuenta
            </Link>
          </Button>
        )}
      </div>

      {accounts.length === 0 ? (
        <Card className="text-center py-10">
          <CardHeader>
            <Landmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl">No hay cuentas bancarias</CardTitle>
            <CardDescription>
              Añade tu primera cuenta bancaria para esta empresa.
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
                  <Link href={`/dashboard/cuentas/${account.id}/importar`}>
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
