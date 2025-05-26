'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { FileText, AlertCircle, CheckCircle2, FileCode } from 'lucide-react';
import { parseFacturaFile, parseDTEXml, Factura } from '@/lib/parseFacturasTxt';
import { getCompanyServiceBillings } from '@/lib/recurringServiceService';
import { ServiceBilling } from '@/lib/recurringServiceTypes';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { FacturaConEstado } from '@/types/factura';
import { Timestamp } from 'firebase/firestore';

interface ImportarFacturasTxtProps {
  onImportComplete: (facturas: any[]) => void;
  onError?: (error: string) => void;
  empresaId: string;
}

export function ImportarFacturasTxt({ onImportComplete, onError, empresaId }: ImportarFacturasTxtProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [matchingServices, setMatchingServices] = useState<{ serviceId: string; serviceBilling: ServiceBilling; matchedFacturas: FacturaConEstado[] }[]>([]);
  const { activeCompanyDetails: currentCompany } = useActiveCompany();
  const router = useRouter();

  // Función para leer un archivo como texto
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Error al leer el archivo'));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Procesar cada archivo
      const facturasProcesadas: Factura[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await readFileAsText(file);
        
        console.log(`Procesando archivo: ${file.name}`);
        console.log(`Contenido del archivo (primeros 500 caracteres):`, content.substring(0, 500));
        
        try {
          // Parsear el archivo
          const facturasDelArchivo = parseFacturaFile(content, file.name);
          
          console.log(`Facturas encontradas en ${file.name}:`, facturasDelArchivo.length);
          
          if (facturasDelArchivo.length > 0) {
            // Verificar los valores numéricos de cada factura
            facturasDelArchivo.forEach((factura, idx) => {
              console.log(`Factura ${idx + 1} de ${file.name}:`);
              console.log(`- Folio: ${factura.folio}`);
              console.log(`- Monto Total: ${factura.totalMontoTotal}`);
              console.log(`- Detalles: ${factura.detalles.length}`);
              
              factura.detalles.forEach((detalle, detIdx) => {
                console.log(`  Detalle ${detIdx + 1}:`);
                console.log(`  - Descripción: ${detalle.descripcion}`);
                console.log(`  - Cantidad: ${detalle.cantidad}`);
                console.log(`  - Precio: ${detalle.precio}`);
                console.log(`  - Total: ${detalle.montoTotal}`);
              });
            });
            
            facturasProcesadas.push(...facturasDelArchivo);
          } else {
            console.warn(`No se encontraron facturas en el archivo ${file.name}`);
          }
        } catch (error) {
          console.error(`Error al procesar el archivo ${file.name}:`, error);
          setError(`Error al procesar el archivo ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      setFile(files[0]);
      
      // Verificar si hay facturas procesadas
      if (facturasProcesadas.length > 0) {
        console.log(`Total de facturas procesadas: ${facturasProcesadas.length}`);
        
        // Agregar el ID de la empresa a cada factura
        const facturasConEmpresa = facturasProcesadas.map(factura => ({
          ...factura,
          empresaId: empresaId
        }));
        
        // Llamar a la función de callback con las facturas procesadas
        onImportComplete(facturasConEmpresa);
        setSuccess(`Se han procesado ${facturasConEmpresa.length} facturas correctamente.`);
      } else {
        setError('No se encontraron facturas en los archivos seleccionados.');
      }
      
      setError(null);
      setSuccess(null);
      
    } catch (err) {
      const errorMessage = 'Error al procesar el archivo. Inténtalo de nuevo.';
      console.error('Error al manejar el archivo:', err);
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  useEffect(() => {
    // Cargar facturaciones de servicios recurrentes cuando se cargue el componente
    if (currentCompany?.id) {
      loadServiceBillings();
    }
  }, [currentCompany]);

  const loadServiceBillings = async () => {
    if (!currentCompany?.id) return;
    
    try {
      const billingsResult = await getCompanyServiceBillings(currentCompany.id, 'pending');
      if (!('error' in billingsResult)) {
        // Aquí podríamos procesar las facturaciones para mostrarlas
        console.log('Facturaciones de servicios recurrentes:', billingsResult);
      }
    } catch (error) {
      console.error('Error al cargar facturaciones:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setMatchingServices([]);
    
    try {
      const content = await file.text();
      
      console.log('=== INICIO DE PROCESAMIENTO ===');
      console.log('Iniciando lectura del archivo...');
      console.log('Nombre del archivo:', file.name);
      
      const facturas = await parseFacturaFile(content, file.name);
      
      // Verificar si las facturas corresponden a servicios recurrentes
      if (currentCompany?.id) {
        const billingsResult = await getCompanyServiceBillings(currentCompany.id, 'pending');
        if (!('error' in billingsResult)) {
          const pendingBillings = billingsResult;
          
          // Para cada facturación pendiente, buscar facturas que coincidan
          const matches = pendingBillings.map((billing: ServiceBilling) => {
            const matchedFacturas = facturas.filter(factura => {
              // Verificar si la fecha de la factura coincide con la fecha de facturación
              const facturaDate = new Date(factura.fechaEmision);
              const billingDate = billing.billingDate instanceof Timestamp 
                ? billing.billingDate.toDate()
                : new Date(billing.billingDate);
              
              // Verificar si las fechas son del mismo mes y año
              const datesMatch = facturaDate.getMonth() === billingDate.getMonth() &&
                                facturaDate.getFullYear() === billingDate.getFullYear();
              
              // Verificar si el monto coincide (con un margen de error)
              const amountMatch = Math.abs(factura.montoTotal - billing.amount) < 100; // Margen de 100 unidades
              
              return datesMatch && amountMatch;
            });
            
            return matchedFacturas.length > 0 ? {
              serviceId: billing.serviceId,
              serviceBilling: billing,
              matchedFacturas: matchedFacturas.map(f => ({
                ...f,
                estado: 'pendiente',
                empresaId: currentCompany?.id || 'default',
                montoTotal: f.montoTotal || 0,
                montoNeto: f.montoNeto || 0,
                iva: f.iva || 0,
                folio: f.folio.toString(),
                detalles: f.detalles.map(d => ({
                  nombre: d.nombre || '',
                  cantidad: d.cantidad || 1,
                  precioUnitario: d.precioUnitario || 0,
                  montoTotal: d.montoTotal || 0,
                  descripcion: d.descripcion,
                  codigo: d.codigo,
                  unidadMedida: d.unidadMedida,
                  descuento: d.descuento,
                  impuestoAdicional: d.impuestoAdicional
                }))
              }))
            } : null;
          }).filter(Boolean) as { 
            serviceId: string; 
            serviceBilling: ServiceBilling; 
            matchedFacturas: FacturaConEstado[] 
          }[];
          
          setMatchingServices(matches);
          
          if (matches.length > 0) {
            setSuccess(`Se encontraron ${matches.length} facturas que coinciden con servicios recurrentes`);
          } else {
            setSuccess('Facturas procesadas correctamente');
          }
        }
      }
      
      // Mapear los campos totalNeto, totalIva y totalMontoTotal a montoNeto, iva y montoTotal
      const facturasConTotales = facturas.map(factura => ({
        ...factura,
        montoNeto: factura.totalNeto || 0,
        iva: factura.totalIva || 0,
        montoTotal: factura.totalMontoTotal || 0
      }));
      
      // Llamar al callback con las facturas procesadas y mapeadas
      onImportComplete(facturasConTotales);
    } catch (error: any) {
      setError(error.message || 'Error al procesar el archivo');
      console.error('Error al procesar el archivo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Importar facturas desde archivo TXT</h3>
        <p className="text-sm text-muted-foreground">
          Sube un archivo TXT o XML con el formato de facturación para importar los datos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="facturas-file">Archivo de facturas</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input 
                id="facturas-file" 
                type="file" 
                accept=".xml,.txt,text/xml,application/xml"
                onChange={handleFileChange} 
                disabled={isLoading}
                className="flex-1"
              />
            </div>
            {file && (
              <div className="flex items-center p-2 border rounded-md bg-muted/50 text-sm">
                {file.name.toLowerCase().endsWith('.xml') ? (
                  <FileCode className="h-4 w-4 mr-2 text-blue-500" />
                ) : (
                  <FileText className="h-4 w-4 mr-2 text-green-500" />
                )}
                <span className="font-medium">{file.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {matchingServices.length > 0 && (
          <div className="mt-4 space-y-4">
            <h3 className="text-lg font-semibold">Facturas que coinciden con servicios recurrentes</h3>
            {matchingServices.map((match, index) => (
              <div key={index} className="border rounded-md p-4">
                <h4 className="font-medium">Servicio: {match.serviceBilling.serviceId}</h4>
                <p className="text-sm text-gray-600">Fecha de facturación: {match.serviceBilling.billingDate instanceof Timestamp 
                ? match.serviceBilling.billingDate.toDate().toLocaleDateString()
                : new Date(match.serviceBilling.billingDate).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">Monto esperado: ${match.serviceBilling.amount.toFixed(0)}</p>
                <div className="mt-2">
                  <p className="font-medium">Facturas coincidentes:</p>
                  {match.matchedFacturas.map((factura, fIndex) => (
                    <div key={fIndex} className="mt-1 pl-2">
                      <p className="text-sm">- Factura {factura.tipoDTE}-{factura.folio}</p>
                      <p className="text-sm text-gray-600">Monto: ${factura.montoTotal.toFixed(0)}</p>
                      <p className="text-sm text-gray-600">Fecha: {new Date(factura.fechaEmision).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {success && !matchingServices.length && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>¡Éxito!</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Button 
          type="submit" 
          disabled={!file || isLoading}
          className="mt-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </>
          ) : file?.name.endsWith('.xml') ? 'Importar factura XML' : 'Importar facturas TXT'}
        </Button>
      </form>
    </div>
  );
}
