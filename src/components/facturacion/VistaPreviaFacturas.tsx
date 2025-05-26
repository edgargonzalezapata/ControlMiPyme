'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, X } from 'lucide-react';
import { Factura } from '@/lib/parseFacturasTxt';

interface VistaPreviaFacturasProps {
  facturas: Factura[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function VistaPreviaFacturas({
  facturas,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: VistaPreviaFacturasProps) {
  if (facturas.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vista previa de facturas a importar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {facturas.map((factura, index) => (
            <div key={`${factura.folio}-${index}`} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Factura #{factura.folio}</h3>
                    <p className="text-sm text-muted-foreground">
                      {factura.razonSocialReceptor} • {factura.fechaEmision}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${Number(factura.totalMontoTotal).toLocaleString('es-CL')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {factura.detalles.length} {factura.detalles.length === 1 ? 'ítem' : 'ítems'}
                    </p>
                  </div>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factura.detalles.map((detalle, detalleIndex) => (
                    <TableRow key={detalleIndex}>
                      <TableCell>
                        {detalle.descripcion || detalle.nombre || 'Sin descripción'}
                        {detalle.codigo && (
                          <p className="text-xs text-muted-foreground">Código: {detalle.codigo}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{detalle.cantidad}</TableCell>
                      <TableCell className="text-right">
                        ${Math.round(Number(detalle.precioUnitario || detalle.precio)).toLocaleString('es-CL')}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Math.round(Number(detalle.montoTotal || detalle.montoItem || (detalle.cantidad * (detalle.precioUnitario || detalle.precio)))).toLocaleString('es-CL')}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Fila de totales */}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">Neto</TableCell>
                    <TableCell className="text-right">
                      ${Number(factura.totalNeto || 0).toLocaleString('es-CL')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">IVA</TableCell>
                    <TableCell className="text-right">
                      ${Number(factura.totalIva || 0).toLocaleString('es-CL')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">Total</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${Number(factura.totalMontoTotal || 0).toLocaleString('es-CL')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : `Guardar ${facturas.length} facturas`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
