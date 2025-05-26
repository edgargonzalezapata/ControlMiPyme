'use client';

import { useState, useEffect } from 'react';
import { ImportarFacturasTxt } from '@/components/facturacion/ImportarFacturasTxt';
import { FacturasList } from '@/components/facturacion/FacturasList';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FacturaConEstado } from '@/types/factura';
import { FacturaDetalle } from '@/components/facturacion/FacturaDetalle';

// Datos de ejemplo - en una aplicación real, estos vendrían de tu API
export const facturasEjemplo: FacturaConEstado[] = [
  {
    id: '1',
    tipoDTE: '33',
    folio: '123',
    fechaEmision: new Date().toISOString(),
    rutEmisor: '76.123.456-7',
    rutReceptor: '12.345.678-9',
    montoNeto: 100000,
    iva: 19000,
    montoTotal: 119000,
    empresaId: 'default',
    detalles: [
      {
        nombre: 'Servicio de desarrollo',
        cantidad: 1,
        precioUnitario: 100000,
        montoTotal: 100000
      }
    ],
    estado: 'pendiente',
    fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export default function FacturacionPage() {
  // Solo mostramos la pestaña de importación
  const [activeTab, setActiveTab] = useState('importar');
  const [facturas, setFacturas] = useState<FacturaConEstado[]>([]);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
    duplicates?: number;
  } | null>(null);

  // Cargar facturas al montar el componente
  useEffect(() => {
    // En una aplicación real, harías una llamada a la API aquí
    setFacturas(facturasEjemplo);
  }, []);

  const handleImportComplete = (facturasImportadas: any[]) => {
    console.log('Facturas importadas:', facturasImportadas);
    
    // Mapear las facturas importadas al formato correcto
    const nuevasFacturas: FacturaConEstado[] = [];
    const facturasDuplicadas: string[] = [];
    
    facturasImportadas.forEach((f, index) => {
      const montoTotal = 'totalMontoTotal' in f ? f.totalMontoTotal : f.montoTotal;
      const montoNeto = 'totalNeto' in f ? f.totalNeto : (montoTotal ? montoTotal / 1.19 : 0);
      const iva = 'totalIva' in f ? f.totalIva : (montoTotal ? montoTotal - montoNeto : 0);
      
      // Generar un ID único para la factura basado en tipoDTE, folio, rutEmisor y fechaEmision
      const facturaId = `${f.tipoDTE || '33'}-${f.folio || 'SIN-FOLIO'}-${f.rutEmisor || 'SIN-RUT'}-${f.fechaEmision || 'SIN-FECHA'}`.toLowerCase();
      
      // Verificar si ya existe una factura con los mismos datos clave
      const existeFactura = facturas.some(factura => {
        const facturaExistenteId = `${factura.tipoDTE || '33'}-${factura.folio || 'SIN-FOLIO'}-${factura.rutEmisor || 'SIN-RUT'}-${factura.fechaEmision || 'SIN-FECHA'}`.toLowerCase();
        return facturaExistenteId === facturaId;
      });
      
      if (existeFactura) {
        facturasDuplicadas.push(`Factura ${f.tipoDTE || '33'}-${f.folio || 'SIN-FOLIO'} del ${f.fechaEmision || 'fecha desconocida'}`);
        return; // Saltar esta factura duplicada
      }
      
      const nuevaFactura: FacturaConEstado = {
        ...f,
        id: `import-${Date.now()}-${index}`,
        estado: 'pendiente' as const,
        fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        detalles: f.detalles || [],
        montoTotal: montoTotal || 0,
        montoNeto: montoNeto,
        iva: iva,
        tipoDTE: f.tipoDTE || '33',
        folio: f.folio || `FOL-${Date.now()}-${index}`,
        fechaEmision: f.fechaEmision || new Date().toISOString(),
        rutEmisor: f.rutEmisor || '',
        rutReceptor: f.rutReceptor || '',
        razonSocialEmisor: f.razonSocialEmisor || 'Emisor no especificado',
        razonSocialReceptor: f.razonSocialReceptor || 'Receptor no especificado',
      };
      
      nuevasFacturas.push(nuevaFactura);
    });
    
    console.log('Nuevas facturas procesadas:', nuevasFacturas);
    console.log('Facturas duplicadas detectadas:', facturasDuplicadas);
    
    // Agregar solo las facturas no duplicadas al estado
    if (nuevasFacturas.length > 0) {
      setFacturas(prev => [...nuevasFacturas, ...prev]);
    }
    
    // Mostrar mensaje apropiado
    let mensaje = '';
    if (nuevasFacturas.length > 0) {
      mensaje = `Se importaron ${nuevasFacturas.length} factura(s) correctamente.`;
    } else {
      mensaje = 'No se importaron nuevas facturas.';
    }
    
    if (facturasDuplicadas.length > 0) {
      mensaje += ` Se omitieron ${facturasDuplicadas.length} factura(s) duplicada(s).`;
      if (facturasDuplicadas.length <= 5) {
        mensaje += ` Facturas omitidas: ${facturasDuplicadas.join(', ')}.`;
      }
    }
    
    setImportResult({
      success: nuevasFacturas.length > 0,
      message: mensaje,
      count: nuevasFacturas.length,
      duplicates: facturasDuplicadas.length
    });
    
    // Cambiar a la pestaña de listado si se importaron facturas
    if (nuevasFacturas.length > 0) {
      setActiveTab('listado');
    }
  };

  const handleImportError = (error: string) => {
    console.error('Error al importar facturas:', error);
    setImportResult({
      success: false,
      message: error || 'Ocurrió un error al importar las facturas'
    });
  };
  
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaConEstado | null>(null);

  const handleVerFactura = (factura: FacturaConEstado) => {
    setFacturaSeleccionada(factura);
  };

  const handleCerrarDetalle = () => {
    setFacturaSeleccionada(null);
  };

  const handleCambiarEstadoFactura = (nuevoEstado: string) => {
    if (!facturaSeleccionada) return;
    
    setFacturas(prev => 
      prev.map(f => 
        f.id === facturaSeleccionada.id 
          ? { ...f, estado: nuevoEstado as any } 
          : f
      )
    );
    
    // Actualizar la factura seleccionada
    setFacturaSeleccionada({
      ...facturaSeleccionada,
      estado: nuevoEstado as any
    });

    // Mostrar notificación de éxito
    setImportResult({
      success: true,
      message: `La factura ha sido marcada como ${nuevoEstado} correctamente.`
    });
  };

  const handleEliminarFactura = (facturaAEliminar: FacturaConEstado) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la factura ${facturaAEliminar.folio}?`)) {
      return;
    }

    // Filtrar la factura a eliminar
    setFacturas(prev => prev.filter(f => f.id !== facturaAEliminar.id));
    
    // Si la factura eliminada es la que está abierta en el detalle, cerramos el detalle
    if (facturaSeleccionada?.id === facturaAEliminar.id) {
      setFacturaSeleccionada(null);
    }

    // Mostrar notificación de éxito
    setImportResult({
      success: true,
      message: 'La factura ha sido eliminada correctamente.'
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Facturación</h1>
            <p className="text-muted-foreground">
              Gestiona las facturas de tu empresa
            </p>
          </div>
          <Button 
            onClick={() => setActiveTab('importar')}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar facturas
          </Button>
        </div>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Importar Facturas</h2>
            <p className="text-muted-foreground mb-6">
              Sube un archivo XML o TXT para importar facturas al sistema.
            </p>
            
            {importResult && (
              <Alert className={`mb-6 ${importResult.success ? 'border-green-500' : 'border-red-500'}`}>
                {importResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertTitle className="ml-2">
                  {importResult.success ? '¡Éxito!' : 'Error'}
                </AlertTitle>
                <AlertDescription className="ml-6">
                  {importResult.message}
                </AlertDescription>
              </Alert>
            )}
            
            <ImportarFacturasTxt 
              onImportComplete={handleImportComplete}
              onError={handleImportError}
              empresaId="default"
            />
          </div>
        </div>
      </div>

      {/* Componente de detalle de factura - Se mantiene por si se necesita en el futuro */}
    </div>
  );
}
