'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useActivePeriod } from '@/context/ActivePeriodProvider';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { getFacturasByEmpresa, getFacturasRecibidasByEmpresa } from '@/lib/facturaService';
import { FacturaConEstado } from '@/types/factura';
import { FileText, ArrowUpRight, ArrowDownLeft, Calendar, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function FacturacionDashboardPage() {
  const { activePeriod } = useActivePeriod();
  const { activeCompanyId } = useActiveCompany();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [facturasEmitidas, setFacturasEmitidas] = useState<FacturaConEstado[]>([]);
  const [facturasRecibidas, setFacturasRecibidas] = useState<FacturaConEstado[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'mes' | 'año'>('mes');
  
  // Obtener el nombre del mes
  const obtenerNombreMes = (mes: number): string => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1];
  };
  
  // Formatear moneda
  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };
  
  // Calcular fechas de inicio y fin del periodo
  const calcularFechasPeriodo = () => {
    const { month, year } = activePeriod;
    
    if (selectedPeriod === 'mes') {
      const fechaInicio = new Date(year, month - 1, 1); // Mes en JavaScript es 0-indexed
      const fechaFin = new Date(year, month, 0); // Último día del mes
      
      return {
        fechaDesde: fechaInicio,
        fechaHasta: fechaFin
      };
    } else {
      // Año completo
      const fechaInicio = new Date(year, 0, 1);
      const fechaFin = new Date(year, 11, 31);
      
      return {
        fechaDesde: fechaInicio,
        fechaHasta: fechaFin
      };
    }
  };
  
  // Cargar facturas
  useEffect(() => {
    const cargarFacturas = async () => {
      if (!activeCompanyId) return;
      
      setIsLoading(true);
      
      try {
        const fechas = calcularFechasPeriodo();
        
        // Cargar facturas emitidas
        const emitidas = await getFacturasByEmpresa(activeCompanyId);
        
        // Cargar facturas recibidas
        const recibidas = await getFacturasRecibidasByEmpresa(activeCompanyId);
        
        // Filtrar por fecha
        const emitidasFiltradas = Array.isArray(emitidas) 
          ? emitidas.filter((factura: FacturaConEstado) => {
              // Convertir la fecha de emisión (string) a objeto Date
              if (!factura.fechaEmision) return false;
              
              try {
                const fechaFactura = new Date(factura.fechaEmision);
                return fechaFactura >= fechas.fechaDesde && fechaFactura <= fechas.fechaHasta;
              } catch (error) {
                console.error('Error al procesar fecha de factura emitida:', error);
                return false;
              }
            })
          : [];
        
        const recibidasFiltradas = Array.isArray(recibidas)
          ? recibidas.filter((factura: FacturaConEstado) => {
              // Convertir la fecha de emisión (string) a objeto Date
              if (!factura.fechaEmision) return false;
              
              try {
                const fechaFactura = new Date(factura.fechaEmision);
                return fechaFactura >= fechas.fechaDesde && fechaFactura <= fechas.fechaHasta;
              } catch (error) {
                console.error('Error al procesar fecha de factura recibida:', error);
                return false;
              }
            })
          : [];
        
        setFacturasEmitidas(emitidasFiltradas);
        setFacturasRecibidas(recibidasFiltradas);
      } catch (error) {
        console.error('Error al cargar facturas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarFacturas();
  }, [activeCompanyId, activePeriod, selectedPeriod]);
  
  // Calcular totales
  const totalEmitidas = facturasEmitidas.reduce((sum, f) => sum + (f.montoTotal || 0), 0);
  const totalRecibidas = facturasRecibidas.reduce((sum, f) => sum + (f.montoTotal || 0), 0);
  const balance = totalEmitidas - totalRecibidas;
  
  // Datos para el gráfico de barras comparativo
  const datosComparativa = [
    {
      name: 'Emitidas',
      value: totalEmitidas,
      fill: 'hsl(var(--success))'
    },
    {
      name: 'Recibidas',
      value: totalRecibidas,
      fill: 'hsl(var(--warning))'
    }
  ];
  
  // Datos para el gráfico de torta de estado de facturas emitidas
  const datosEstadoEmitidas = [
    {
      name: 'Pendientes',
      value: facturasEmitidas.filter(f => f.estado === 'pendiente').length,
      fill: 'hsl(var(--warning))'
    },
    {
      name: 'Pagadas',
      value: facturasEmitidas.filter(f => f.estado === 'pagada').length,
      fill: 'hsl(var(--success))'
    },
    {
      name: 'Anuladas',
      value: facturasEmitidas.filter(f => f.estado === 'anulada').length,
      fill: 'hsl(var(--destructive))'
    }
  ].filter(item => item.value > 0);
  
  // Datos para el gráfico de torta de estado de facturas recibidas
  const datosEstadoRecibidas = [
    {
      name: 'Pendientes',
      value: facturasRecibidas.filter(f => f.estado === 'pendiente').length,
      fill: 'hsl(var(--warning))'
    },
    {
      name: 'Pagadas',
      value: facturasRecibidas.filter(f => f.estado === 'pagada').length,
      fill: 'hsl(var(--success))'
    },
    {
      name: 'Anuladas',
      value: facturasRecibidas.filter(f => f.estado === 'anulada').length,
      fill: 'hsl(var(--destructive))'
    }
  ].filter(item => item.value > 0);
  
  // Configuración del gráfico
  const chartConfig = {
    emitidas: {
      label: "Emitidas",
      color: "hsl(var(--success))",
      icon: ArrowUpRight,
    },
    recibidas: {
      label: "Recibidas",
      color: "hsl(var(--warning))",
      icon: ArrowDownLeft,
    }
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard de Facturación</h1>
          <p className="text-muted-foreground">
            Resumen de facturas emitidas y recibidas en el periodo activo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs 
            value={selectedPeriod} 
            onValueChange={(value) => setSelectedPeriod(value as 'mes' | 'año')}
            className="w-auto"
          >
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="mes">Mes actual</TabsTrigger>
              <TabsTrigger value="año">Año completo</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          Periodo activo: {selectedPeriod === 'mes' 
            ? `${obtenerNombreMes(activePeriod.month)} ${activePeriod.year}` 
            : `Año ${activePeriod.year}`}
        </span>
      </div>
      
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Facturas Emitidas</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-success" />
            </div>
            <CardDescription>Total facturado en el periodo</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatearMoneda(totalEmitidas)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {facturasEmitidas.length} facturas
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs mt-2" 
                  onClick={() => router.push('/dashboard/facturacion/lista')}
                >
                  Ver facturas emitidas
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Facturas Recibidas</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-warning" />
            </div>
            <CardDescription>Total recibido en el periodo</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatearMoneda(totalRecibidas)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {facturasRecibidas.length} facturas
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs mt-2" 
                  onClick={() => router.push('/dashboard/facturacion/recibidas')}
                >
                  Ver facturas recibidas
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Balance</CardTitle>
              {balance >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </div>
            <CardDescription>Diferencia entre emitidas y recibidas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatearMoneda(balance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {balance >= 0 ? 'Superávit' : 'Déficit'} en el periodo
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico de barras comparativo */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Comparativa de Facturación</CardTitle>
          </div>
          <CardDescription>
            Comparación entre facturas emitidas y recibidas en el periodo activo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] w-full flex items-center justify-center">
              <Skeleton className="h-[300px] w-[80%]" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart
                data={datosComparativa}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                barSize={60}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                <XAxis 
                  dataKey="name" 
                  tick={{fill: 'hsl(var(--foreground))', fontSize: 12}}
                  axisLine={{stroke: 'hsl(var(--border))'}}
                  tickLine={{stroke: 'hsl(var(--border))'}}
                />
                <YAxis 
                  tickFormatter={(value) => formatearMoneda(value)}
                  tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                  axisLine={{stroke: 'hsl(var(--border))'}}
                  tickLine={{stroke: 'hsl(var(--border))'}}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.8)" }}
                  content={<ChartTooltipContent 
                    formatter={(value) => formatearMoneda(Number(value))} 
                    nameKey="Monto" 
                  />}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name="Monto" 
                  fill="url(#colorGradient)" 
                  radius={[4, 4, 0, 0]}
                  label={{
                    position: 'top',
                    formatter: (value: number) => formatearMoneda(value),
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 12
                  }}
                >
                  {datosComparativa.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--primary)/0.7)" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
      
      {/* Gráficos de estado de facturas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-success" />
              <CardTitle>Estado de Facturas Emitidas</CardTitle>
            </div>
            <CardDescription>
              Distribución por estado de las facturas emitidas en el periodo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] w-full flex items-center justify-center">
                <Skeleton className="h-[250px] w-[250px] rounded-full" />
              </div>
            ) : datosEstadoEmitidas.length === 0 ? (
              <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                No hay facturas emitidas en este periodo
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosEstadoEmitidas}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {datosEstadoEmitidas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Cantidad']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-warning" />
              <CardTitle>Estado de Facturas Recibidas</CardTitle>
            </div>
            <CardDescription>
              Distribución por estado de las facturas recibidas en el periodo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] w-full flex items-center justify-center">
                <Skeleton className="h-[250px] w-[250px] rounded-full" />
              </div>
            ) : datosEstadoRecibidas.length === 0 ? (
              <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                No hay facturas recibidas en este periodo
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosEstadoRecibidas}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {datosEstadoRecibidas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Cantidad']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
