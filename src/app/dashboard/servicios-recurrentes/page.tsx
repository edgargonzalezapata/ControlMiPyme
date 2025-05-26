"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  getCompanyRecurringServices, 
  getCompanyServiceBillings,
  generatePendingInvoices
} from '@/lib/recurringServiceService';
import type { RecurringService, ServiceBilling } from '@/lib/recurringServiceTypes';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { initializeFirestoreCollections } from '@/lib/initializeFirestore';

export default function RecurringServicesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { activeCompanyDetails: currentCompany } = useActiveCompany();
  const [services, setServices] = useState<RecurringService[]>([]);
  const [billings, setBillings] = useState<ServiceBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingInvoices, setGeneratingInvoices] = useState(false);

  // Estado para el mensaje de inicialización
  const [initMessage, setInitMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Inicializar Firestore
  useEffect(() => {
    const initialize = async () => {
      setIsInitializing(true);
      const result = await initializeFirestoreCollections();
      
      if (!result.success) {
        setInitMessage(result.message);
        setLoading(false);
      } else {
        setInitMessage(null);
        if (currentCompany?.id) {
          loadData();
        } else {
          setLoading(false);
        }
      }
      setIsInitializing(false);
    };
    
    initialize();
  }, []);

  // Cargar datos cuando cambia la empresa
  useEffect(() => {
    if (!isInitializing && !initMessage && currentCompany?.id) {
      loadData();
    }
  }, [currentCompany, isInitializing, initMessage]);

  const loadData = async () => {
    if (!currentCompany?.id) return;
    
    setLoading(true);
    try {
      // Cargar servicios recurrentes
      console.log('Buscando servicios recurrentes para la empresa:', currentCompany.id);
      const servicesResult = await getCompanyRecurringServices(currentCompany.id);
      console.log('Resultado de servicios recurrentes:', servicesResult);
      
      if (!('error' in servicesResult)) {
        console.log(`Se encontraron ${servicesResult.length} servicios recurrentes`);
        setServices(servicesResult);
        
        // Verificar si hay servicios para facturar
        if (servicesResult.length > 0) {
          console.log('Ejemplo de servicio:', {
            id: servicesResult[0].id,
            name: servicesResult[0].name,
            billingDay: servicesResult[0].billingDay,
            status: servicesResult[0].status
          });
        }
      } else {
        console.error('Error al cargar servicios recurrentes:', servicesResult.error);
        toast({
          title: "Error",
          description: servicesResult.error,
          variant: "destructive",
        });
      }

          // Cargar facturaciones
      console.log('Cargando facturaciones para la empresa:', currentCompany.id);
      try {
        const billingsResult = await getCompanyServiceBillings(currentCompany.id);
        console.log('Resultado de facturaciones:', billingsResult);
        
        if (!('error' in billingsResult)) {
          console.log(`Se encontraron ${billingsResult.length} facturaciones`);
          
          if (billingsResult.length > 0) {
            console.log('Estados de facturaciones:', billingsResult.map(b => ({
              id: b.id,
              status: b.status,
              billingDate: b.billingDate?.toDate ? b.billingDate.toDate().toISOString() : b.billingDate,
              dueDate: b.dueDate?.toDate ? b.dueDate.toDate().toISOString() : b.dueDate,
              amount: b.amount,
              currency: b.currency
            })));
          }
          
          setBillings(billingsResult);
          
          // Verificar facturas vencidas
          const overdue = billingsResult.filter(b => b.status === 'overdue');
          console.log(`Facturas vencidas: ${overdue.length}`);
          
          if (overdue.length === 0 && billingsResult.length === 0) {
            console.log('No se encontraron facturas. Verificando si hay servicios para facturar...');
            const servicesResult = await getCompanyRecurringServices(currentCompany.id);
            if (!('error' in servicesResult) && servicesResult.length > 0) {
              console.log(`Se encontraron ${servicesResult.length} servicios. Se pueden generar facturas.`);
              
              // Intentar generar facturas pendientes
              try {
                console.log('Generando facturas pendientes...');
                const generationResult = await generatePendingInvoices(currentCompany.id);
                
                if ('error' in generationResult) {
                  console.error('Error al generar facturas pendientes:', generationResult.error);
                } else {
                  console.log(`Se generaron ${generationResult.generated} facturas pendientes`);
                  
                  // Recargar las facturaciones después de generarlas
                  const updatedBillings = await getCompanyServiceBillings(currentCompany.id);
                  if (!('error' in updatedBillings)) {
                    setBillings(updatedBillings);
                  }
                }
              } catch (error) {
                console.error('Error al generar facturas pendientes:', error);
              }
            }
          }
        } else {
          console.error('Error al cargar facturaciones:', billingsResult.error);
          toast({
            title: "Error",
            description: billingsResult.error,
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error('Excepción al cargar facturaciones:', error);
        toast({
          title: "Error",
          description: `Error inesperado al cargar facturaciones: ${error.message}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cargar datos: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoices = async () => {
    if (!currentCompany?.id) return;
    
    setGeneratingInvoices(true);
    try {
      console.log('Verificando servicios para facturar...');
      const services = await getCompanyRecurringServices(currentCompany.id);
      
      if ('error' in services) {
        toast({
          title: "Error",
          description: `Error al verificar servicios: ${services.error}`,
          variant: "destructive",
        });
        return;
      }
      
      if (services.length === 0) {
        toast({
          title: "Sin servicios",
          description: "No hay servicios recurrentes configurados para facturar.",
          variant: "default",
        });
        return;
      }
      
      console.log('Generando facturas pendientes para la empresa:', currentCompany.id);
      const result = await generatePendingInvoices(currentCompany.id);
      console.log('Resultado de generación de facturas:', result);
      
      if ('generated' in result) {
        if (result.generated > 0) {
          toast({
            title: "¡Éxito!",
            description: `Se generaron ${result.generated} facturas pendientes.`,
          });
        } else {
          toast({
            title: "Sin facturas nuevas",
            description: "No se encontraron facturas pendientes por generar para este período.",
            variant: "default",
          });
        }
        
        // Recargar datos
        await loadData();
      } else {
        console.error('Error al generar facturas:', result.error);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al generar facturas: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setGeneratingInvoices(false);
    }
  };

  const getPendingBillings = () => {
    console.log('Buscando facturas pendientes. Total facturas:', billings.length);
    const pending = billings.filter(billing => billing.status === 'pending');
    console.log('Facturas pendientes encontradas:', pending.length);
    if (pending.length > 0) {
      console.log('Detalles de facturas pendientes:', pending.map(p => ({
        id: p.id,
        status: p.status,
        serviceId: p.serviceId,
        amount: p.amount,
        dueDate: p.dueDate?.toDate ? p.dueDate.toDate().toISOString() : p.dueDate
      })));
    }
    return pending;
  };

  const getOverdueBillings = () => {
    console.log('Buscando facturas vencidas. Total facturas:', billings.length);
    const overdue = billings.filter(billing => billing.status === 'overdue');
    console.log('Facturas vencidas encontradas:', overdue.length);
    if (overdue.length > 0) {
      console.log('Detalles de facturas vencidas:', overdue.map(o => ({
        id: o.id,
        status: o.status,
        serviceId: o.serviceId,
        amount: o.amount,
        dueDate: o.dueDate?.toDate ? o.dueDate.toDate().toISOString() : o.dueDate
      })));
    }
    return overdue;
  };

  const getPaidBillings = () => {
    return billings.filter(billing => billing.status === 'paid');
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Servicios Recurrentes</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleGenerateInvoices}
            disabled={generatingInvoices || loading || !!initMessage}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Generar Facturas Pendientes
          </Button>
          <Button 
            onClick={() => router.push('/dashboard/servicios-recurrentes/nuevo')}
            disabled={!!initMessage}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Servicio
          </Button>
        </div>
      </div>
      
      {initMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{initMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Servicios Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {services.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Facturas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {getPendingBillings().length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Facturas Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {getOverdueBillings().length}
            </div>
          </CardContent>
        </Card>
      </div>

      {(getPendingBillings().length > 0 || getOverdueBillings().length > 0) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded shadow-md">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h3 className="text-yellow-800 font-semibold text-lg">Facturas Pendientes</h3>
              <div className="mt-1 text-yellow-700">
                {getOverdueBillings().length > 0 && (
                  <p className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    {getOverdueBillings().length} factura(s) vencida(s) que requieren atención inmediata
                  </p>
                )}
                {getPendingBillings().length > 0 && (
                  <p className="flex items-center mt-1">
                    <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                    {getPendingBillings().length} factura(s) pendiente(s) de pago
                  </p>
                )}
              </div>
              {getOverdueBillings().length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 bg-white hover:bg-yellow-100 text-yellow-800 border-yellow-400"
                  onClick={() => document.getElementById('pending-billings-tab')?.click()}
                >
                  Ver facturas vencidas
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="services">
        <TabsList className="mb-4">
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger id="pending-billings-tab" value="pending">
            <div className="flex items-center">
              Facturas Pendientes
              {(getPendingBillings().length > 0 || getOverdueBillings().length > 0) && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  {getPendingBillings().length + getOverdueBillings().length}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="paid">
            <div className="flex items-center">
              Facturas Pagadas
              {getPaidBillings().length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {getPaidBillings().length}
                </span>
              )}
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="services">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p>Cargando servicios...</p>
            ) : services.length > 0 ? (
              services.map((service) => (
                <Card key={service.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/dashboard/servicios-recurrentes/${service.id}`)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{service.name}</CardTitle>
                      {getStatusBadge(service.status)}
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Monto Mensual:</span>
                      <span className="font-semibold">{formatCurrency(service.amount, service.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Próxima Facturación:</span>
                      <span className="font-semibold">{formatDate(service.nextBillingDate)}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <div className="text-sm text-gray-500">
                      Día de facturación: {service.billingDay}
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <div className="flex flex-col items-center justify-center">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay servicios recurrentes</h3>
                  <p className="text-gray-500 mb-4">Crea tu primer servicio recurrente para empezar a gestionar tus facturaciones mensuales.</p>
                  <Button onClick={() => router.push('/dashboard/servicios-recurrentes/nuevo')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Servicio
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="pending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p>Cargando facturas pendientes...</p>
            ) : getPendingBillings().length > 0 ? (
              getPendingBillings().map((billing) => (
                <Card key={billing.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/dashboard/servicios-recurrentes/factura/${billing.id}`)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>
                        {services.find(s => s.id === billing.serviceId)?.name || 'Servicio'}
                      </CardTitle>
                      {getStatusBadge(billing.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Monto:</span>
                      <span className="font-semibold">{formatCurrency(billing.amount, currentCompany?.currency || 'CLP')}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Fecha de Facturación:</span>
                      <span className="font-semibold">{formatDate(billing.billingDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Fecha de Vencimiento:</span>
                      <span className="font-semibold">{formatDate(billing.dueDate)}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button variant="outline" className="w-full" onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/servicios-recurrentes/factura/${billing.id}/pagar`);
                    }}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Marcar como Pagado
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <div className="flex flex-col items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay facturas pendientes</h3>
                  <p className="text-gray-500">Todas tus facturas están al día.</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="paid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p>Cargando facturas pagadas...</p>
            ) : getPaidBillings().length > 0 ? (
              getPaidBillings().map((billing) => (
                <Card key={billing.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/dashboard/servicios-recurrentes/factura/${billing.id}`)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>
                        {services.find(s => s.id === billing.serviceId)?.name || 'Servicio'}
                      </CardTitle>
                      {getStatusBadge(billing.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Monto:</span>
                      <span className="font-semibold">{formatCurrency(billing.amount, currentCompany?.currency || 'CLP')}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Fecha de Facturación:</span>
                      <span className="font-semibold">{formatDate(billing.billingDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Fecha de Pago:</span>
                      <span className="font-semibold">{formatDate(billing.paymentDate)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <div className="flex flex-col items-center justify-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay facturas pagadas</h3>
                  <p className="text-gray-500">Aún no has registrado pagos de facturas.</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
