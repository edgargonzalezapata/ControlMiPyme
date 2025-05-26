'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, FileText, CheckCircle2, Clock, XCircle, AlertCircle, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getFacturaById, updateFactura } from '@/lib/facturaService';
import { FacturaConEstado, EstadoFactura } from '@/types/factura';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function FacturaDetallePage() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();
  const [factura, setFactura] = useState<FacturaConEstado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState<EstadoFactura | null>(null);
  const [fechaPago, setFechaPago] = useState<string>('');
  const [showFechaPago, setShowFechaPago] = useState(false);

  const estadoConfig: Record<EstadoFactura, {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    label: string;
    requiresFechaPago?: boolean;
  }> = {
    pendiente: {
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Pendiente',
      requiresFechaPago: false
    },
    pagada: {
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-800',
      label: 'Pagada',
      requiresFechaPago: true
    },
    vencida: {
      icon: AlertCircle,
      color: 'bg-red-100 text-red-800',
      label: 'Vencida',
      requiresFechaPago: false
    },
    anulada: {
      icon: XCircle,
      color: 'bg-gray-100 text-gray-800',
      label: 'Anulada',
      requiresFechaPago: false
    },
    rechazada: {
      icon: XCircle,
      color: 'bg-red-100 text-red-800',
      label: 'Rechazada',
      requiresFechaPago: false
    },
    enviada: {
      icon: CheckCircle2,
      color: 'bg-blue-100 text-blue-800',
      label: 'Enviada',
      requiresFechaPago: false
    }
  };

  useEffect(() => {
    const loadFactura = async () => {
      if (!id) {
        console.error('No se proporcionó un ID de factura');
        return;
      }
      
      console.log('Cargando factura con ID:', id);
      
      try {
        setIsLoading(true);
        console.log('Iniciando carga de factura...');
        
        const result = await getFacturaById(id as string);
        console.log('Resultado de getFacturaById:', result);
        
        if ('error' in result) {
          console.error('Error en la respuesta de getFacturaById:', result.error);
          throw new Error(result.error);
        }
        
        console.log('Factura cargada correctamente:', result);
        setFactura(result);
        setSelectedEstado(result.estado);
        
        if (result.fechaPago) {
          setFechaPago(result.fechaPago.substring(0, 10)); // Formato YYYY-MM-DD para el input date
        }
      } catch (error) {
        console.error('Error cargando factura:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la factura. Por favor, inténtalo de nuevo.',
          variant: 'destructive',
        });
        router.push('/dashboard/facturacion/lista');
      } finally {
        console.log('Finalizando carga de factura');
        setIsLoading(false);
      }
    };
    
    loadFactura();
  }, [id, router, toast]);
  
  // Efecto para mostrar/ocultar el campo de fecha de pago según el estado seleccionado
  useEffect(() => {
    if (selectedEstado && estadoConfig[selectedEstado].requiresFechaPago) {
      setShowFechaPago(true);
    } else {
      setShowFechaPago(false);
    }
  }, [selectedEstado]);

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return format(date, 'PPP', { locale: es });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };



  // Referencia al contenido de la factura para imprimir/exportar
  const facturaRef = useRef<HTMLDivElement>(null);

  // Función para manejar la descarga del PDF
  const handleDescargarPDF = () => {
    // Guardar la configuración actual de la página
    const originalTitle = document.title;
    const originalBodyStyle = document.body.style.cssText;
    
    // Configurar para impresión
    document.title = `Factura ${factura?.folio || 'sin-folio'}`;
    
    // Crear estilos para impresión
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #factura-para-imprimir, #factura-para-imprimir * {
          visibility: visible;
        }
        #factura-para-imprimir {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          size: letter;
          margin: 0.5cm;
        }
        /* Ajustes para que quepa en una hoja */
        #factura-para-imprimir {
          font-size: 12px;
        }
        #factura-para-imprimir h1 {
          font-size: 18px;
          margin-bottom: 5px;
        }
        #factura-para-imprimir .card {
          margin-bottom: 8px;
        }
        #factura-para-imprimir .space-y-6 {
          gap: 8px;
        }
        #factura-para-imprimir table {
          font-size: 10px;
        }
        /* Ocultar elementos no necesarios para impresión */
        #factura-para-imprimir button,
        #factura-para-imprimir [role="tablist"],
        #factura-para-imprimir .print-hide {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Imprimir como PDF
    window.print();
    
    // Restaurar configuración
    document.title = originalTitle;
    document.body.style.cssText = originalBodyStyle;
    document.head.removeChild(style);
  };

  // Función para manejar la impresión
  const handleImprimir = () => {
    window.print();
  };

  // Función para manejar el cambio de estado
  const handleEstadoChange = (estado: EstadoFactura) => {
    setSelectedEstado(estado);
  };
  
  // Función para guardar el cambio de estado
  const handleGuardarEstado = async () => {
    if (!factura || !selectedEstado || !id) return;
    
    setIsSaving(true);
    
    try {
      // Preparar los datos a actualizar
      const updates: Partial<FacturaConEstado> = {
        estado: selectedEstado
      };
      
      // Si el estado es 'pagada', incluir la fecha de pago
      if (selectedEstado === 'pagada' && fechaPago) {
        updates.fechaPago = fechaPago;
      } else if (selectedEstado !== 'pagada') {
        // Si cambia a otro estado que no sea pagada, eliminar la fecha de pago
        updates.fechaPago = null;
      }
      
      // Actualizar la factura en la base de datos
      const result = await updateFactura(id as string, updates);
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      // Actualizar la factura en el estado local
      setFactura(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: 'Estado actualizado',
        description: `La factura ahora está ${estadoConfig[selectedEstado].label.toLowerCase()}.`,
      });
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la factura.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Factura no encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">
          La factura que estás buscando no existe o no tienes permiso para verla.
        </p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/facturacion/lista')}>
          Volver a la lista
        </Button>
      </div>
    );
  }

  const EstadoIcon = estadoConfig[factura.estado].icon;
  const estadoInfo = estadoConfig[factura.estado];

  return (
    <div className="space-y-6 print:space-y-1" ref={facturaRef} id="factura-para-imprimir">
      {/* Controles solo visibles en pantalla */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDescargarPDF}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleImprimir}
            disabled={isLoading}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Encabezado de la factura */}
      <div className="border-b pb-2 mb-3 print:border-b-2 print:border-gray-800">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight print:text-xl">Factura #{factura.folio}</h1>
            <p className="text-muted-foreground print:text-black print:text-sm">
              {factura.tipoDTE} - Fecha: {formatDate(factura.fechaEmision)}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 justify-end mb-1">
              <EstadoIcon className={`h-4 w-4 ${estadoInfo.color.replace('bg-', 'text-').split(' ')[0]}`} />
              <span className="font-medium text-sm">{estadoInfo.label}</span>
            </div>
            <div className="text-xl font-bold print:text-lg">
              {formatCurrency(factura.montoTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Información de emisor y receptor en formato compacto */}
      <div className="grid grid-cols-2 gap-4 print:gap-2 print:text-xs">
        <div className="border rounded-md p-3 print:p-2">
          <h3 className="font-semibold mb-1 print:mb-0.5">Emisor</h3>
          <div>
            <p className="font-medium print:text-xs">{factura.razonSocialEmisor}</p>
            <p className="text-sm text-muted-foreground print:text-xs print:text-black">RUT: {factura.rutEmisor}</p>
            {factura.giroEmisor && (
              <p className="text-sm text-muted-foreground print:text-xs print:text-black">Giro: {factura.giroEmisor}</p>
            )}
            {factura.comunaEmisor && (
              <p className="text-sm text-muted-foreground print:text-xs print:text-black">Comuna: {factura.comunaEmisor}</p>
            )}
          </div>
        </div>

        <div className="border rounded-md p-3 print:p-2">
          <h3 className="font-semibold mb-1 print:mb-0.5">Receptor</h3>
          <div>
            <p className="font-medium print:text-xs">{factura.razonSocialReceptor || 'No especificado'}</p>
            <p className="text-sm text-muted-foreground print:text-xs print:text-black">RUT: {factura.rutReceptor || 'No especificado'}</p>
            {factura.direccionReceptor && (
              <p className="text-sm text-muted-foreground print:text-xs print:text-black">Dirección: {factura.direccionReceptor}</p>
            )}
            {(factura.comunaReceptor || factura.ciudadReceptor) && (
              <p className="text-sm text-muted-foreground print:text-xs print:text-black">
                {[factura.comunaReceptor, factura.ciudadReceptor].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de detalles de la factura */}
      <div className="border rounded-md print:border print:border-gray-400 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 p-2 print:p-1 print:bg-gray-100 border-b">
          <h3 className="font-semibold print:text-sm">Detalles de la Factura</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm print:text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 print:bg-gray-100">
              <tr>
                <th className="text-left p-2 print:p-1 print:font-semibold">Descripción</th>
                <th className="text-right p-2 print:p-1 print:font-semibold">Cantidad</th>
                <th className="text-right p-2 print:p-1 print:font-semibold">Precio Unit.</th>
                <th className="text-right p-2 print:p-1 print:font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {factura.detalles && factura.detalles.length > 0 ? (
                factura.detalles.map((detalle, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="p-2 print:p-1 print:align-top">
                      <div className="font-medium print:font-normal print:text-xs">
                        {detalle.descripcion || detalle.nombre || 'Sin descripción'}
                      </div>
                      {detalle.codigo && (
                        <div className="text-xs text-muted-foreground print:text-[9px] print:text-black">Cód: {detalle.codigo}</div>
                      )}
                    </td>
                    <td className="p-2 print:p-1 text-right">
                      {detalle.cantidad?.toLocaleString('es-CL') || '1'}
                    </td>
                    <td className="p-2 print:p-1 text-right">
                      {formatCurrency(detalle.precioUnitario)}
                    </td>
                    <td className="p-2 print:p-1 text-right font-medium print:font-normal">
                      {formatCurrency(detalle.montoTotal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center p-4 print:p-2 text-muted-foreground print:text-black">
                    No hay detalles disponibles para esta factura
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex flex-col items-end p-3 print:p-1 space-y-1 print:space-y-0 border-t bg-gray-50 dark:bg-gray-800 print:bg-gray-100">
          <div className="flex justify-between w-full max-w-xs print:max-w-[150px] print:text-xs">
            <span className="text-muted-foreground print:text-black">Neto</span>
            <span>{formatCurrency(factura.montoNeto)}</span>
          </div>
          <div className="flex justify-between w-full max-w-xs print:max-w-[150px] print:text-xs">
            <span className="text-muted-foreground print:text-black">IVA</span>
            <span>{formatCurrency(factura.iva)}</span>
          </div>
          <div className="flex justify-between w-full max-w-xs print:max-w-[150px] pt-1 print:pt-0 border-t print:text-xs">
            <span className="font-medium">Total</span>
            <span className="font-bold">
              {formatCurrency(factura.montoTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Información adicional y estado de pago en formato compacto */}
      <div className="grid grid-cols-2 gap-4 print:gap-2 print:text-xs print:mt-1">
        <div className="border rounded-md p-3 print:p-2">
          <h3 className="font-semibold mb-1 print:mb-0.5 print:text-xs">Información Adicional</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 print:gap-0.5">
            <div className="col-span-2 print:col-span-1">
              <p className="text-xs text-muted-foreground print:text-[9px] print:text-black">Tipo de DTE</p>
              <p className="text-sm font-medium print:text-xs print:font-normal">{factura.tipoDTE}</p>
            </div>
            {factura.ordenCompra && (
              <div className="col-span-2 print:col-span-1">
                <p className="text-xs text-muted-foreground print:text-[9px] print:text-black">Orden de Compra</p>
                <p className="text-sm font-medium print:text-xs print:font-normal">{factura.ordenCompra}</p>
              </div>
            )}
            {factura.fechaVencimiento && (
              <div>
                <p className="text-xs text-muted-foreground print:text-[9px] print:text-black">Vencimiento</p>
                <p className="text-sm font-medium print:text-xs print:font-normal">{formatDate(factura.fechaVencimiento)}</p>
              </div>
            )}
            {factura.fechaPago && (
              <div>
                <p className="text-xs text-muted-foreground print:text-[9px] print:text-black">Fecha de Pago</p>
                <p className="text-sm font-medium print:text-xs print:font-normal">{formatDate(factura.fechaPago)}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Sección de estado de pago - solo visible en pantalla, no en impresión */}
        <div className="border rounded-md p-3 print:hidden">
          <h3 className="font-semibold mb-2">Estado de Pago</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Estado actual:</span>
              <Badge className={estadoInfo.color}>
                <EstadoIcon className="h-3.5 w-3.5 mr-1" />
                {estadoInfo.label}
              </Badge>
            </div>
            
            <div className="border-t pt-3 mt-1">
              <Label htmlFor="estado" className="block mb-2 text-sm">Cambiar estado</Label>
              <div className="space-y-3">
                <Select
                  value={selectedEstado || undefined}
                  onValueChange={(value) => handleEstadoChange(value as EstadoFactura)}
                >
                  <SelectTrigger id="estado" className="w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(estadoConfig).map(([value, { label, color }]) => (
                      <SelectItem key={value} value={value} className="flex items-center">
                        <div className="flex items-center">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${color.replace('bg-', 'bg-')}`}></span>
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {showFechaPago && (
                  <div className="space-y-1">
                    <Label htmlFor="fechaPago" className="text-sm">Fecha de pago</Label>
                    <Input
                      id="fechaPago"
                      type="date"
                      value={fechaPago}
                      onChange={(e) => setFechaPago(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
                
                <Button 
                  onClick={handleGuardarEstado} 
                  disabled={isSaving || !selectedEstado || (selectedEstado === factura.estado && (!showFechaPago || fechaPago === factura.fechaPago?.substring(0, 10)))}
                  className="w-full"
                  size="sm"
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 mr-1" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Versión simplificada para impresión */}
        <div className="border rounded-md p-2 hidden print:block">
          <h3 className="font-semibold mb-0.5 text-xs">Observaciones</h3>
          {factura.observaciones ? (
            <p className="text-xs whitespace-pre-line">{factura.observaciones}</p>
          ) : (
            <p className="text-xs italic text-gray-500">Sin observaciones</p>
          )}
        </div>
      </div>
      
      {/* Notas - solo visibles en pantalla */}
      {factura.notas && (
        <div className="border rounded-md p-3 print:hidden">
          <h3 className="font-semibold mb-1">Notas</h3>
          <p className="text-sm whitespace-pre-line">{factura.notas}</p>
        </div>
      )}
      
      {/* Pie de página para impresión */}
      <div className="hidden print:block text-center text-[9px] text-gray-500 mt-4 pt-2 border-t">
        <p>Documento generado por Control MiPyme - {new Date().toLocaleDateString('es-CL')}</p>
      </div>
    </div>
  );
}
