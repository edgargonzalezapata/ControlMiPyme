"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { useAuthContext } from '@/context/AuthProvider';
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { actualizarCotizacion, obtenerCotizacion, Cotizacion, ItemCotizacion } from '@/lib/services/cotizacionService';

// Interfaces para los datos
export interface Cliente {
  id: string;
  nombre: string;
  rut: string;
  email: string;
  direccion?: string;
  telefono?: string;
}

// Local type for form items that includes the id
interface FormItemCotizacion extends Omit<ItemCotizacion, 'id'> {
  id: string;
}

interface PageProps {
  params: {
    cotizacionId: string;
  };
}

export default function EditarCotizacionPage({ params }: PageProps) {
  const { cotizacionId } = params;
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuthContext();
  const { activeCompanyId, activeCompanyDetails } = useActiveCompany();
  
  // Estados para el formulario
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('');
  const [validez, setValidez] = useState<number>(30);
  const [items, setItems] = useState<FormItemCotizacion[]>([]);
  const [observaciones, setObservaciones] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  
  // Cargar datos de la cotización
  useEffect(() => {
    const cargarCotizacion = async () => {
      if (!cotizacionId) return;
      
      try {
        setIsLoading(true);
        const cotizacionData = await obtenerCotizacion(cotizacionId);
        
        if (!cotizacionData) {
          toast({
            title: "Error",
            description: "No se encontró la cotización",
            variant: "destructive"
          });
          router.push('/dashboard/cotizaciones');
          return;
        }
        
        setCotizacion(cotizacionData);
        
        // Cargar datos en el formulario
        setClienteSeleccionado(cotizacionData.clienteId);
        
        // Calcular validez en días
        if (cotizacionData.fechaVencimiento) {
          const fechaCreacion = new Date(cotizacionData.fecha);
          const fechaVencimiento = new Date(cotizacionData.fechaVencimiento);
          const diferenciaDias = Math.ceil((fechaVencimiento.getTime() - fechaCreacion.getTime()) / (1000 * 3600 * 24));
          setValidez(diferenciaDias > 0 ? diferenciaDias : 30);
        }
        
        // Cargar items
        const itemsFormateados: FormItemCotizacion[] = cotizacionData.items.map((item, index) => ({
          id: index.toString(),
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          impuesto: item.impuesto,
          total: item.total
        }));
        
        setItems(itemsFormateados.length > 0 ? itemsFormateados : [getEmptyItem()]);
        
        if (cotizacionData.observaciones) {
          setObservaciones(cotizacionData.observaciones);
        }
        
        // Cargar clientes de ejemplo (en una implementación real, cargaríamos desde Firebase)
        cargarClientes();
        
      } catch (error) {
        console.error('Error al cargar la cotización:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la cotización",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarCotizacion();
  }, [cotizacionId, router, toast]);
  
  // Cargar clientes
  const cargarClientes = async () => {
    try {
      // TODO: Implementar carga de clientes desde Firebase
      const clientesEjemplo: Cliente[] = [
        { 
          id: '1', 
          nombre: 'Empresa ABC', 
          rut: '76.123.456-7', 
          email: 'contacto@empresaabc.cl',
          direccion: 'Av. Principal 123, Santiago',
          telefono: '+56 9 1234 5678'
        },
        { 
          id: '2', 
          nombre: 'Consultora XYZ', 
          rut: '77.987.654-3', 
          email: 'info@consultoraxyz.cl',
          direccion: 'Calle Secundaria 456, Providencia',
          telefono: '+56 9 8765 4321'
        },
      ];
      
      setClientes(clientesEjemplo);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los clientes',
        variant: 'destructive'
      });
    }
  };
  
  // Función para obtener un item vacío
  const getEmptyItem = (): FormItemCotizacion => ({
    id: Date.now().toString(),
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    impuesto: 19, // IVA por defecto en Chile
    total: 0
  });
  
  // Función para agregar un nuevo item
  const addNewItem = () => {
    setItems([...items, getEmptyItem()]);
  };
  
  // Función para eliminar un item
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  // Función para actualizar un item
  const updateItem = (id: string, field: keyof FormItemCotizacion, value: string | number) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalcular el total si se cambió la cantidad o el precio
        if (field === 'cantidad' || field === 'precioUnitario' || field === 'impuesto') {
          const cantidad = field === 'cantidad' ? Number(value) : item.cantidad;
          const precioUnitario = field === 'precioUnitario' ? Number(value) : item.precioUnitario;
          const impuesto = field === 'impuesto' ? Number(value) : item.impuesto;
          
          const subtotal = cantidad * precioUnitario;
          const impuestoValor = subtotal * (impuesto / 100);
          updatedItem.total = subtotal + impuestoValor;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setItems(updatedItems);
  };
  
  // Calcular subtotal (sin impuestos)
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.cantidad * item.precioUnitario);
  }, 0);
  
  // Calcular impuestos
  const impuestos = items.reduce((sum, item) => {
    const itemSubtotal = item.cantidad * item.precioUnitario;
    return sum + (itemSubtotal * (item.impuesto / 100));
  }, 0);
  
  // Calcular total
  const total = subtotal + impuestos;
  
  // Función para formatear montos en pesos chilenos
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Función para guardar la cotización
  const handleSaveCotizacion = async () => {
    if (!clienteSeleccionado) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        variant: "destructive"
      });
      return;
    }
    
    if (items.length === 0 || items.some(item => !item.descripcion || item.cantidad <= 0)) {
      toast({
        title: "Error",
        description: "Verifique los items de la cotización",
        variant: "destructive"
      });
      return;
    }
    
    if (!user?.uid || !activeCompanyId || !cotizacion) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario, la empresa o la cotización",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const cliente = clientes.find(c => c.id === clienteSeleccionado);
      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }
      
      // Actualizar la cotización
      const cotizacionData = {
        clienteId: clienteSeleccionado,
        clienteNombre: cliente.nombre,
        clienteRut: cliente.rut,
        clienteEmail: cliente.email,
        fechaVencimiento: new Date(Date.now() + validez * 24 * 60 * 60 * 1000), // Sumar días a la fecha actual
        items: items.map(item => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          impuesto: item.impuesto,
          total: item.total
        })),
        subtotal,
        impuestos,
        total,
        observaciones,
      };
      
      // Guardar en Firebase
      await actualizarCotizacion(cotizacionId, cotizacionData);
      
      toast({
        title: "¡Éxito!",
        description: "La cotización ha sido actualizada exitosamente",
      });
      
      // Redirigir al listado de cotizaciones
      router.push('/dashboard/cotizaciones');
    } catch (error) {
      console.error('Error al actualizar la cotización:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar la cotización",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!activeCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Seleccione una empresa</CardTitle>
            <CardDescription>
              Debe seleccionar una empresa para editar cotizaciones.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Cargando cotización...</p>
        </div>
      </div>
    );
  }
  
  if (!cotizacion) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Cotización no encontrada</CardTitle>
            <CardDescription>
              La cotización que intenta editar no existe o no tiene permisos para acceder a ella.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard/cotizaciones')}>
              Volver a cotizaciones
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Editar Cotización {cotizacion.numero}</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
            <CardDescription>
              Seleccione el cliente para la cotización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Select 
                  value={clienteSeleccionado} 
                  onValueChange={setClienteSeleccionado}
                  disabled={isLoading}
                >
                  <SelectTrigger id="cliente">
                    <SelectValue placeholder="Seleccione un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre} - {cliente.rut}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="validez">Validez (días)</Label>
                <Input 
                  id="validez" 
                  type="number" 
                  value={validez} 
                  onChange={(e) => setValidez(parseInt(e.target.value) || 30)}
                  min={1}
                  max={90}
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Items de la Cotización</CardTitle>
            <CardDescription>
              Agregue los productos o servicios a cotizar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 sm:col-span-5">
                    <Label htmlFor={`descripcion-${item.id}`}>Descripción</Label>
                    <Input 
                      id={`descripcion-${item.id}`} 
                      value={item.descripcion} 
                      onChange={(e) => updateItem(item.id, 'descripcion', e.target.value)}
                      placeholder="Ej: Desarrollo de sitio web"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label htmlFor={`cantidad-${item.id}`}>Cantidad</Label>
                    <Input 
                      id={`cantidad-${item.id}`} 
                      type="number" 
                      value={item.cantidad} 
                      onChange={(e) => updateItem(item.id, 'cantidad', parseInt(e.target.value) || 0)}
                      min={1}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-8 sm:col-span-2">
                    <Label htmlFor={`precio-${item.id}`}>Precio Unitario</Label>
                    <Input 
                      id={`precio-${item.id}`} 
                      type="number" 
                      value={item.precioUnitario} 
                      onChange={(e) => updateItem(item.id, 'precioUnitario', parseInt(e.target.value) || 0)}
                      min={0}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-1">
                    <Label htmlFor={`impuesto-${item.id}`}>IVA %</Label>
                    <Input 
                      id={`impuesto-${item.id}`} 
                      type="number" 
                      value={item.impuesto} 
                      onChange={(e) => updateItem(item.id, 'impuesto', parseInt(e.target.value) || 0)}
                      min={0}
                      max={100}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-1">
                    <Label>Total</Label>
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1 || isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                onClick={addNewItem}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between py-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>IVA:</span>
                  <span>{formatCurrency(impuestos)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
            <CardDescription>
              Agregue notas o condiciones adicionales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Ej: Precios válidos por 30 días. Forma de pago: 50% al inicio, 50% contra entrega."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push('/dashboard/cotizaciones')}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveCotizacion}
              disabled={isLoading}
              className="ml-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
