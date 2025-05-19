"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileSpreadsheet, UploadCloud, AlertTriangle, Loader2, Banknote, Search, Filter, Calendar, X, ChevronsUpDown } from "lucide-react";
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { useAuthContext } from '@/context/AuthProvider';
import { useRouter, useSearchParams } from "next/navigation";
import { db } from '@/lib/firestore';
import { collection, query, where, onSnapshot, Unsubscribe, Timestamp, orderBy } from 'firebase/firestore';
import { Input } from "@/components/ui/input";
import { format, subMonths, isWithinInterval, getYear, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Import Recharts components from ShadCN/UI
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { TrendingUp, TrendingDown } from "lucide-react";

type Transaction = {
  id: string;
  accountId: string;
  companyId: string;
  date: Timestamp;
  description: string;
  amount: number;
  type: 'ingreso' | 'egreso';
  originalFileName: string;
  importedAt: Timestamp;
};

type FilterType = "todos" | "ingreso" | "egreso";

// Define a type for chart data items
type ChartDataItem = {
  name: string; // Transaction description (potentially truncated for display)
  originalName: string; // Original, full transaction description for filtering
  value: number; // Transaction amount (always positive for chart)
  fill: string; // Color for the bar
  labelValue?: string; // Formatted value for display on bar
};

export default function TransaccionesDashboardPage() {
  const { activeCompanyId, activeCompanyDetails, isLoadingActiveCompany } = useActiveCompany();
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdParam = searchParams.get('accountId');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Nuevos filtros
  const [typeFilter, setTypeFilter] = useState<FilterType>("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Nuevos estados para filtro de mes y año
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  // State for chart data
  const [topIncomesData, setTopIncomesData] = useState<ChartDataItem[]>([]);
  const [topExpensesData, setTopExpensesData] = useState<ChartDataItem[]>([]);

  // Valores predefinidos para el filtro de fecha
  const datePresets = {
    "todos": undefined,
    "ultimos7dias": {
      from: new Date(new Date().setDate(new Date().getDate() - 7)),
      to: new Date()
    },
    "ultimos30dias": {
      from: subMonths(new Date(), 1),
      to: new Date()
    },
    "ultimos90dias": {
      from: subMonths(new Date(), 3),
      to: new Date()
    },
  };
  
  // Derivar años disponibles de las transacciones
  const availableYears = useMemo(() => {
    if (transactions.length === 0) return [];
    const years = Array.from(new Set(transactions.map(tx => getYear(tx.date.toDate()))));
    return years.sort((a, b) => b - a); // Descending order
  }, [transactions]);

  // Array de meses para el selector
  const months = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: format(new Date(2000, i, 1), 'MMMM', { locale: es })
    })),
    []
  );

  // Efecto para actualizar dateRange cuando selectedMonth y selectedYear cambian
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      const firstDay = startOfMonth(new Date(selectedYear, selectedMonth - 1));
      const lastDay = endOfMonth(new Date(selectedYear, selectedMonth - 1));
      setDateRange({ from: firstDay, to: lastDay });
    }
    // No limpiar dateRange aquí, eso lo manejan los otros selectores si se usan.
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (!activeCompanyId || !user || authLoading || isLoadingActiveCompany || !db) {
      return;
    }

    setLoading(true);
    setError(null);

    let transactionsQuery;
    if (accountIdParam) {
      // Si hay un parámetro de cuenta, filtramos por esa cuenta
      transactionsQuery = query(
        collection(db, 'transactions'),
        where('companyId', '==', activeCompanyId),
        where('accountId', '==', accountIdParam),
        orderBy('date', 'desc')
      );
    } else {
      // Si no, mostramos todas las transacciones de la empresa
      transactionsQuery = query(
        collection(db, 'transactions'),
        where('companyId', '==', activeCompanyId),
        orderBy('date', 'desc')
      );
    }

    const unsubscribe: Unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const transactionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Transaction));
        setTransactions(transactionsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error al obtener transacciones:", err);
        setError("No se pudieron cargar las transacciones. " + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeCompanyId, user, authLoading, isLoadingActiveCompany, accountIdParam]);

  // Filtrar transacciones basado en todos los filtros aplicados
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Filtro por término de búsqueda (descripción)
      const matchesSearch = searchTerm === "" || 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.amount.toString().includes(searchTerm);
        
      // Filtro por tipo (ingreso/egreso)
      const matchesType = typeFilter === "todos" || tx.type === typeFilter;
      
      // Filtro por rango de fecha
      let matchesDate = true;
      if (dateRange && dateRange.from) {
        const txDate = tx.date.toDate(); // Convert Firestore Timestamp to JS Date
        let rangeEnd = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
        
        // Ensure rangeEnd includes the entire day if only one day is selected or it's the end of the range
        if (dateRange.to) {
          rangeEnd.setHours(23, 59, 59, 999);
        }
        
        matchesDate = isWithinInterval(txDate, { 
          start: new Date(dateRange.from), 
          end: rangeEnd 
        });
      }
      
      return matchesSearch && matchesType && matchesDate;
    });
  }, [transactions, searchTerm, typeFilter, dateRange]);

  // Calcular totales para las transacciones filtradas
  const { totalIngresos, totalEgresos, balancePeriodo } = filteredTransactions.reduce(
    (acc, tx) => {
      if (tx.type === 'ingreso') {
        acc.totalIngresos += tx.amount;
      } else if (tx.type === 'egreso') {
        acc.totalEgresos += tx.amount;
      }
      acc.balancePeriodo = acc.totalIngresos + acc.totalEgresos;
      return acc;
    },
    { totalIngresos: 0, totalEgresos: 0, balancePeriodo: 0 }
  );

  // Process data for charts when filteredTransactions changes
  useEffect(() => {
    // --- Process Incomes ---
    const incomeGroups: { [key: string]: number } = {};
    filteredTransactions
      .filter(tx => tx.type === 'ingreso')
      .forEach(tx => {
        incomeGroups[tx.description] = (incomeGroups[tx.description] || 0) + tx.amount;
      });

    const groupedIncomes = Object.entries(incomeGroups)
      .map(([name, total]) => ({ name, totalAmount: total }))
      .sort((a, b) => b.totalAmount - a.totalAmount) // Sort descending
      .slice(0, 10)
      .map(group => ({
        name: group.name.length > 30 ? group.name.substring(0, 27) + "..." : group.name,
        originalName: group.name, // Store full original name here
        value: group.totalAmount,
        fill: "url(#incomeGradient)",
        labelValue: formatCurrency(group.totalAmount),
      }));
    setTopIncomesData(groupedIncomes);

    // --- Process Expenses ---
    const expenseGroups: { [key: string]: number } = {};
    filteredTransactions
      .filter(tx => tx.type === 'egreso')
      .forEach(tx => {
        // Summing the absolute amounts for expenses, as chart values should be positive
        expenseGroups[tx.description] = (expenseGroups[tx.description] || 0) + Math.abs(tx.amount);
      });

    const groupedExpenses = Object.entries(expenseGroups)
      .map(([name, total]) => ({ name, totalAmount: total }))
      .sort((a, b) => b.totalAmount - a.totalAmount) // Sort descending by absolute sum
      .slice(0, 10)
      .map(group => ({
        name: group.name.length > 30 ? group.name.substring(0, 27) + "..." : group.name,
        originalName: group.name, // Store full original name here
        value: group.totalAmount, // Already positive
        fill: "url(#expenseGradient)",
        labelValue: formatCurrency(group.totalAmount),
      }));
    setTopExpensesData(groupedExpenses);

  }, [filteredTransactions]);

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchTerm("");
    setTypeFilter("todos");
    setDateRange(undefined);
    setSelectedMonth(undefined); // Limpiar mes
    setSelectedYear(undefined);  // Limpiar año
  };

  // Función para formatear moneda (similar a la del dashboard)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: activeCompanyDetails?.currency || 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoadingActiveCompany || authLoading) {
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

  const chartConfig = {
    ingresos: {
      label: "Ingresos",
      color: "hsl(var(--chart-2))", // Corresponds to Tailwind's chart-2
      icon: TrendingUp,
    },
    egresos: {
      label: "Egresos",
      color: "hsl(var(--chart-1))", // Corresponds to Tailwind's chart-1
      icon: TrendingDown,
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">
          Transacciones {activeCompanyDetails ? `de ${activeCompanyDetails.name}` : ''}
          {accountIdParam && <span className="ml-2 text-muted-foreground text-lg font-normal">(Cuenta filtrada)</span>}
        </h2>
         <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/cuentas`}> 
                <UploadCloud className="mr-2 h-4 w-4" /> Importar Cartola
            </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileSpreadsheet className="h-6 w-6 text-primary mr-2" />
              <CardTitle>Listado de Transacciones</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" /> 
                Filtros 
                <ChevronsUpDown className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Transacciones importadas de tus cartolas bancarias para {activeCompanyDetails?.name}.
          </CardDescription>
          
          {/* Totales del Periodo - MOVED TO HEADER AREA */}
          {filteredTransactions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800/50">
                  <dt className="text-sm font-medium text-green-700 dark:text-green-400">Total Ingresos</dt>
                  <dd className="text-xl font-bold text-green-800 dark:text-green-300">{formatCurrency(totalIngresos)}</dd>
                </div>
                <div className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800/50">
                  <dt className="text-sm font-medium text-red-700 dark:text-red-400">Total Egresos</dt>
                  <dd className="text-xl font-bold text-red-800 dark:text-red-300">{formatCurrency(totalEgresos)}</dd>
                </div>
                <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800/50">
                  <dt className="text-sm font-medium text-blue-700 dark:text-blue-400">Balance del Periodo</dt>
                  <dd className={`text-xl font-bold ${balancePeriodo >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-red-800 dark:text-red-300'}`}>
                    {formatCurrency(balancePeriodo)}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </CardHeader>

        {isFiltersOpen && (
          <div className="px-6 pb-4 pt-0 border-b">
            <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
              {/* Filtro de búsqueda por descripción */}
              <div className="flex-1">
                <label htmlFor="search" className="text-sm font-medium mb-1 block">Descripción</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="search"
                    type="text" 
                    placeholder="Buscar transacción..." 
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro por tipo */}
              <div className="w-full md:w-40">
                <label htmlFor="type" className="text-sm font-medium mb-1 block">Tipo</label>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as FilterType)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ingreso">Ingresos</SelectItem>
                    <SelectItem value="egreso">Egresos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por fecha */}
              <div className="w-full md:w-60">
                <label htmlFor="date" className="text-sm font-medium mb-1 block">Fecha</label>
                <div className="flex space-x-2">
                  <Select
                    value={selectedMonth && selectedYear ? "monthYearSelected" : 
                      dateRange ? (
                        dateRange.from?.getTime() === datePresets.ultimos7dias.from.getTime() && dateRange.to?.toDateString() === datePresets.ultimos7dias.to.toDateString() ? "ultimos7dias" : 
                        dateRange.from?.getTime() === datePresets.ultimos30dias.from.getTime() && dateRange.to?.toDateString() === datePresets.ultimos30dias.to.toDateString() ? "ultimos30dias" : 
                        dateRange.from?.getTime() === datePresets.ultimos90dias.from.getTime() && dateRange.to?.toDateString() === datePresets.ultimos90dias.to.toDateString() ? "ultimos90dias" : 
                        "personalizado"
                      ) : "todos"}
                    onValueChange={(value) => {
                      setSelectedMonth(undefined);
                      setSelectedYear(undefined);
                      if (value === "todos") {
                        setDateRange(undefined);
                      } else if (value === "ultimos7dias" || value === "ultimos30dias" || value === "ultimos90dias") {
                        setDateRange(datePresets[value as keyof typeof datePresets]);
                      } else if (value === "monthYearSelected") {
                        // No hacer nada aquí, ya que mes/año se manejan por separado
                        // y ya deberían haber establecido el dateRange
                      }
                    }}
                  >
                    <SelectTrigger id="date" className="flex-1">
                      <SelectValue placeholder="Todas las fechas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las fechas</SelectItem>
                      <SelectItem value="ultimos7dias">Últimos 7 días</SelectItem>
                      <SelectItem value="ultimos30dias">Últimos 30 días</SelectItem>
                      <SelectItem value="ultimos90dias">Últimos 3 meses</SelectItem>
                      {/* Opción para reflejar selección mes/año, pero no seleccionable directamente */}
                      {selectedMonth && selectedYear && (
                        <SelectItem value="monthYearSelected" disabled>
                          {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => {
                        // Al abrir el calendario, limpiar selección mes/año
                        setSelectedMonth(undefined);
                        setSelectedYear(undefined);
                      }}>
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <CalendarComponent
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(newRange) => {
                          // Al seleccionar del calendario, limpiar selección mes/año
                          setSelectedMonth(undefined);
                          setSelectedYear(undefined);
                          setDateRange(newRange);
                        }}
                        numberOfMonths={2}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Nuevos selectores para Mes y Año */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label htmlFor="yearFilter" className="text-sm font-medium mb-1 block">Año</label>
                  <Select
                    value={selectedYear?.toString() ?? "all-years"}
                    onValueChange={(value) => {
                      if (value === "all-years") {
                        setSelectedYear(undefined);
                        setSelectedMonth(undefined);
                      } else {
                        setSelectedYear(value ? parseInt(value) : undefined);
                      }
                    }}
                    disabled={availableYears.length === 0}
                  >
                    <SelectTrigger id="yearFilter">
                      <SelectValue placeholder={availableYears.length > 0 ? "Seleccionar año" : "No hay años"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-years">Todos los años</SelectItem>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="monthFilter" className="text-sm font-medium mb-1 block">Mes</label>
                  <Select
                    value={selectedMonth?.toString() ?? "all-months"}
                    onValueChange={(value) => {
                      if (value === "all-months") {
                        setSelectedMonth(undefined);
                      } else {
                        setSelectedMonth(value ? parseInt(value) : undefined);
                      }
                    }}
                    disabled={!selectedYear}
                  >
                    <SelectTrigger id="monthFilter">
                      <SelectValue placeholder={selectedYear ? "Seleccionar mes" : "Seleccione un año"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-months">Todos los meses</SelectItem>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botón para limpiar filtros */}
              <div className="flex items-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" /> Limpiar filtros
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Section for Charts - MOVED HERE AND MODIFIED FOR TWO COLUMNS */}
        {filteredTransactions.length > 0 && (
          <CardContent className="pt-6 pb-4 border-b">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">Análisis Gráfico</h3>
              <p className="text-sm text-muted-foreground">
                Top 10 ingresos y egresos por descripción, basados en los filtros actuales.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
              {topIncomesData.length > 0 ? (
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h4 className="text-md font-semibold mb-2 text-green-600 dark:text-green-400">Top 10 Ingresos</h4>
                  <ChartContainer config={chartConfig} className="h-[330px] w-full">
                    <BarChart 
                      data={topIncomesData} 
                      layout="vertical" 
                      margin={{ right: 50, left: 130, top: 10, bottom: 10 }}
                      barGap={6}
                      barSize={22}
                    >
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(var(--success))" />
                          <stop offset="100%" stopColor="hsl(var(--success)/0.7)" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid horizontal={false} stroke="hsl(var(--border)/0.3)" />
                      <XAxis 
                        type="number" 
                        dataKey="value" 
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                        axisLine={{stroke: 'hsl(var(--border))'}}
                        tickLine={{stroke: 'hsl(var(--border))'}}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={150}
                        interval={0} 
                        tick={{fill: 'hsl(var(--foreground))', fontSize: 11}}
                        axisLine={false}
                        tickLine={false}
                        className="text-xs font-medium"
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted)/0.8)" }}
                        content={<ChartTooltipContent 
                          formatter={(value) => formatCurrency(Number(value))} 
                          nameKey="Ingreso" 
                        />}
                      />
                      <Bar 
                        dataKey="value" 
                        name="Ingreso" 
                        radius={[0, 4, 4, 0]} 
                        onClick={(data) => {
                          if (data && data.payload && data.payload.originalName) {
                            const clickedOriginalName = data.payload.originalName;
                            if (searchTerm === clickedOriginalName) {
                              setSearchTerm("");
                            } else {
                              setSearchTerm(clickedOriginalName);
                              setIsFiltersOpen(true);
                            }
                          }
                        }}
                        label={(props: any) => {
                          const { x, y, width, height, value, payload } = props;
                          const labelValue = payload?.labelValue;
                          if (!labelValue || width < 40) return <g />;
                          return (
                            <text 
                              x={x + width - 6} 
                              y={y + height / 2} 
                              textAnchor="end" 
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="12px"
                              fontWeight="500"
                            >
                              {labelValue}
                            </text>
                          );
                        }}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[330px] border rounded-md bg-muted/30">
                  <p className="text-muted-foreground text-center p-4">No hay datos de ingresos para graficar.</p>
                </div>
              )}

              {topExpensesData.length > 0 ? (
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h4 className="text-md font-semibold mb-2 text-red-600 dark:text-red-400">Top 10 Egresos</h4>
                  <ChartContainer config={chartConfig} className="h-[330px] w-full">
                    <BarChart 
                      data={topExpensesData} 
                      layout="vertical" 
                      margin={{ right: 50, left: 130, top: 10, bottom: 10 }}
                      barGap={6}
                      barSize={22}
                    >
                      <defs>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(var(--destructive))" />
                          <stop offset="100%" stopColor="hsl(var(--destructive)/0.7)" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid horizontal={false} stroke="hsl(var(--border)/0.3)" />
                      <XAxis 
                        type="number" 
                        dataKey="value" 
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                        axisLine={{stroke: 'hsl(var(--border))'}}
                        tickLine={{stroke: 'hsl(var(--border))'}}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={150}
                        interval={0} 
                        tick={{fill: 'hsl(var(--foreground))', fontSize: 11}}
                        axisLine={false}
                        tickLine={false}
                        className="text-xs font-medium"
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted)/0.8)" }}
                        content={<ChartTooltipContent 
                          formatter={(value) => formatCurrency(Number(value))} 
                          nameKey="Egreso" 
                        />}
                      />
                      <Bar 
                        dataKey="value" 
                        name="Egreso" 
                        radius={[0, 4, 4, 0]} 
                        onClick={(data) => {
                          if (data && data.payload && data.payload.originalName) {
                            const clickedOriginalName = data.payload.originalName;
                            if (searchTerm === clickedOriginalName) {
                              setSearchTerm("");
                            } else {
                              setSearchTerm(clickedOriginalName);
                              setIsFiltersOpen(true);
                            }
                          }
                        }}
                        label={(props: any) => {
                          const { x, y, width, height, value, payload } = props;
                          const labelValue = payload?.labelValue;
                          if (!labelValue || width < 40) return <g />;
                          return (
                            <text 
                              x={x + width - 6} 
                              y={y + height / 2} 
                              textAnchor="end" 
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="12px"
                              fontWeight="500"
                            >
                              {labelValue}
                            </text>
                          );
                        }}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[330px] border rounded-md bg-muted/30">
                  <p className="text-muted-foreground text-center p-4">No hay datos de egresos para graficar.</p>
                </div>
              )}
            </div>
            {(topIncomesData.length === 0 && topExpensesData.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No hay suficientes datos para mostrar los gráficos con los filtros actuales.</p>
            )}
          </CardContent>
        )}
        
        <CardContent className={isFiltersOpen || filteredTransactions.length > 0 ? "pt-6" : ""}>
          {loading ? (
            <div className="py-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">Cargando transacciones...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
              <p className="mt-2 text-destructive">{error}</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-10 text-center">
              <Banknote className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
              <p className="mt-4 text-muted-foreground">
                {transactions.length === 0 
                  ? "No hay transacciones importadas aún. Importa una cartola para comenzar."
                  : "No se encontraron transacciones que coincidan con los filtros aplicados."}
              </p>
              {transactions.length === 0 ? (
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/dashboard/cuentas">Ir a Importar Cartola</Link>
                </Button>
              ) : (
                <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                  <X className="h-4 w-4 mr-2" /> Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {filteredTransactions.length} de {transactions.length} transacciones
                </div>
                {(searchTerm || typeFilter !== "todos" || dateRange) && (
                  <Badge variant="outline" className="px-3 py-1.5">
                    Filtros activos
                    {searchTerm && <span className="ml-1">• Descripción</span>}
                    {typeFilter !== "todos" && <span className="ml-1">• Tipo</span>}
                    {dateRange && <span className="ml-1">• Fecha</span>}
                  </Badge>
                )}
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="w-[150px] text-right">Monto</TableHead>
                      <TableHead className="w-[100px] text-center">Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {transaction.date ? 
                            format(transaction.date.toDate(), 'dd MMM yyyy', { locale: es }) : 
                            'Fecha no disponible'}
                        </TableCell>
                        <TableCell className="max-w-[400px] truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={transaction.type === 'ingreso' ? 'success' : 'destructive'}>
                            {transaction.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
