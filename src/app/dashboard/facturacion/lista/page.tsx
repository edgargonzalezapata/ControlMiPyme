'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, Download, FileText, RefreshCw, Loader2, DollarSign, Calendar } from 'lucide-react';
import { FacturasList } from '@/components/facturacion/FacturasList';
import { useToast } from '@/hooks/use-toast';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { useActivePeriod } from '@/context/ActivePeriodProvider';
import { FacturaConEstado, EstadoFactura } from '@/types/factura';
import { getFacturasByEmpresa, deleteFactura } from '@/lib/facturaService';

export default function ListaFacturasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeCompanyId } = useActiveCompany();
  const { activePeriod } = useActivePeriod();
  
  const [isLoading, setIsLoading] = useState(true);
  const [facturas, setFacturas] = useState<FacturaConEstado[]>([]);
  const [filteredFacturas, setFilteredFacturas] = useState<FacturaConEstado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  // Formatear fechas para el filtro inicial basado en el periodo activo
  const formatearFecha = (fecha: Date) => {
    return fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  };
  
  // Calcular fechas de inicio y fin del mes activo
  const calcularFechasPeriodo = () => {
    const { month, year } = activePeriod;
    const fechaInicio = new Date(year, month - 1, 1); // Mes en JavaScript es 0-indexed
    const fechaFin = new Date(year, month, 0); // Último día del mes
    
    return {
      fechaDesde: formatearFecha(fechaInicio),
      fechaHasta: formatearFecha(fechaFin)
    };
  };
  
  const fechasPeriodo = calcularFechasPeriodo();
  
  const [filters, setFilters] = useState({
    estado: 'todos',
    receptor: '',
    fechaDesde: fechasPeriodo.fechaDesde,
    fechaHasta: fechasPeriodo.fechaHasta,
    montoMin: '',
    montoMax: ''
  });
  const [activeTab, setActiveTab] = useState('todos');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Calcular totales por estado
  const calcularTotales = useCallback((facturas: FacturaConEstado[]) => {
    const estados: EstadoFactura[] = ['pendiente', 'pagada', 'anulada'];
    const totales: Record<string, { count: number; monto: number }> = {
      todos: { count: facturas.length, monto: facturas.reduce((sum, f) => sum + (f.montoTotal || 0), 0) }
    };

    estados.forEach(estado => {
      const facturasEstado = facturas.filter(f => f.estado === estado);
      totales[estado] = {
        count: facturasEstado.length,
        monto: facturasEstado.reduce((sum, f) => sum + (f.montoTotal || 0), 0)
      };
    });

    return totales;
  }, []);

  // Calcular totales actuales
  const totales = calcularTotales(filteredFacturas);

  // Formatear moneda
  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  // Cargar facturas
  const loadFacturas = useCallback(async () => {
    if (!activeCompanyId) return;
    
    try {
      setIsLoading(true);
      const result = await getFacturasByEmpresa(activeCompanyId);
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      setFacturas(result);
      setFilteredFacturas(result);
    } catch (error) {
      console.error('Error cargando facturas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las facturas. ' + (error instanceof Error ? error.message : ''),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeCompanyId, toast]);

  // Cargar facturas al montar el componente y cuando cambie activeCompanyId
  useEffect(() => {
    loadFacturas();
  }, [loadFacturas]);

  // Manejar eliminación de factura
  const handleEliminarFactura = async (factura: FacturaConEstado) => {
    if (!factura.id) {
      toast({
        title: 'Error',
        description: 'No se puede eliminar la factura: ID no válido',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsDeleting(factura.id);
      const result = await deleteFactura(factura.id);
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      // Actualizar la lista de facturas después de eliminar
      await loadFacturas();
      
      toast({
        title: 'Éxito',
        description: 'Factura eliminada correctamente',
      });
    } catch (error) {
      console.error('Error eliminando factura:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la factura. ' + (error instanceof Error ? error.message : ''),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Manejar clic en una factura
  const handleFacturaClick = (factura: FacturaConEstado) => {
    if (factura.id) {
      router.push(`/dashboard/facturacion/factura/${factura.id}`);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let result = [...facturas];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(factura => 
        factura.folio.toLowerCase().includes(term) ||
        (factura.razonSocialEmisor?.toLowerCase().includes(term) || '') ||
        (factura.rutEmisor?.toLowerCase().includes(term) || '') ||
        (factura.razonSocialReceptor?.toLowerCase().includes(term) || '') ||
        (factura.rutReceptor?.toLowerCase().includes(term) || '')
      );
    }

    // Filtrar por estado
    if (filters.estado !== 'todos') {
      result = result.filter(factura => factura.estado === filters.estado);
    }
    
    // Filtrar por receptor
    if (filters.receptor) {
      const receptorTerm = filters.receptor.toLowerCase();
      result = result.filter(factura => 
        (factura.razonSocialReceptor?.toLowerCase().includes(receptorTerm) || false) ||
        (factura.rutReceptor?.toLowerCase().includes(receptorTerm) || false)
      );
    }

    // Filtrar por rango de fechas
    if (filters.fechaDesde) {
      const desde = new Date(filters.fechaDesde);
      result = result.filter(factura => {
        const fechaFactura = factura.fechaEmision ? new Date(factura.fechaEmision) : null;
        return fechaFactura && fechaFactura >= desde;
      });
    }

    if (filters.fechaHasta) {
      const hasta = new Date(filters.fechaHasta);
      hasta.setHours(23, 59, 59, 999); // Fin del día
      result = result.filter(factura => {
        const fechaFactura = factura.fechaEmision ? new Date(factura.fechaEmision) : null;
        return fechaFactura && fechaFactura <= hasta;
      });
    }

    // Filtrar por rango de montos
    if (filters.montoMin) {
      const min = parseFloat(filters.montoMin);
      result = result.filter(factura => factura.montoTotal >= min);
    }

    if (filters.montoMax) {
      const max = parseFloat(filters.montoMax);
      result = result.filter(factura => factura.montoTotal <= max);
    }

    setFilteredFacturas(result);
  }, [facturas, searchTerm, filters]);

  // Manejar cambio de pestaña
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'todos') {
      setFilters(prev => ({ ...prev, estado: 'todos' }));
    } else {
      setFilters(prev => ({ ...prev, estado: value as EstadoFactura }));
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm('');
    setFilters({
      estado: 'todos',
      receptor: '',
      fechaDesde: '',
      fechaHasta: '',
      montoMin: '',
      montoMax: ''
    });
    setActiveTab('todos');
  };
  
  // Restablecer filtros al periodo activo
  const restablecerPeriodoActivo = () => {
    const fechas = calcularFechasPeriodo();
    setFilters(prev => ({
      ...prev,
      fechaDesde: fechas.fechaDesde,
      fechaHasta: fechas.fechaHasta
    }));
    toast({
      title: 'Filtros actualizados',
      description: `Se ha aplicado el filtro del periodo activo: ${obtenerNombreMes(activePeriod.month)} ${activePeriod.year}`,
    });
  };
  
  // Obtener el nombre del mes
  const obtenerNombreMes = (mes: number): string => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
          <p className="text-muted-foreground">
            Gestiona y revisa las facturas de tu empresa
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/facturacion/importar')}>
            <FileText className="mr-2 h-4 w-4" />
            Importar Facturas
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar facturas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
                startIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button variant="outline" size="sm" onClick={restablecerPeriodoActivo}>
                <Calendar className="h-4 w-4 mr-2" />
                Periodo Activo
              </Button>
              <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="grid w-full md:w-auto grid-cols-4">
              <TabsTrigger value="todos" className="flex-col h-auto py-2">
                <span>Todos</span>
                <span className="text-xs font-normal mt-0.5 opacity-80">
                  {totales.todos.count} ({formatearMoneda(totales.todos.monto)})
                </span>
              </TabsTrigger>
              <TabsTrigger value="pendiente" className="flex-col h-auto py-2">
                <span>Pendientes</span>
                <span className="text-xs font-normal mt-0.5 opacity-80">
                  {totales.pendiente?.count || 0} ({formatearMoneda(totales.pendiente?.monto || 0)})
                </span>
              </TabsTrigger>
              <TabsTrigger value="pagada" className="flex-col h-auto py-2">
                <span>Pagadas</span>
                <span className="text-xs font-normal mt-0.5 opacity-80">
                  {totales.pagada?.count || 0} ({formatearMoneda(totales.pagada?.monto || 0)})
                </span>
              </TabsTrigger>
              <TabsTrigger value="anulada" className="flex-col h-auto py-2">
                <span>Anuladas</span>
                <span className="text-xs font-normal mt-0.5 opacity-80">
                  {totales.anulada?.count || 0} ({formatearMoneda(totales.anulada?.monto || 0)})
                </span>
              </TabsTrigger>
            </TabsList>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="receptor" className="block text-sm font-medium text-gray-700 mb-1">Receptor</label>
                <Input
                  id="receptor"
                  placeholder="Buscar por receptor..."
                  value={filters.receptor}
                  onChange={(e) => setFilters(prev => ({ ...prev, receptor: e.target.value }))}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700">Fecha desde</label>
                  {filters.fechaDesde === fechasPeriodo.fechaDesde && (
                    <span className="text-xs text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10">
                      Periodo activo
                    </span>
                  )}
                </div>
                <Input
                  id="fechaDesde"
                  type="date"
                  value={filters.fechaDesde}
                  onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
                  className={filters.fechaDesde === fechasPeriodo.fechaDesde ? "border-primary/50 ring-1 ring-primary/20" : ""}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700">Fecha hasta</label>
                  {filters.fechaHasta === fechasPeriodo.fechaHasta && (
                    <span className="text-xs text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10">
                      Periodo activo
                    </span>
                  )}
                </div>
                <Input
                  id="fechaHasta"
                  type="date"
                  value={filters.fechaHasta}
                  onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
                  className={filters.fechaHasta === fechasPeriodo.fechaHasta ? "border-primary/50 ring-1 ring-primary/20" : ""}
                />
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-6">
              <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">Total {activeTab === 'todos' ? 'general' : activeTab}:</span>
                    <span className="font-bold">
                      {formatearMoneda(totales[activeTab as keyof typeof totales]?.monto || 0)}
                    </span>
                    <span className="text-xs opacity-70 ml-2">
                      ({totales[activeTab as keyof typeof totales]?.count || 0} facturas)
                    </span>
                  </div>
                  
                  {(filters.fechaDesde === fechasPeriodo.fechaDesde && filters.fechaHasta === fechasPeriodo.fechaHasta) && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Calendar className="h-4 w-4" />
                      <span>Periodo activo: {obtenerNombreMes(activePeriod.month)} {activePeriod.year}</span>
                    </div>
                  )}
                </div>
              </div>
              <FacturasList 
                facturas={filteredFacturas} 
                onFacturaClick={handleFacturaClick}
                onEliminarFactura={handleEliminarFactura}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
