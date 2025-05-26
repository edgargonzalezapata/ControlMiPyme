'use client';

import { X, Printer, Download, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FacturaConEstado } from '@/types/factura';

interface FacturaDetalleProps {
  factura: FacturaConEstado | null;
  onClose: () => void;
  onCambiarEstado?: (nuevoEstado: string) => void;
}

interface AccionEstado {
  label: string;
  estado: EstadoFactura;
}

interface ConfiguracionEstado {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  acciones: AccionEstado[];
}

const estadoConfig: Record<EstadoFactura, ConfiguracionEstado> = {
  pendiente: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Pendiente',
    acciones: [
      { label: 'Marcar como Pagada', estado: 'pagada' },
      { label: 'Marcar como Anulada', estado: 'anulada' },
      { label: 'Marcar como Rechazada', estado: 'rechazada' }
    ]
  },
  pagada: {
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800',
    label: 'Pagada',
    acciones: [
      { label: 'Marcar como Pendiente', estado: 'pendiente' },
      { label: 'Marcar como Anulada', estado: 'anulada' }
    ]
  },
  vencida: {
    icon: AlertCircle,
    color: 'bg-red-100 text-red-800',
    label: 'Vencida',
    acciones: [
      { label: 'Marcar como Pagada', estado: 'pagada' },
      { label: 'Marcar como Pendiente', estado: 'pendiente' }
    ]
  },
  anulada: {
    icon: XCircle,
    color: 'bg-gray-100 text-gray-800',
    label: 'Anulada',
    acciones: [
      { label: 'Marcar como Pendiente', estado: 'pendiente' },
      { label: 'Marcar como Pagada', estado: 'pagada' }
    ]
  },
  rechazada: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    label: 'Rechazada',
    acciones: [
      { label: 'Marcar como Pendiente', estado: 'pendiente' },
      { label: 'Marcar como Anulada', estado: 'anulada' }
    ]
  },
  enviada: {
    icon: CheckCircle2,
    color: 'bg-blue-100 text-blue-800',
    label: 'Enviada',
    acciones: [
      { label: 'Marcar como Pagada', estado: 'pagada' },
      { label: 'Marcar como Pendiente', estado: 'pendiente' }
    ]
  }
};

