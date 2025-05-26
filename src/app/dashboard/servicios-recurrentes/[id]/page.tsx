"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Edit, Trash2, AlertTriangle, 
  Calendar, DollarSign, CheckCircle, XCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  getRecurringService, 
  getServiceBillings,
  updateRecurringService,
  deleteRecurringService,
  updateServiceBillingStatus
} from '@/lib/recurringServiceService';
import type { RecurringService, ServiceBilling } from '@/lib/recurringServiceTypes';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Desenvolver los parámetros de ruta usando React.use()
  const unwrappedParams = typeof params === 'object' && !('then' in params) ? params : use(params);
  const serviceId = unwrappedParams.id;
  
  const { toast } = useToast();
  const router = useRouter();
  const { activeCompanyDetails: currentCompany } = useActiveCompany();
  const [service, setService] = useState<RecurringService | null>(null);
  const [billings, setBillings] = useState<ServiceBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (serviceId) {
      loadData();
    }
  }, [serviceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar servicio
      const serviceResult = await getRecurringService(serviceId);
      if (!('error' in serviceResult)) {
        setService(serviceResult);
      } else {
        toast({
          title: "Error",
          description: serviceResult.error,
          variant: "destructive",
        });
        router.push('/dashboard/servicios-recurrentes');
        return;
      }

      // Cargar facturaciones
      const billingsResult = await getServiceBillings(serviceId);
      if (!('error' in billingsResult)) {
        setBillings(billingsResult);
      } else {
        toast({
          title: "Error",
          description: billingsResult.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cargar datos: ${error.message}`,
        variant: "destructive",
      });
      router.push('/dashboard/servicios-recurrentes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!service) return;
    
    setProcessingAction(true);
    try {
      const newStatus = service.status === 'active' ? 'inactive' : 'active';
      const result = await updateRecurringService(service.id, { status: newStatus });
      
      if ('success' in result) {
        toast({
          title: "Éxito",
          description: `Servicio ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente`,
        });
        
        // Actualizar estado local
        setService({ ...service, status: newStatus });
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cambiar el estado: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeleteService = async () => {
    if (!service) return;
    
    setProcessingAction(true);
    try {
      const result = await deleteRecurringService(service.id);
      
      if ('success' in result) {
        toast({
          title: "Éxito",
          description: "Servicio eliminado correctamente",
        });
        router.push('/dashboard/servicios-recurrentes');
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al eliminar el servicio: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleMarkAsPaid = async (billingId: string) => {
    setProcessingAction(true);
    try {
      const result = await updateServiceBillingStatus(
        billingId, 
        'paid', 
        new Date()
      );
      
      if ('success' in result) {
        toast({
          title: "Éxito",
          description: "Factura marcada como pagada correctamente",
        });
        
        // Recargar datos
        await loadData();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al marcar como pagada: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getPendingBillings = () => {
    // Incluir facturas pendientes y vencidas
    return billings.filter(billing => billing.status === 'pending' || billing.status === 'overdue');
  };

  const getPaidBillings = () => {
    // Solo facturas pagadas
    return billings.filter(billing => billing.status === 'paid');
  };
  
  // Función para convertir Timestamp a Date de manera segura
  const toDate = (timestamp: any): Date | null => {
    try {
      if (!timestamp) return null;
      
      // Si es un Timestamp de Firestore
      if (typeof timestamp === 'object' && 'toDate' in timestamp) {
        return timestamp.toDate();
      }
      
      // Si ya es una fecha
      if (timestamp instanceof Date) {
        return timestamp;
      }
      
      // Intentar convertir a fecha
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.error('Error al convertir fecha:', error);
      return null;
    }
  };

  // Verificar si hay facturas pendientes para el mes actual
  const hasCurrentMonthPendingBill = (): boolean => {
    if (!service) return false;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return billings.some(billing => {
      if (billing.status !== 'pending') return false;
      
      const billingDate = toDate(billing.billingDate);
      if (!billingDate) return false;
      
      return billingDate.getMonth() === currentMonth && 
             billingDate.getFullYear() === currentYear;
    });
  };
  
  // Función para verificar si el servicio está pendiente de facturación
  const isServicePendingThisMonth = () => {
    if (!service) return false;
    
    // Si ya hay una factura pendiente para este mes, el servicio está pendiente
    if (hasCurrentMonthPendingBill()) return true;
    
    const now = new Date();
    const billingDay = service.billingDay || 1;
    
    // Crear fecha de facturación para este mes
    const billingDateThisMonth = new Date(now.getFullYear(), now.getMonth(), Math.min(billingDay, 28));
    
    // Crear fecha de recordatorio (10 días antes de la facturación)
    const reminderDate = new Date(billingDateThisMonth);
    reminderDate.setDate(reminderDate.getDate() - 10);
    
    // Verificar si estamos dentro del período de recordatorio (10 días antes)
    return now >= reminderDate && now <= billingDateThisMonth;
  };
  
  // Función para verificar si el servicio está próximo a vencer (dentro de 10 días)
  const isServiceUpcoming = () => {
    if (!service || service.status !== 'active') return false;
    
    const now = new Date();
    const billingDay = service.billingDay || 1;
    
    // Crear fecha de facturación para este mes
    const billingDateThisMonth = new Date(now.getFullYear(), now.getMonth(), Math.min(billingDay, 28));
    
    // Si ya pasó la fecha de facturación de este mes, verificar el próximo mes
    if (now > billingDateThisMonth) {
      billingDateThisMonth.setMonth(billingDateThisMonth.getMonth() + 1);
    }
    
    // Crear fecha de recordatorio (10 días antes de la facturación)
    const reminderDate = new Date(billingDateThisMonth);
    reminderDate.setDate(reminderDate.getDate() - 10);
    
    // Verificar si estamos dentro del período de recordatorio (10 días antes)
    return now >= reminderDate && now <= billingDateThisMonth;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactivo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      case 'paid':
        return <Badge className="bg-green-500">Pagado</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Vencido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency || 'CLP'
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMM yyyy', { locale: es });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Cargando servicio...</h1>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Servicio no encontrado</h1>
        </div>
      </div>
    );
  }

  // Verificar estados de facturación
  const hasPendingBills = hasCurrentMonthPendingBill();
  const isPendingThisMonth = isServicePendingThisMonth();
  const isUpcoming = isServiceUpcoming();
  
  // Obtener días restantes para la próxima facturación
  const getDaysUntilBilling = () => {
    if (!service) return 0;
    
    const now = new Date();
    const billingDay = service.billingDay || 1;
    
    // Crear fecha de facturación para este mes
    let billingDate = new Date(now.getFullYear(), now.getMonth(), Math.min(billingDay, 28));
    
    // Si ya pasó la fecha de facturación de este mes, usar el próximo mes
    if (now > billingDate) {
      billingDate = new Date(now.getFullYear(), now.getMonth() + 1, Math.min(billingDay, 28));
    }
    
    // Calcular diferencia en días
    const diffTime = billingDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const daysUntilBilling = getDaysUntilBilling();

  // Renderizar alerta de estado
  const renderBillingAlert = () => {
    if (service?.status !== 'active') return null;
    
    if (isPendingThisMonth) {
      return (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-800 font-semibold">
            {hasPendingBills ? 'Factura pendiente' : 'Pendiente de facturar'}
          </AlertTitle>
          <AlertDescription className="text-yellow-700">
            {hasPendingBills 
              ? `Tienes una factura pendiente de pago para este mes.`
              : `El servicio debe ser facturado este mes.`}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (isUpcoming) {
      return (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertTriangle className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-800 font-semibold">
            Próximo vencimiento
          </AlertTitle>
          <AlertDescription className="text-blue-700">
            La próxima factura vence en <span className="font-bold">{daysUntilBilling} días</span>.
            {daysUntilBilling <= 3 && ' ¡No olvides realizar el pago a tiempo!'}
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">{service.name}</h1>
        <div className="ml-4">{getStatusBadge(service.status)}</div>
      </div>
      
      {/* Mostrar alerta de estado */}
      {renderBillingAlert()}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
              <p>{service.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Monto Mensual</h3>
              <p className="text-xl font-bold">{formatCurrency(service.amount, service.currency)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Día de Facturación</h3>
              <p>Día {service.billingDay} de cada mes</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Próxima Facturación</h3>
              <p>{formatDate(service.nextBillingDate)}</p>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Creado</h3>
              <p>{formatDate(service.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Última Actualización</h3>
              <p>{formatDate(service.updatedAt)}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4 gap-2">
            {/* Botones de acción como iconos */}
            <div className="flex gap-2">
              {/* Botón de activar/desactivar */}
              <Button 
                variant={service.status === 'active' ? 'destructive' : 'default'} 
                onClick={handleToggleStatus}
                disabled={processingAction}
                size="icon"
                className="h-10 w-10"
                title={service.status === 'active' ? 'Desactivar' : 'Activar'}
              >
                {service.status === 'active' ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
              </Button>
              
              {/* Botón de editar */}
              <Button 
                variant="outline" 
                onClick={() => router.push(`/dashboard/servicios-recurrentes/${service.id}/editar`)}
                disabled={processingAction}
                size="icon"
                className="h-10 w-10"
                title="Editar"
              >
                <Edit className="h-5 w-5" />
              </Button>
              
              {/* Botón de eliminar con diálogo de confirmación */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={processingAction}
                    size="icon"
                    className="h-10 w-10"
                    title="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará permanentemente el servicio "{service.name}" y todas sus facturas asociadas. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteService} className="bg-red-600 hover:bg-red-700">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Historial de Facturación</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">Pendientes</TabsTrigger>
                <TabsTrigger value="paid">Pagadas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                {getPendingBillings().length > 0 ? (
                  <div className="space-y-4">
                    {getPendingBillings().map((billing) => (
                      <Card key={billing.id}>
                        <CardHeader className="py-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Factura {formatDate(billing.billingDate)}</CardTitle>
                            {getStatusBadge(billing.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Monto</h3>
                              <p className="font-semibold">{formatCurrency(billing.amount, service.currency)}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Vencimiento</h3>
                              <p className="font-semibold">{formatDate(billing.dueDate)}</p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="py-4">
                          <Button 
                            variant="default" 
                            className="w-full justify-center"
                            onClick={() => handleMarkAsPaid(billing.id)}
                            disabled={processingAction}
                            size="lg"
                          >
                            <DollarSign className="mr-2 h-5 w-5" />
                            Marcar como Pagado
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay facturas pendientes</h3>
                      <p className="text-gray-500">Todas las facturas de este servicio están pagadas.</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="paid">
                {getPaidBillings().length > 0 ? (
                  <div className="space-y-4">
                    {getPaidBillings().map((billing) => (
                      <Card key={billing.id}>
                        <CardHeader className="py-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Factura {formatDate(billing.billingDate)}</CardTitle>
                            {getStatusBadge(billing.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Monto</h3>
                              <p className="font-semibold">{formatCurrency(billing.amount, service.currency)}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Fecha de Pago</h3>
                              <p className="font-semibold">{formatDate(billing.paymentDate)}</p>
                            </div>
                          </div>
                          {billing.notes && (
                            <div className="mt-4">
                              <h3 className="text-sm font-medium text-gray-500">Notas</h3>
                              <p>{billing.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay facturas pagadas</h3>
                      <p className="text-gray-500">Aún no se ha registrado ningún pago para este servicio.</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
