'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ImportarFacturasTxt } from '@/components/facturacion/ImportarFacturasTxt';
import { VistaPreviaFacturas } from '@/components/facturacion/VistaPreviaFacturas';
import { Factura } from '@/lib/parseFacturasTxt';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { createFactura, checkFacturaDuplicada } from '@/lib/facturaService';
import { useToast } from '@/hooks/use-toast';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { FacturaConEstado, EstadoFactura } from '@/types/factura';

export default function ImportarFacturasEmitidasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeCompanyId } = useActiveCompany();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Función para limpiar y validar los datos de la factura
  const cleanInvoiceData = useCallback((factura: Factura): Omit<FacturaConEstado, 'id' | 'createdAt' | 'updatedAt'> => {
    // Asegurarse de que los detalles cumplan con la interfaz DetalleFactura
    const detalles = (factura.detalles || []).map(detalle => ({
      nombre: detalle.nombre || 'Producto sin nombre',
      cantidad: detalle.cantidad || 1,
      precioUnitario: detalle.precioUnitario || 0,
      montoTotal: detalle.montoTotal || (detalle.cantidad || 1) * (detalle.precioUnitario || 0),
      descripcion: detalle.descripcion || '',
      codigo: detalle.codigo || '',
      unidadMedida: detalle.unidadMedida || '',
      descuento: detalle.descuento || 0,
      impuestoAdicional: detalle.impuestoAdicional || 0
    }));

    // Calcular totales si no están presentes
    // Usar los campos mapeados de totalNeto, totalIva, totalMontoTotal si están disponibles
    const montoNeto = factura.montoNeto || factura.totalNeto || 0;
    const iva = factura.iva || factura.totalIva || 0;
    const montoTotal = factura.montoTotal || factura.totalMontoTotal || 0;
    
    // Crear objeto con solo las propiedades necesarias
    const cleanedInvoice: Omit<FacturaConEstado, 'id' | 'createdAt' | 'updatedAt'> = {
      // Propiedades básicas de Factura
      tipoDTE: factura.tipoDTE || '33',
      folio: factura.folio ? String(factura.folio) : '',
      fechaEmision: factura.fechaEmision || new Date().toISOString(),
      rutEmisor: factura.rutEmisor || '',
      rutReceptor: factura.rutReceptor || '',
      montoNeto: montoNeto,
      iva: iva,
      montoTotal: montoTotal,
      empresaId: factura.empresaId || activeCompanyId || '',
      detalles,
      
      // Tipo de documento para distinguir entre facturas emitidas y recibidas
      tipoDocumento: 'factura_emitida',
      
      // Propiedades de FacturaConEstado
      estado: (factura.estado as EstadoFactura) || 'pendiente',
      fechaVencimiento: factura.fechaVencimiento || '',
      fechaPago: factura.fechaPago || '',
      
      // Propiedades opcionales con valores por defecto
      formaPago: factura.formaPago || '',
      razonSocialEmisor: factura.razonSocialEmisor || '',
      razonSocialReceptor: factura.razonSocialReceptor || '',
      direccionReceptor: factura.direccionReceptor || '',
      comunaReceptor: factura.comunaReceptor || '',
      ciudadReceptor: factura.ciudadReceptor || '',
      
      // Agregar campos adicionales a observaciones
      observaciones: [
        factura.observaciones,
        factura.tipoDespacho ? `Tipo de despacho: ${factura.tipoDespacho}` : '',
        factura.giroEmisor ? `Giro emisor: ${factura.giroEmisor}` : '',
        factura.comunaEmisor ? `Comuna emisor: ${factura.comunaEmisor}` : '',
        factura.giroReceptor ? `Giro receptor: ${factura.giroReceptor}` : ''
      ].filter(Boolean).join('; ')
    };

    // Eliminar propiedades undefined o null
    return Object.fromEntries(
      Object.entries(cleanedInvoice).filter(([_, v]) => v !== undefined && v !== null)
    ) as Omit<FacturaConEstado, 'id' | 'createdAt' | 'updatedAt'>;
  }, [activeCompanyId]);

  const handleImportComplete = (importedFacturas: Factura[]) => {
    // Asegurarse de que cada factura tenga el ID de la empresa
    const facturasConEmpresa = importedFacturas.map(factura => ({
      ...factura,
      empresaId: factura.empresaId || activeCompanyId || ''
    }));
    
    setFacturas(facturasConEmpresa);
    setShowPreview(true);
  };

  const handleSaveFacturas = async () => {
    if (facturas.length === 0) return;

    setIsSaving(true);
    
    try {
      // Verificar y guardar cada factura en Firebase
      const savePromises = facturas.map(async (factura) => {
        try {
          // Limpiar y validar los datos de la factura
          const facturaLimpia = cleanInvoiceData(factura);
          
          // Verificar que los campos requeridos estén presentes
          if (!facturaLimpia.empresaId) {
            throw new Error('Falta el ID de la empresa');
          }
          
          if (!facturaLimpia.rutEmisor || !facturaLimpia.rutReceptor) {
            throw new Error('Faltan datos de emisor o receptor');
          }
          
          // Verificar si la factura ya existe en la base de datos
          const duplicadaResult = await checkFacturaDuplicada(
            facturaLimpia.empresaId,
            facturaLimpia.folio,
            facturaLimpia.rutEmisor,
            facturaLimpia.rutReceptor
          );
          
          // Si hay un error en la verificación
          if (duplicadaResult && typeof duplicadaResult === 'object' && 'error' in duplicadaResult) {
            console.error('Error al verificar duplicados:', duplicadaResult.error);
            throw new Error(duplicadaResult.error);
          }
          
          // Si la factura ya existe, no la guardamos
          if (duplicadaResult === true) {
            console.warn(`La factura con folio ${facturaLimpia.folio} de ${facturaLimpia.rutEmisor} ya existe en el sistema.`);
            return { 
              success: false, 
              error: `La factura con folio ${facturaLimpia.folio} ya existe en el sistema.`,
              isDuplicate: true 
            };
          }
          
          // Crear copia del objeto para evitar modificar el original
          const facturaConEmpresa = { ...facturaLimpia };
          
          // Guardar la factura en Firebase
          const result = await createFactura(facturaConEmpresa);
          
          if ('error' in result) {
            console.error('Error al guardar factura:', result.error);
            return { success: false, error: result.error };
          }
          
          return { success: true, id: result.id };
        } catch (error) {
          console.error('Error al guardar factura:', error);
          return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
        }
      });
      
      // Esperar a que todas las facturas se guarden
      const results = await Promise.all(savePromises);
      
      // Contar cuántas se guardaron correctamente y cuántas estaban duplicadas
      const savedCount = results.filter(r => r.success).length;
      const duplicateCount = results.filter(r => r.isDuplicate).length;
      const errorCount = results.length - savedCount - duplicateCount;
      
      // Preparar mensaje de resultado
      let description = '';
      if (savedCount > 0) {
        description += `Se guardaron ${savedCount} facturas correctamente. `;
      }
      if (duplicateCount > 0) {
        description += `${duplicateCount} facturas ya existían en el sistema. `;
      }
      if (errorCount > 0) {
        description += `${errorCount} facturas tuvieron errores.`;
      }
      
      // Mostrar mensaje de éxito o error
      if (savedCount > 0 || duplicateCount > 0) {
        toast({
          title: savedCount > 0 ? 'Facturas guardadas' : 'Facturas procesadas',
          description: description.trim(),
          variant: 'default',
        });
      } else {
        throw new Error('No se pudo guardar ninguna factura');
      }
      
      // Redirigir a la página de lista de facturas después de guardar
      router.push('/dashboard/facturacion/lista');
    } catch (error) {
      console.error('Error al guardar las facturas:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar las facturas. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold ml-4">Importar Facturas Emitidas</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        {!showPreview ? (
          <>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-4">
                Importa facturas emitidas por tu empresa. Estas facturas aparecerán en la sección "Facturas Emitidas".
              </p>
            </div>
            <ImportarFacturasTxt onImportComplete={handleImportComplete} empresaId={activeCompanyId || ''} />
          </>
        ) : (
          <VistaPreviaFacturas
            facturas={facturas}
            open={showPreview}
            onOpenChange={setShowPreview}
            onConfirm={handleSaveFacturas}
            isLoading={isSaving}
          />
        )}
      </div>
    </div>
  );
}
