export interface DetalleFactura {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  montoTotal: number;
  descripcion?: string;
  codigo?: string;
  unidadMedida?: string;
  descuento?: number;
  impuestoAdicional?: number;
}

export interface Factura {
  id?: string;
  tipoDTE: string;
  folio: string;
  fechaEmision: string;
  rutEmisor: string;
  rutReceptor: string;
  montoNeto: number;
  iva: number;
  montoTotal: number;
  empresaId: string;
  detalles: DetalleFactura[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // Campos adicionales para compatibilidad
  numeroDocumento?: string;
  tipoDocumento?: string;
  formaPago?: string;
  observaciones?: string;
}

export type EstadoFactura = 'pendiente' | 'pagada' | 'vencida' | 'anulada' | 'rechazada' | 'enviada';

export interface FacturaConEstado extends Omit<Factura, 'createdAt' | 'updatedAt'> {
  estado: EstadoFactura;
  fechaVencimiento?: string;
  fechaPago?: string | null;
  notas?: string;
  razonSocialEmisor?: string;
  giroEmisor?: string;
  razonSocialReceptor?: string;
  direccionEmisor?: string;
  direccionReceptor?: string;
  comunaEmisor?: string;
  comunaReceptor?: string;
  ciudadEmisor?: string;
  ciudadReceptor?: string;
  tipoPago?: string;
  vendedor?: string;
  ordenCompra?: string;
  // Fechas tipadas correctamente
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
