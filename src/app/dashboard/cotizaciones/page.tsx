"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { useAuthContext } from '@/context/AuthProvider';
import { PlusCircle, FileText, Search, Trash2, Edit, Eye, FilePlus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { listarCotizaciones, eliminarCotizacion, Cotizacion as CotizacionType } from '@/lib/services/cotizacionService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Definir el tipo para las cotizaciones en la interfaz
interface Cotizacion {
  id: string;
  numero: string;
  clienteNombre: string;
  fecha: Date;
  fechaVencimiento: Date;
  total: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'vencida';
  empresaId: string;
}

export default function CotizacionesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuthContext();
  const { activeCompanyId, activeCompanyDetails } = useActiveCompany();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar cotizaciones desde Firebase
  useEffect(() => {
    const cargarCotizaciones = async () => {
      if (!activeCompanyId) return;
      
      try {
        setIsLoading(true);
        const cotizacionesFB = await listarCotizaciones(activeCompanyId);
        
        // Convertir el tipo de Firebase al tipo de la interfaz
        const cotizacionesUI: Cotizacion[] = cotizacionesFB.map(cot => ({
          id: cot.id || '',
          numero: cot.numero,
          clienteNombre: cot.clienteNombre,
          fecha: cot.fecha,
          fechaVencimiento: cot.fechaVencimiento,
          total: cot.total,
          estado: cot.estado,
          empresaId: cot.empresaId
        }));
        
        setCotizaciones(cotizacionesUI);
      } catch (error) {
        console.error('Error al cargar cotizaciones:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las cotizaciones',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarCotizaciones();
  }, [activeCompanyId]);

  // Filtrar cotizaciones según el término de búsqueda
  const filteredCotizaciones = cotizaciones.filter(cotizacion => 
    cotizacion.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para formatear montos en pesos chilenos
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Función para obtener el color del badge según el estado
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'aprobada':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rechazada':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'vencida':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  // Función para crear nueva cotización
  const handleCreateCotizacion = () => {
    router.push('/dashboard/cotizaciones/nueva');
  };
  
  // Función para eliminar una cotización
  const handleDeleteCotizacion = async (id: string) => {
    try {
      setIsLoading(true);
      await eliminarCotizacion(id);
      
      // Actualizar la lista de cotizaciones
      setCotizaciones(prevCotizaciones => 
        prevCotizaciones.filter(cotizacion => cotizacion.id !== id)
      );
      
      toast({
        title: 'Cotización eliminada',
        description: 'La cotización ha sido eliminada exitosamente',
      });
    } catch (error) {
      console.error('Error al eliminar la cotización:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la cotización',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para calcular los días restantes de validez
  const calcularDiasValidez = (fechaVencimiento: Date) => {
    const hoy = new Date();
    const diferencia = fechaVencimiento.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(diferencia / (1000 * 3600 * 24));
    return diasRestantes > 0 ? diasRestantes : 0;
  };

  if (!activeCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Seleccione una empresa</CardTitle>
            <CardDescription>
              Debe seleccionar una empresa para gestionar cotizaciones.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
          <Button onClick={handleCreateCotizacion}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Cotización
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gestión de Cotizaciones</CardTitle>
            <CardDescription>
              Administre las cotizaciones de servicios para {activeCompanyDetails?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="todas" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="todas">Todas</TabsTrigger>
                  <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                  <TabsTrigger value="aprobadas">Aprobadas</TabsTrigger>
                  <TabsTrigger value="rechazadas">Rechazadas</TabsTrigger>
                </TabsList>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar cotización..."
                    className="pl-8 w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <TabsContent value="todas">
                {renderCotizacionesTable(filteredCotizaciones)}
              </TabsContent>
              <TabsContent value="pendientes">
                {renderCotizacionesTable(filteredCotizaciones.filter(c => c.estado === 'pendiente'))}
              </TabsContent>
              <TabsContent value="aprobadas">
                {renderCotizacionesTable(filteredCotizaciones.filter(c => c.estado === 'aprobada'))}
              </TabsContent>
              <TabsContent value="rechazadas">
                {renderCotizacionesTable(filteredCotizaciones.filter(c => c.estado === 'rechazada' || c.estado === 'vencida'))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  function renderCotizacionesTable(cotizaciones: Cotizacion[]) {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      );
    }

    if (cotizaciones.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No hay cotizaciones</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No se encontraron cotizaciones con los filtros actuales.
          </p>
          <div className="mt-6">
            <Button onClick={handleCreateCotizacion}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear nueva cotización
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Validez</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cotizaciones.map((cotizacion) => (
              <TableRow key={cotizacion.id}>
                <TableCell className="font-medium">{cotizacion.numero}</TableCell>
                <TableCell>{cotizacion.clienteNombre}</TableCell>
                <TableCell>{cotizacion.fecha.toLocaleDateString('es-CL')}</TableCell>
                <TableCell>{formatCurrency(cotizacion.total)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(cotizacion.estado)}>
                    {cotizacion.estado.charAt(0).toUpperCase() + cotizacion.estado.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{calcularDiasValidez(cotizacion.fechaVencimiento)} días</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Ver"
                      onClick={() => router.push(`/dashboard/cotizaciones/${cotizacion.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Editar"
                      onClick={() => router.push(`/dashboard/cotizaciones/editar/${cotizacion.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Convertir a factura"
                      onClick={() => router.push(`/dashboard/facturas/nueva?cotizacionId=${cotizacion.id}`)}
                    >
                      <FilePlus className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la cotización {cotizacion.numero}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteCotizacion(cotizacion.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
}
