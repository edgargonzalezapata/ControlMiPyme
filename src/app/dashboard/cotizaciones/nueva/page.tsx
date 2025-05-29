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
import { crearCotizacion, generarNumeroCotizacion, ItemCotizacion } from '@/lib/services/cotizacionService';

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

export default function NuevaCotizacionPage() {
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Cargar datos de clientes desde Firebase
  useEffect(() => {
    // En una implementación real, cargaríamos los clientes desde Firebase
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
    
    cargarClientes();
    
    // Agregar un item vacío por defecto
    addNewItem();
  }, []);
  
  // Función para agregar un nuevo item
  const addNewItem = () => {
    const newItem: FormItemCotizacion = {
      id: Date.now().toString(),
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      impuesto: 19, // IVA por defecto en Chile
      total: 0
    };
    
    setItems([...items, newItem]);
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
    
    if (!user?.uid || !activeCompanyId) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario o la empresa",
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
      
      // Generar número de cotización
      const numero = await generarNumeroCotizacion(activeCompanyId);
      
      // Crear la cotización
      const cotizacionData = {
        numero,
        clienteId: clienteSeleccionado,
        clienteNombre: cliente.nombre,
        clienteRut: cliente.rut,
        clienteEmail: cliente.email,
        fecha: new Date(),
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
        estado: 'pendiente' as const,
        observaciones,
        empresaId: activeCompanyId,
        creadoPor: user.uid,
      };
      
      // Guardar en Firebase
      await crearCotizacion(cotizacionData);
      
      toast({
        title: "¡Éxito!",
        description: "La cotización ha sido creada exitosamente",
      });
      
      // Redirigir al listado de cotizaciones
      router.push('/dashboard/cotizaciones');
    } catch (error) {
      console.error('Error al guardar la cotización:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la cotización",
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
              Debe seleccionar una empresa para crear cotizaciones.
            </CardDescription>
          </CardHeader>
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
          <h1 className="text-2xl font-bold">Nueva Cotización</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Información de la Cotización</CardTitle>
            <CardDescription>
              Complete los datos para crear una nueva cotización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Select value={clienteSeleccionado} onValueChange={setClienteSeleccionado}>
                    <SelectTrigger id="cliente">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nombre} ({cliente.rut})
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
                    min="1"
                    value={validez}
                    onChange={(e) => setValidez(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Ingrese observaciones o condiciones especiales"
                  className="min-h-[120px]"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Items de la Cotización</h3>
                <Button onClick={addNewItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Item
                </Button>
              </div>
              
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-md">
                    <div className="col-span-12 md:col-span-5 space-y-1">
                      <Label htmlFor={`descripcion-${item.id}`}>Descripción</Label>
                      <Input
                        id={`descripcion-${item.id}`}
                        value={item.descripcion}
                        onChange={(e) => updateItem(item.id, 'descripcion', e.target.value)}
                        placeholder="Descripción del servicio"
                      />
                    </div>
                    
                    <div className="col-span-4 md:col-span-2 space-y-1">
                      <Label htmlFor={`cantidad-${item.id}`}>Cantidad</Label>
                      <Input
                        id={`cantidad-${item.id}`}
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => updateItem(item.id, 'cantidad', Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="col-span-8 md:col-span-2 space-y-1">
                      <Label htmlFor={`precio-${item.id}`}>Precio Unitario</Label>
                      <Input
                        id={`precio-${item.id}`}
                        type="number"
                        min="0"
                        value={item.precioUnitario}
                        onChange={(e) => updateItem(item.id, 'precioUnitario', Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="col-span-4 md:col-span-1 space-y-1">
                      <Label htmlFor={`impuesto-${item.id}`}>IVA %</Label>
                      <Input
                        id={`impuesto-${item.id}`}
                        type="number"
                        min="0"
                        max="100"
                        value={item.impuesto}
                        onChange={(e) => updateItem(item.id, 'impuesto', Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="col-span-6 md:col-span-1 space-y-1">
                      <Label>Total</Label>
                      <div className="h-10 flex items-center px-3 border rounded-md bg-gray-50 dark:bg-gray-900">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                    
                    <div className="col-span-2 md:col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col space-y-2 items-end pt-4">
                <div className="flex justify-between w-full max-w-xs">
                  <span className="text-sm">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs">
                  <span className="text-sm">Impuestos:</span>
                  <span className="font-medium">{formatCurrency(impuestos)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs border-t pt-2">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
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
                  Guardar Cotización
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
