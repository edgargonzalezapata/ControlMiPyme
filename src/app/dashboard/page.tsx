"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Briefcase, UserCircle, ArrowRight, Building, Loader2, ArrowRightCircle, 
  BarChart2, Wallet, CreditCard, TrendingUp, TrendingDown, DollarSign, Settings, PlusCircle, CircleAlert, LayoutDashboard, Upload, ShieldCheck
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthProvider';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import Image from 'next/image';
import { collection, query, where, onSnapshot, Unsubscribe, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import type { Transaction, Company, BankAccount } from '@/lib/types';
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Helper function to get the start of the current month
const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Helper function to format date to YYYY-MM-DD for input[type="date"]
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { activeCompanyId, activeCompanyDetails, isLoadingActiveCompany } = useActiveCompany();
  const router = useRouter();
  const [isUserAdminOfActiveCompany, setIsUserAdminOfActiveCompany] = useState(false);

  // Date filter state
  const [startDate, setStartDate] = useState<Date>(getStartOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  const [isLoadingFinancials, setIsLoadingFinancials] = useState(true);
  const [financialError, setFinancialError] = useState<string | null>(null);
  
  // New state for bank accounts and transactions
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [totalBankBalance, setTotalBankBalance] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  useEffect(() => {
    if (activeCompanyDetails && user) {
      setIsUserAdminOfActiveCompany(activeCompanyDetails.members[user.uid] === 'admin');
    } else {
      setIsUserAdminOfActiveCompany(false);
    }
  }, [activeCompanyDetails, user]);

  // Load bank accounts
  useEffect(() => {
    if (!activeCompanyId || !db) {
      setBankAccounts([]);
      setTotalBankBalance(0);
      setIsLoadingAccounts(false);
      return;
    }

    setIsLoadingAccounts(true);
    
    const accountsQuery = query(
      collection(db as any, "bankAccounts"),
      where("companyId", "==", activeCompanyId)
    );
    
    const unsubscribe = onSnapshot(accountsQuery, (snapshot) => {
      const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
      setBankAccounts(accounts);
      
      // Calculate total balance across all accounts
      const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
      setTotalBankBalance(totalBalance);
      setIsLoadingAccounts(false);
    }, (error) => {
      console.error("Error fetching bank accounts:", error);
      setIsLoadingAccounts(false);
    });
    
    return () => unsubscribe();
  }, [activeCompanyId]);

  // Load transaction count
  useEffect(() => {
    if (!activeCompanyId || !db) {
      setTransactionCount(0);
      return;
    }
    
    const fetchTransactionCount = async () => {
      try {
        let transactionsQuery = query(
          collection(db as any, "transactions"),
          where("companyId", "==", activeCompanyId)
        );

        // Apply date filter if dates are valid
        if (startDate && endDate && startDate <= endDate) {
          transactionsQuery = query(
            transactionsQuery,
            where("date", ">=", startDate),
            where("date", "<=", endDate)
          );
        }
        
        const snapshot = await getDocs(transactionsQuery);
        setTransactionCount(snapshot.size);
      } catch (error) {
        console.error("Error counting transactions:", error);
      }
    };
    
    fetchTransactionCount();
  }, [activeCompanyId, startDate, endDate]);

  useEffect(() => {
    if (!activeCompanyId || !db) {
      setIsLoadingFinancials(false);
      setTotalIncome(0);
      setTotalExpenses(0);
      setBalance(0);
      if (activeCompanyId) {
        setFinancialError("No se pudieron cargar las finanzas, base de datos no disponible.");
      }
      return;
    }

    setIsLoadingFinancials(true);
    setFinancialError(null);

    let transactionsQueryOuter = query(
      collection(db as any, "transactions"),
      where("companyId", "==", activeCompanyId)
    );

    // Apply date filter if dates are valid
    if (startDate && endDate && startDate <= endDate) {
      transactionsQueryOuter = query(
        transactionsQueryOuter,
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      );
    }

    const unsubscribe = onSnapshot(transactionsQueryOuter, (snapshot) => {
      let income = 0;
      let expenses = 0;
      snapshot.forEach((doc) => {
        const transaction = doc.data() as Transaction;
        if (transaction.type === 'ingreso') {
          income += transaction.amount;
        } else if (transaction.type === 'egreso') {
          expenses += transaction.amount;
        }
      });
      setTotalIncome(income);
      setTotalExpenses(expenses);
      setBalance(income - expenses);
      setIsLoadingFinancials(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setFinancialError("Error al cargar las transacciones.");
      setIsLoadingFinancials(false);
    });

    return () => unsubscribe();
  }, [activeCompanyId, startDate, endDate]);

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: activeCompanyDetails?.currency || 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoadingActiveCompany && activeCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-10">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-indigo-600/30 dark:bg-indigo-500/40 blur-md animate-pulse"></div>
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400 relative z-10" />
        </div>
        <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-200">Cargando datos de la empresa activa...</p>
      </div>
    );
  }

  const summaryCards = activeCompanyId && activeCompanyDetails ? [
    { title: "Cuentas Bancarias", description: "Gestiona tus cuentas bancarias y saldos", href: `/dashboard/cuentas`, icon: CreditCard, color: "from-blue-400 to-cyan-500" },
    { title: "Transacciones", description: "Importa y visualiza todos tus movimientos", href: `/dashboard/transacciones`, icon: Wallet, color: "from-emerald-400 to-teal-500" },
    ...(isUserAdminOfActiveCompany ? [{ title: "Configuración Empresa", description: "Administra y configura tu empresa", href: `/dashboard/configuracion`, icon: Settings, color: "from-amber-400 to-orange-500" }] : [])
  ] : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel Principal</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {activeCompanyDetails 
              ? `Bienvenido a ${activeCompanyDetails.name}`
              : 'Bienvenido a tu panel de control'
            }
          </p>
        </div>
        {/* Date Filter Inputs */}
        {activeCompanyId && (
          <div className="flex flex-col xs:flex-row gap-2 items-start xs:items-center">
            <div className="flex items-center gap-2 w-full xs:w-auto">
              <label htmlFor="startDate" className="text-sm font-medium whitespace-nowrap">Desde:</label>
              <input 
                type="date" 
                id="startDate"
                name="startDate"
                value={formatDateForInput(startDate)}
                onChange={(e) => setStartDate(new Date(e.target.value + 'T00:00:00'))} // Ensure time is start of day
                className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 flex-1 xs:flex-none input-responsive"
              />
            </div>
            <div className="flex items-center gap-2 w-full xs:w-auto">
              <label htmlFor="endDate" className="text-sm font-medium whitespace-nowrap">Hasta:</label>
              <input 
                type="date" 
                id="endDate"
                name="endDate"
                value={formatDateForInput(endDate)}
                onChange={(e) => setEndDate(new Date(e.target.value + 'T23:59:59'))} // Ensure time is end of day
                className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 flex-1 xs:flex-none input-responsive"
              />
            </div>
          </div>
        )}
        {!activeCompanyId ? (
          <Button
            onClick={() => router.push('/dashboard/empresas')}
            className="w-full sm:w-auto btn-responsive"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> 
            Crear Empresa
          </Button>
        ) : (
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/empresas')}
              className="btn-responsive"
            >
              <Building className="mr-2 h-4 w-4" /> 
              <span className="hidden xs:inline">Gestionar </span>Empresas
            </Button>
            <Button
              onClick={() => router.push('/dashboard/cuentas/nueva')}
              className="btn-responsive"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> 
              Nueva Cuenta
            </Button>
          </div>
        )}
      </div>
      
      {!activeCompanyId && (
        <Card className="bg-gradient-to-r from-muted/70 to-muted border shadow-md animate-fade-in card-responsive">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white shadow-md">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">Comencemos</CardTitle>
                <CardDescription className="text-sm sm:text-base">Para usar todas las funciones, primero crea o selecciona una empresa.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button 
              className="w-full h-auto py-4 sm:py-6 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 touch-target"
              onClick={() => router.push('/dashboard/empresas')}
            >
              <Building className="h-8 w-8 sm:h-10 sm:w-10 mb-2" />
              <div className="text-center">
                <p className="font-bold text-base sm:text-lg">Crear Empresa</p>
                <p className="text-xs sm:text-sm font-normal text-indigo-100">Configura tu primera empresa para comenzar</p>
              </div>
            </Button>
            <div className="w-full h-auto p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg border border-amber-200 dark:border-amber-800/50 flex flex-col items-center justify-center gap-2 text-center">
              <CircleAlert className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
              <p className="font-semibold text-base sm:text-lg text-amber-800 dark:text-amber-300">¿Ya tienes una empresa?</p>
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">Usa el selector de empresas en la barra de navegación superior para cambiar entre tus empresas</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeCompanyId && activeCompanyDetails && (
        <div className="space-y-4 animate-fade-in">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                <LayoutDashboard className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">General</span>
                <span className="xs:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-xs sm:text-sm">
                <BarChart2 className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Informes</span>
                <span className="xs:hidden">Rep.</span>
              </TabsTrigger>
              <TabsTrigger value="actions" className="text-xs sm:text-sm">
                <Upload className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Acciones</span>
                <span className="xs:hidden">Acc.</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="responsive-grid">
                <Card className="shadow-sm hover:shadow-md transition-shadow card-responsive mobile-optimized">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm sm:text-md font-medium flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      Cuentas Bancarias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      {isLoadingAccounts ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          {bankAccounts.length}
                          <span className="text-sm sm:text-base font-medium text-muted-foreground">
                            ({formatCurrency(totalBankBalance)})
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {bankAccounts.length > 0 
                        ? `Saldo total en ${bankAccounts.length} ${bankAccounts.length === 1 ? 'cuenta' : 'cuentas'}`
                        : "Configure sus cuentas para comenzar a hacer seguimiento financiero"
                      }
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" className="w-full justify-between touch-target" asChild>
                      <Link href="/dashboard/cuentas">
                        Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="shadow-sm hover:shadow-md transition-shadow card-responsive mobile-optimized">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm sm:text-md font-medium flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-primary" />
                      Transacciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      {isLoadingFinancials ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          {transactionCount}
                          {transactionCount > 0 && (
                            <span className="text-sm sm:text-base font-medium text-muted-foreground">
                              ({formatCurrency(balance)})
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {transactionCount > 0
                        ? `Balance de ${transactionCount} ${transactionCount === 1 ? 'transacción' : 'transacciones'}`
                        : "Importe transacciones desde sus cartolas bancarias"
                      }
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" className="w-full justify-between touch-target" asChild>
                      <Link href="/dashboard/transacciones">
                        Administrar <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="shadow-sm hover:shadow-md transition-shadow card-responsive mobile-optimized">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm sm:text-md font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Empresa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold truncate">
                      {activeCompanyDetails.name}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeCompanyDetails.ownerUid ? `ID: ${activeCompanyDetails.ownerUid.substring(0,8)}...` : "Configure su información empresarial"}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" className="w-full justify-between touch-target" asChild>
                      <Link href="/dashboard/configuracion">
                        Configuración <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card className="md:col-span-2 lg:col-span-3 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen Financiero</CardTitle>
                    <CardDescription>Panel informativo con balance y movimientos recientes.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bankAccounts.length > 0 && transactionCount > 0 ? (
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg p-4 flex flex-col items-center">
                          <TrendingUp className="h-6 w-6 text-green-500 mb-2" />
                          <p className="text-sm text-green-700 dark:text-green-400">Ingresos</p>
                          <p className="text-xl font-bold text-green-800 dark:text-green-300">{formatCurrency(totalIncome)}</p>
                        </div>
                        
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-4 flex flex-col items-center">
                          <TrendingDown className="h-6 w-6 text-red-500 mb-2" />
                          <p className="text-sm text-red-700 dark:text-red-400">Gastos</p>
                          <p className="text-xl font-bold text-red-800 dark:text-red-300">{formatCurrency(totalExpenses)}</p>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4 flex flex-col items-center">
                          <DollarSign className="h-6 w-6 text-blue-500 mb-2" />
                          <p className="text-sm text-blue-700 dark:text-blue-400">Balance</p>
                          <p className={`text-xl font-bold ${balance >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-red-800 dark:text-red-300'}`}>
                            {formatCurrency(balance)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 border border-dashed border-muted rounded-lg flex flex-col items-center justify-center">
                        <BarChart2 className="h-12 w-12 text-muted-foreground opacity-50" />
                        <p className="mt-2 text-sm text-muted-foreground text-center">
                          Los gráficos y reportes estarán disponibles cuando importe sus transacciones.
                        </p>
                        <Button className="mt-4" asChild>
                          <Link href="/dashboard/cuentas">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Configurar Cuentas
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="reports" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informes</CardTitle>
                  <CardDescription>Acceda a diferentes tipos de reportes financieros</CardDescription>
                </CardHeader>
                <CardContent className="p-6 border border-dashed border-muted rounded-lg flex flex-col items-center justify-center m-4">
                  <BarChart2 className="h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    Los informes estarán disponibles cuando haya datos de transacciones suficientes.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="actions" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Importar Cartolas</CardTitle>
                    <CardDescription>Suba datos bancarios desde archivos Excel.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-muted-foreground">Seleccione una cuenta bancaria para importar sus movimientos:</p>
                    <Button asChild>
                      <Link href="/dashboard/cuentas">
                        <Upload className="mr-2 h-4 w-4" /> 
                        Ir a Cuentas Bancarias
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración Avanzada</CardTitle>
                    <CardDescription>Opciones y preferencias de la empresa.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-muted-foreground">Personalice las opciones de su empresa y usuarios:</p>
                    <Button asChild variant="outline">
                      <Link href="/dashboard/configuracion">
                        <ShieldCheck className="mr-2 h-4 w-4" /> 
                        Configuración
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