export function FacturaDetalle({ factura, onClose, onCambiarEstado }: FacturaDetalleProps) {
  if (!factura) return null;

  const config = estadoConfig[factura.estado] || {
    icon: FileText,
    color: 'bg-gray-100 text-gray-800',
    label: factura.estado,
    acciones: []
  };
  const EstadoIcon = config.icon;

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'No especificada';
    
    try {
      let date: Date;
      
      if (typeof dateString === 'string') {
        // Manejar formato chileno DD-MM-YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
          const [day, month, year] = dateString.split('-').map(Number);
          date = new Date(year, month - 1, day);
        } 
        // Manejar formato ISO 8601 (2023-05-24T00:00:00)
        else if (dateString.includes('T')) {
          date = new Date(dateString);
        } 
        // Manejar otros formatos de fecha
        else {
          // Intentar con el constructor de Date
          const timestamp = Date.parse(dateString);
          if (!isNaN(timestamp)) {
            date = new Date(timestamp);
          } else {
            // Si no se puede parsear, intentar dividir por / o -
            const dateParts = dateString.split(/[-/]/);
            if (dateParts.length === 3) {
              const [d, m, y] = dateParts.map(Number);
              date = new Date(y, m - 1, d);
            } else {
              throw new Error('Formato de fecha no reconocido');
            }
          }
        }
      } else {
        // Si ya es un objeto Date
        date = dateString;
      }
      
      // Validar que la fecha sea válida
      if (isNaN(date.getTime())) {
        throw new Error('Fecha inválida');
      }
      
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
      
    } catch (e) {
      console.error('Error al formatear fecha:', e, 'Valor original:', dateString);
      return `Fecha inválida (${dateString})`;
    }
  };

  const formatCurrency = (amount?: number | string) => {
    if (amount === undefined || amount === null) return '$0';
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(value)) return '$0';
    
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Dialog open={!!factura} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl">Factura #{factura.folio}</DialogTitle>
              <div className="flex items-center mt-2">
                <Badge className={`${config.color} hover:${config.color} flex items-center gap-1`}>
                  <EstadoIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
                <span className="text-sm text-muted-foreground ml-4">
                  Emitida el {formatDate(factura.fechaEmision)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6">
          <div className="md:col-span-2 space-y-8">
            <div>
              <h3 className="font-semibold mb-2">Detalle de la Factura</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Descripción</th>
                      <th className="text-right p-3 text-sm font-medium">Cantidad</th>
                      <th className="text-right p-3 text-sm font-medium">Precio Unit.</th>
                      <th className="text-right p-3 text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factura.detalles.map((item: any, index: number) => {
                      // Usar item.descripcion si existe, de lo contrario usar item.nombre
                      const descripcion = 'descripcion' in item ? item.descripcion : 
                                       'nombre' in item ? item.nombre : 'Sin descripción';
                      
                      // Manejar diferentes formatos de monto total
                      const montoTotal = 'montoTotal' in item ? item.montoTotal : 
                                       'montoItem' in item ? item.montoItem : 0;
                      
                      // Manejar diferentes formatos de precio unitario
                      const precioUnitario = 'precioUnitario' in item ? item.precioUnitario :
                                         'precio' in item ? item.precio : 
                                         montoTotal / (item.cantidad || 1);
                      
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-3">
                            <div className="font-medium">{descripcion}</div>
                            {'codigo' in item && item.codigo && (
                              <div className="text-xs text-muted-foreground">Código: {item.codigo}</div>
                            )}
                          </td>
                          <td className="p-3 text-right">{item.cantidad || 1}</td>
                          <td className="p-3 text-right">{formatCurrency(precioUnitario)}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(montoTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Notas</h4>
              <p className="text-sm text-muted-foreground">
                {factura.notas || 'No hay notas adicionales para esta factura.'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(factura.montoNeto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (19%)</span>
                  <span>{formatCurrency(factura.iva)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(factura.montoTotal)}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Información</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Tipo de DTE</div>
                  <div>{factura.tipoDTE === '33' ? 'Factura Electrónica' : factura.tipoDTE}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Folio</div>
                  <div>{factura.folio}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Fecha de Emisión</div>
                  <div>{formatDate(factura.fechaEmision)}</div>
                </div>
                {factura.fechaVencimiento && (
                  <div>
                    <div className="text-muted-foreground">Fecha de Vencimiento</div>
                    <div className={new Date(factura.fechaVencimiento) < new Date() ? 'text-red-500 font-medium' : ''}>
                      {formatDate(factura.fechaVencimiento)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Empresas</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Emisor</h4>
                  <div className="text-sm">
                    <div className="font-medium">
                      {factura.razonSocialEmisor || 'No especificado'}
                      {factura.direccionEmisor && (
                        <div className="text-muted-foreground font-normal">
                          {factura.direccionEmisor}
                        </div>
                      )}
                      {(factura.comunaEmisor || factura.ciudadEmisor) && (
                        <div className="text-muted-foreground font-normal">
                          {[factura.comunaEmisor, factura.ciudadEmisor].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                    {factura.rutEmisor && (
                      <div className="mt-1">
                        <span className="font-medium">RUT:</span> {factura.rutEmisor}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Receptor</h4>
                  <div className="text-sm">
                    <div className="font-medium">
                      {factura.razonSocialReceptor || 'No especificado'}
                      {factura.direccionReceptor && (
                        <div className="text-muted-foreground font-normal">
                          {factura.direccionReceptor}
                        </div>
                      )}
                      {(factura.comunaReceptor || factura.ciudadReceptor) && (
                        <div className="text-muted-foreground font-normal">
                          {[factura.comunaReceptor, factura.ciudadReceptor].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                    {factura.rutReceptor && (
                      <div className="mt-1">
                        <span className="font-medium">RUT:</span> {factura.rutReceptor}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {onCambiarEstado && config.acciones?.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Acciones</h3>
                <div className="space-y-2">
                  {config.acciones?.map((accion: AccionEstado, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => onCambiarEstado(accion.estado)}
                    >
                      {accion.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
