export interface FacturaDetalle {
  item: number;
  codigo: string;
  descripcion: string;
  nombre: string;
  cantidad: number;
  precio: number;
  precioUnitario: number;
  descuentoPorcentaje?: number;
  descuentoMonto?: number;
  montoItem: number;
  montoTotal: number;
  [key: string]: any; // Para permitir propiedades dinámicas
}

export interface Factura {
  tipoDTE: string;
  folio: number;
  fechaEmision: string;
  tipoDespacho: string;
  formaPago: string;
  rutEmisor: string;
  razonSocialEmisor: string;
  giroEmisor: string;
  acteco: string;
  codSucursal: string;
  direccionEmisor: string;
  comunaEmisor: string;
  ciudadEmisor: string;
  rutReceptor: string;
  razonSocialReceptor: string;
  giroReceptor: string;
  direccionReceptor: string;
  comunaReceptor: string;
  ciudadReceptor: string;
  totalNeto: number;
  totalExento: number;
  totalIva: number;
  totalMontoTotal: number;
  montoPeriodo: number;
  montoNoFacturable: number;
  saldoAnterior: number;
  valorPagar: number;
  detalles: FacturaDetalle[];
  [key: string]: any; // Para permitir propiedades dinámicas
}

export type FacturaKey = keyof Factura;

export interface FacturaParcial extends Omit<Partial<Factura>, 'detalles'> {
  detalles: FacturaDetalle[];
  [key: string]: any;
}

/**
 * Extrae el contenido de una tabla HTML y lo convierte a un formato de texto plano
 */
function extraerContenidoHTML(html: string): string {
  try {
    console.log('Procesando contenido HTML...');
    
    // Crear un documento temporal
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extraer todas las tablas
    const tablas = doc.querySelectorAll('table');
    console.log(`Se encontraron ${tablas.length} tablas en el documento`);
    
    // Procesar cada tabla
    const lineas: string[] = [];
    let encabezados: string[] = [];
    
    tablas.forEach((tabla, index) => {
      console.log(`Procesando tabla ${index + 1}`);
      
      // Extraer filas de la tabla
      const filas = Array.from(tabla.querySelectorAll('tr'));
      
      // Verificar si la tabla tiene el formato de factura
      const esTablaFactura = filas.some(fila => {
        const textoFila = fila.textContent || '';
        return (textoFila.includes('TipoDTE') || textoFila.includes('Tipo DTE') || textoFila.includes('Tipo')) && 
               (textoFila.includes('Folio') || textoFila.includes('Número'));
      });
      
      if (!esTablaFactura) {
        console.log(`Tabla ${index + 1} no parece ser una tabla de factura, omitiendo...`);
        return;
      }
      
      // Procesar filas de la tabla
      let enDetalle = false;
      
      for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const celdas = Array.from(fila.querySelectorAll('td, th'));
        
        // Si es la primera fila, asumimos que son los encabezados
        if (i === 0) {
          encabezados = celdas.map(celda => {
            let texto = celda.textContent || '';
            // Limpiar el texto
            texto = texto.replace(/<[^>]*>/g, '').trim();
            texto = texto.replace(/\s+/g, ' ');
            return texto;
          });
          
          // Si hay encabezados, los agregamos como primera línea
          if (encabezados.some(h => h.trim() !== '')) {
            lineas.push(encabezados.join('\t'));
          }
          continue;
        }
        
        // Procesar filas de datos
        const valores = celdas.map(celda => {
          let texto = celda.textContent || '';
          // Limpiar el contenido de la celda
          texto = texto.replace(/<[^>]*>/g, '').trim();
          // Normalizar espacios múltiples
          texto = texto.replace(/\s+/g, ' ');
          return texto;
        });
        
        // Verificar si es una fila de detalle
        const esFilaDetalle = valores.some(v => 
          v.includes('DETALLE') || 
          v.includes('Item') || 
          v.includes('Cantidad') || 
          v.includes('Precio')
        );
        
        if (esFilaDetalle) {
          enDetalle = true;
          // Si es el encabezado de detalle, lo agregamos como está
          if (valores.some(v => v.includes('DETALLE'))) {
            lineas.push('DETALLE');
          }
          // Agregar encabezados de detalle
          lineas.push(valores.join('\t'));
        } else if (enDetalle) {
          // Si estamos en la sección de detalles, verificar si es una fila de detalle válida
          const esFilaVacia = valores.every(v => v.trim() === '');
          if (!esFilaVacia) {
            lineas.push(valores.join('\t'));
          } else {
            enDetalle = false;
          }
        } else {
          // Para filas normales, verificar que no estén vacías
          if (valores.some(v => v.trim() !== '')) {
            lineas.push(valores.join('\t'));
          }
        }
      }
      
      // Agregar una línea en blanco entre tablas
      lineas.push('');
    });
    
    const resultado = lineas.join('\n');
    console.log('=== CONTENIDO EXTRAÍDO ===');
    console.log(resultado);
    
    return resultado;
  } catch (error) {
    console.error('Error al procesar HTML:', error);
    throw new Error('Error al procesar el archivo HTML. Asegúrate de que sea una tabla HTML válida.');
  }
}

export function parseFacturasFromTxt(content: string): Factura[] {
  console.log('=== INICIO DE ANÁLISIS ===');
  console.log('Tipo de contenido:', typeof content);
  console.log('Longitud del contenido:', content.length);
  
  const facturas: Factura[] = [];
  let facturaActual: FacturaParcial = { detalles: [] };
  let enDetalle = false;
  let encabezados: string[] = [];
  let encabezadosDetalle: string[] = [];
  let numLinea = 0;
  let esPrimeraLinea = true;
  
  // Función para convertir un valor de texto a número
  const aNumero = (valor: string): number => {
    if (!valor || valor.trim() === '') return 0;
    try {
      // Eliminar caracteres no numéricos excepto coma y punto
      let limpio = valor.replace(/[^0-9,-]/g, '');
      // Si hay coma decimal, reemplazarla por punto
      if (limpio.includes(',')) {
        // Si hay múltiples comas, asumir que la última es el separador decimal
        const partes = limpio.split(',');
        const parteEntera = partes[0].replace(/\./g, '');
        const parteDecimal = partes.slice(1).join('');
        limpio = `${parteEntera}.${parteDecimal}`;
      } else {
        // Si no hay coma, eliminar todos los puntos
        limpio = limpio.replace(/\./g, '');
      }
      const numero = parseFloat(limpio);
      return isNaN(numero) ? 0 : numero;
    } catch (error) {
      console.error('Error al convertir a número:', valor, error);
      return 0;
    }
  };

  // Función para limpiar y normalizar el texto
  const limpiarTexto = (texto: string, mantenerTabs: boolean = false): string => {
    if (!texto) return '';
    // Primero normalizamos los saltos de línea
    let limpio = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    if (mantenerTabs) {
      // Si necesitamos mantener las tabulaciones para el procesamiento
      return limpio.trim();
    }
    
    // Si no necesitamos mantener tabulaciones, normalizamos espacios
    return limpio.trim()
      .replace(/\s+/g, ' ')  // Reemplaza múltiples espacios por uno solo
      .replace(/\t+/g, '\t') // Normaliza tabulaciones múltiples
      .trim();
  };
  
  try {
    // Verificar si el contenido es HTML
    const esHTML = content.trim().startsWith('<');
    console.log('Es HTML:', esHTML);
    
    const contenidoProcesado = esHTML 
      ? extraerContenidoHTML(content)
      : content;
      
    console.log('=== CONTENIDO PROCESADO (PRIMEROS 1000 CARACTERES) ===');
    console.log(contenidoProcesado.substring(0, 1000));
    
    console.log('=== CONTENIDO PROCESADO ===');
    console.log(contenidoProcesado);
    
    // Dividir el contenido en líneas
    const lineasSucias = contenidoProcesado.split('\n');
    // Procesar cada línea individualmente
    const lineas = lineasSucias
      .map(linea => linea.trim()) // Limpiar espacios al inicio y final
      .filter(linea => linea !== ''); // Eliminar líneas vacías
    
    console.log('Líneas después de limpieza:', lineas);
    
    // Si el archivo es HTML, extraemos el contenido de las tablas
    if (esHTML) {
      console.log('Procesando como HTML...');
      
      try {
        // Primero intentar con el método de extracción mejorado
        const contenidoExtraido = extraerContenidoHTML(content);
        const lineasExtraidas = contenidoExtraido.split('\n').filter(l => l.trim() !== '');
        
        if (lineasExtraidas.length > 0) {
          console.log('Usando extracción mejorada de HTML');
          lineas.length = 0;
          lineas.push(...lineasExtraidas);
        } else {
          console.log('Usando método alternativo de extracción');
          const doc = new DOMParser().parseFromString(content, 'text/html');
          const tablas = doc.querySelectorAll('table');
          
          // Convertimos las tablas a texto plano con tabulaciones
          const lineasTablas: string[] = [];
          
          tablas.forEach((tabla, index) => {
            const filas = Array.from(tabla.querySelectorAll('tr'));
            
            filas.forEach(fila => {
              const celdas = Array.from(fila.querySelectorAll('td, th'));
              const linea = celdas
                .map(celda => {
                  let texto = celda.textContent || '';
                  // Limpiar el texto manteniendo las tabulaciones
                  return texto.trim().replace(/\s+/g, ' ');
                })
                .join('\t');
                
              if (linea.trim()) {
                lineasTablas.push(linea);
              }
            });
            
            // Agregar separador entre tablas
            if (index < tablas.length - 1) {
              lineasTablas.push('');
            }
          });
          
          // Continuar con el procesamiento normal
          const lineasFiltradas = lineasTablas.filter(linea => linea.trim() !== '');
          console.log('Líneas extraídas de HTML:', lineasFiltradas);
          
          // Reemplazar las líneas originales con las procesadas
          lineas.length = 0;
          lineas.push(...lineasFiltradas);
        }
      } catch (error) {
        console.error('Error al procesar HTML:', error);
        throw new Error('Error al procesar el contenido HTML del archivo.');
      }
    }
    
    console.log('=== LÍNEAS PROCESADAS ===');
    console.log('Total de líneas:', lineas.length);
    console.log('Primeras 10 líneas:', lineas.slice(0, 10).join('\n'));
    
    if (lineas.length === 0) {
      throw new Error('El archivo está vacío después del procesamiento');
    }
    
    console.log(`Se encontraron ${lineas.length} líneas de datos`);
    console.log('Primeras 5 líneas procesadas:', lineas.slice(0, 5));

    // Validar que el archivo no esté vacío
    if (lineas.length === 0 || lineas.every(linea => !linea.trim())) {
      throw new Error('El archivo está vacío o solo contiene líneas en blanco');
    }

    // Buscar el inicio del archivo (puede haber líneas vacías al principio)
    let indiceInicio = 0;
    while (indiceInicio < lineas.length && !lineas[indiceInicio]?.includes('TipoDTE')) {
      indiceInicio++;
    }

    if (indiceInicio >= lineas.length) {
      throw new Error('No se encontró el encabezado de factura. Asegúrate de que el archivo tenga el formato correcto.');
    }

    console.log(`Inicio de facturas encontrado en la línea ${indiceInicio + 1}`);

    // Procesar las líneas del archivo
    for (let i = indiceInicio; i < lineas.length; i++) {
      numLinea = i + 1;
      const linea = lineas[i].trim();
      
      if (!linea) continue; // Saltar líneas vacías

      // Procesar encabezado de factura
      const columnas = linea.split('\t').map(col => col.trim()).filter(col => col !== '');
      const esEncabezadoFactura = 
        (columnas.some(col => col.includes('TipoDTE') || col.includes('Tipo DTE') || col.includes('Tipo'))) && 
        (columnas.some(col => col.includes('Folio') || col.includes('Número')));
        
      console.log('Línea procesada:', linea);
      console.log('Columnas detectadas:', columnas);
      console.log('¿Es encabezado de factura?', esEncabezadoFactura);
      
      // Si es la primera línea y no es un encabezado de factura, podría ser que ya son los datos
      if (esPrimeraLinea && !esEncabezadoFactura && columnas.length > 5) {
        console.log('Primera línea parece contener datos de factura directamente');
        // Asumir que son los datos de la factura
        if (facturaActual.detalles!.length > 0) {
          facturas.push(facturaActual as Factura);
        }
        facturaActual = { detalles: [] };
        
        // Mapear los valores directamente a la factura
        columnas.forEach((valor, index) => {
          const key = convertirACamelCase(encabezados[index] || `campo${index}`);
          if (key && key !== 'detalles') {
            (facturaActual as any)[key] = valor;
          }
        });
        
        esPrimeraLinea = false;
        continue;
      }
      
      if (esEncabezadoFactura) {
        console.log(`Encontrado encabezado de factura en línea ${numLinea}`);
        
        // Guardar factura anterior si existe
        if (facturaActual.tipoDTE && facturaActual.detalles && facturaActual.detalles.length > 0) {
          console.log('Guardando factura actual:', facturaActual);
          facturas.push(facturaActual as Factura);
        } else if (facturaActual.tipoDTE) {
          console.log('Factura sin detalles, omitiendo:', facturaActual);
        }
        
        // Iniciar nueva factura
        facturaActual = { detalles: [] };
        enDetalle = false;
        
        // Procesar encabezados
        encabezados = linea.split('\t')
          .map((h: string) => h.trim())
          .filter(h => h); // Eliminar encabezados vacíos
          
        console.log('Encabezados detectados:', encabezados);
        
        // Verificar que haya una línea de valores después de los encabezados
        if (i + 1 >= lineas.length) {
          console.warn('No se encontró línea de valores después de los encabezados, continuando...');
          continue;
        }
        
        // Procesar la línea de valores
        i++; // Mover al siguiente índice para leer los valores
        numLinea++;
        const valores = lineas[i].split('\t').map((v: string) => v.trim()).filter(v => v !== '');
        
        console.log('Encabezados:', encabezados);
        console.log('Valores:', valores);
        
        // Si no hay suficientes valores, intentar con la siguiente línea
        if (valores.length < encabezados.length && i + 1 < lineas.length) {
          const siguienteLinea = lineas[i + 1].split('\t').map((v: string) => v.trim()).filter(v => v !== '');
          if (siguienteLinea.length > 0) {
            console.log('Combinando con línea siguiente:', siguienteLinea);
            valores.push(...siguienteLinea);
            i++; // Saltar la línea que acabamos de procesar
            numLinea++;
          }
        }
        
        // Mapear valores a la factura actual
        encabezados.forEach((encabezado, index) => {
          if (index < valores.length && valores[index]) {
            const key = convertirACamelCase(encabezado);
            const valor = valores[index];
            
            try {
              // Convertir valores numéricos
              if (['folio', 'totalNeto', 'totalExento', 'totalIva', 'totalMontoTotal', 
                   'montoPeriodo', 'montoNoFacturable', 'saldoAnterior', 'valorPagar'].includes(key)) {
                const valorNumerico = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
                (facturaActual as any)[key] = isNaN(valorNumerico) ? 0 : valorNumerico;
              } else if (key !== 'detalles') { // No sobrescribir detalles
                (facturaActual as any)[key] = valor;
              }
            } catch (error) {
              console.error(`Error al procesar el valor '${valor}' para el campo '${key}':`, error);
            }
          }
        });
        
        continue;
      }
      
      // Procesar encabezado de detalles
      const columnasDetalle = linea.split('\t').map(col => col.trim()).filter(col => col !== '');
      const esEncabezadoDetalle = 
        (columnasDetalle.some(col => col.includes('DETALLE') || col.includes('DETALLE'))) ||
        (columnasDetalle.some(col => col.match(/item/i) || col.includes('Ítem')) &&
         (columnasDetalle.some(col => col.match(/descrip/i) || col.match(/producto/i)) ||
          columnasDetalle.some(col => col.match(/cantidad|precio/i))));
        
      console.log('¿Es encabezado de detalle?', esEncabezadoDetalle, 'Línea:', linea);
        
      if (esEncabezadoDetalle) {
        console.log(`Encontrado encabezado de detalle en línea ${numLinea}`);
        enDetalle = true;
        
        // Verificar que haya una línea de encabezados de detalle
        if (i + 1 >= lineas.length) {
          console.warn('No se encontró línea de encabezados de detalle, continuando...');
          continue;
        }
        
        i++; // Mover al siguiente índice para leer los encabezados de detalle
        numLinea++;
        encabezadosDetalle = lineas[i].split('\t')
          .map((h: string) => h.trim())
          .filter((h: string) => h);
        
        console.log('Encabezados de detalle encontrados:', encabezadosDetalle);
        
        if (encabezadosDetalle.length === 0) {
          console.warn(`No se encontraron encabezados de detalle válidos en la línea ${i + 1}`);
        }
        
        continue;
      }
      
      // Procesar líneas de detalle
      if (enDetalle && facturaActual.detalles && encabezadosDetalle.length > 0) {
        const valores: string[] = linea.split('\t').map((v: string) => v.trim());
        
        console.log('Procesando línea de detalle:', valores);
        
        // Si la línea no tiene suficientes valores, puede ser el final de los detalles
        if (valores.length < 2 || 
            (valores.every(v => v.trim() === '')) || // Línea vacía
            (valores[0] === '' && valores.slice(1).every(v => v === ''))) { // Línea casi vacía
          console.log(`Fin de detalles detectado en línea ${numLinea}`);
          enDetalle = false;
          continue;
        }
        
        // Verificar si la línea parece ser un detalle válido (debe tener al menos item, descripción y monto)
        const esDetalleValido = (
          !isNaN(Number(valores[0])) || // El primer valor es un número (item)
          !isNaN(Number(valores[valores.length - 1]?.replace(/\./g, '').replace(',', '.'))) // Último valor es numérico (monto)
        );
        
        if (!esDetalleValido) {
          console.log(`Línea no parece ser un detalle válido, omitiendo:`, valores);
          continue;
        }
        
        try {
          const detalle: any = {
            item: 0,
            codigo: '',
            descripcion: '',
            cantidad: 0,
            precio: 0,
            montoItem: 0,
            descuentoPorcentaje: 0,
            descuentoMonto: 0
          };
          
          // Primero, intentar mapear por encabezados si están disponibles
          let tieneValores = false;
          
          if (encabezadosDetalle.length > 0) {
            encabezadosDetalle.forEach((encabezado: string, index: number) => {
              if (index < valores.length && valores[index] !== '') {
                const key = convertirACamelCase(encabezado);
                const valor = valores[index];
                
                try {
                  // Mapear campos comunes
                  if (key.match(/item|ítem|nro|número|num/i)) {
                    detalle.item = isNaN(Number(valor)) ? valor : Number(valor);
                  } else if (key.match(/código|codigo|sku|id/i)) {
                    detalle.codigo = valor;
                  } else if (key.match(/descrip|producto|servicio|concepto/i)) {
                    detalle.descripcion = valor;
                  } else if (key.match(/cantidad|qty|cant/i)) {
                    detalle.cantidad = aNumero(valor);
                  } else if (key.match(/precio|unitario|valor\s*unit/i)) {
                    detalle.precio = aNumero(valor);
                  } else if (key.match(/descuento.*%/i) || key.match(/%\s*desc/i)) {
                    detalle.descuentoPorcentaje = aNumero(valor);
                  } else if (key.match(/descuento|monto\s*desc/i)) {
                    detalle.descuentoMonto = aNumero(valor);
                  } else if (key.match(/total|monto|valor|importe/i)) {
                    detalle.montoItem = aNumero(valor);
                  }
                  
                  tieneValores = true;
                } catch (error) {
                  console.error(`Error al procesar el valor '${valor}' para el campo '${key}':`, error);
                }
              }
            });
          }
          
          // Si no se encontraron valores con los encabezados, intentar con mapeo posicional
          if (!tieneValores) {
            // Asumir un orden común: Item | Código | Descripción | Cantidad | Precio | Descuento % | Descuento $ | Monto
            const mapeoPosicional = [
              'item',
              'codigo',
              'descripcion',
              'cantidad',
              'precio',
              'descuentoPorcentaje',
              'descuentoMonto',
              'montoItem'
            ];
            
            valores.forEach((valor, index) => {
              if (index < mapeoPosicional.length && valor.trim() !== '') {
                const key = mapeoPosicional[index];
                if (['cantidad', 'precio', 'descuentoPorcentaje', 'descuentoMonto', 'montoItem'].includes(key)) {
                  detalle[key] = aNumero(valor);
                } else if (key === 'item') {
                  detalle[key] = isNaN(Number(valor)) ? valor : Number(valor);
                } else {
                  detalle[key] = valor;
                }
                tieneValores = true;
              }
            });
          }
          
          // Intentar calcular campos faltantes
          if (!detalle.montoItem && detalle.cantidad && detalle.precio) {
            detalle.montoItem = detalle.cantidad * detalle.precio;
            if (detalle.descuentoPorcentaje) {
              detalle.montoItem *= (1 - (detalle.descuentoPorcentaje / 100));
            } else if (detalle.descuentoMonto) {
              detalle.montoItem -= detalle.descuentoMonto;
            }
          }
          
          if (tieneValores) {
            facturaActual.detalles!.push(detalle);
          } else {
            console.warn(`Línea ${numLinea} ignorada: no contiene valores válidos`);
          }
        } catch (error) {
          console.error(`Error al procesar la línea ${numLinea}:`, error);
        }
      }
    }
    
    // Asegurarse de agregar la última factura si tiene detalles
    if (facturaActual.tipoDTE && facturaActual.detalles && facturaActual.detalles.length > 0) {
      console.log('Guardando última factura:', facturaActual);
      facturas.push(facturaActual as Factura);
    } else if (facturaActual.tipoDTE) {
      console.log('Última factura sin detalles, omitiendo:', facturaActual);
    }
    
    if (facturas.length === 0) {
      console.warn('=== ADVERTENCIA: NO SE ENCONTRARON FACTURAS ===');
      console.warn('Total de líneas procesadas:', lineas.length);
      console.warn('Primeras 5 líneas:', lineas.slice(0, 5));
      console.warn('Últimas 5 líneas:', lineas.slice(-5));
      
      // Guardar el contenido procesado para depuración
      const blob = new Blob([contenidoProcesado], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      console.warn('Enlace para descargar el contenido procesado:', url);
      
      throw new Error('No se encontraron facturas en el archivo. Verifica que el formato sea correcto y que contenga datos de factura.');
    }
    
    console.log(`Análisis completado. Se encontraron ${facturas.length} facturas.`);
    return facturas;
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? `Error al procesar el archivo en la línea ${numLinea}: ${error.message}`
      : 'Error desconocido al procesar el archivo';
    
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  }
}

export function convertirACamelCase(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, letra) => letra.toUpperCase())
    .replace(/[^\w\s]/g, '');
}

/**
 * Detecta el tipo de archivo y lo procesa con el parser correspondiente
 */
export function parseFacturaFile(content: string, fileName: string): Factura[] {
  try {
    console.log(`Procesando archivo: ${fileName}`);
    
    // Verificar si es un archivo XML
    if (fileName.toLowerCase().endsWith('.xml') || content.trim().startsWith('<?xml')) {
      return parseDTEXml(content);
    }
    
    // Verificar si es HTML
    const esHTML = content.includes('<html') || content.includes('<!DOCTYPE html') || 
                  (content.includes('<table') && content.includes('</table>'));
    
    if (esHTML || fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
      return parseFacturasFromTxt(content);
    }
    
    // Por defecto, asumir que es un archivo de texto plano
    return parseFacturasFromTxt(content);
    
  } catch (error) {
    console.error('Error al procesar el archivo:', error);
    throw new Error(`Error al procesar el archivo: ${error instanceof Error ? error.message : String(error)}`);
  }
}
/**
 * Parsea un archivo DTE XML chileno a formato de factura estandarizado
 */
// Función para extraer montos numéricos de los nodos XML
export function extraerMonto(elemento: Element | null, ...selectores: string[]): number {
  if (!elemento) return 0;

  for (const selector of selectores) {
    try {
      // Intentar con diferentes variaciones del selector (mayúsculas/minúsculas)
      const variaciones = [
        selector,
        selector.toLowerCase(),
        selector.toUpperCase(),
        selector.charAt(0).toUpperCase() + selector.slice(1).toLowerCase()
      ];

      for (const sel of variaciones) {
        const nodo = elemento.querySelector(sel);
        if (nodo && nodo.textContent && nodo.textContent.trim() !== '') {
          const texto = nodo.textContent.trim();

          // Formato chileno: puntos como separadores de miles y comas como decimales
          console.log(`Procesando valor original: '${texto}'`);
          
          // Primero convertir a float para manejar correctamente el formato decimal
          const numeroFloat = parseFloat(texto.replace(/\./g, '').replace(',', '.'));
          
          // Luego truncar a entero para eliminar la parte decimal
          const numero = Math.floor(numeroFloat);
          
          console.log(`Convirtiendo valor '${texto}' a número: ${numeroFloat} -> ${numero}`);

          if (!isNaN(numero)) {
            console.log(`Valor extraído para ${sel}: ${numero}`);
            return numero;
          }
        }
      }
    } catch (error) {
      console.warn(`Error al extraer monto para ${selector}:`, error);
    }
  }
  
  return 0;
}

export function parseDTEXml(xmlContent: string): Factura[] {
  try {
    console.log('=== INICIO DE ANÁLISIS DTE XML ===');
    
    // Parsear el XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Obtener todos los nodos DTE (puede haber varios en un solo archivo)
    const dteNodes = xmlDoc.querySelectorAll('DTE, dte, DTE');
    if (!dteNodes || dteNodes.length === 0) {
      throw new Error('No se encontraron nodos DTE en el XML');
    }
    
    console.log(`Se encontraron ${dteNodes.length} facturas en el archivo XML`);
    
    // Array para almacenar todas las facturas encontradas
    const facturas: Factura[] = [];
    
    // Procesar cada nodo DTE
    dteNodes.forEach((dteNode, dteIndex) => {
      try {
        console.log(`Procesando factura ${dteIndex + 1} de ${dteNodes.length}`);
        
        // Obtener el documento dentro del DTE
        const docNode = dteNode.querySelector('Documento');
        if (!docNode) {
          console.warn(`[Factura ${dteIndex + 1}] No se encontró el nodo Documento en el DTE`);
          return; // Continuar con la siguiente factura
        }
        
        // Inicializar la factura
        const factura: FacturaParcial = { detalles: [] };
        
        // Extraer datos del encabezado
        const encabezado = docNode.querySelector('Encabezado');
        if (encabezado) {
          // Datos del documento
          const idDoc = encabezado.querySelector('IdDoc');
          if (idDoc) {
            factura.tipoDTE = idDoc.querySelector('TipoDTE')?.textContent || '';
            factura.folio = parseInt(idDoc.querySelector('Folio')?.textContent || '0');
            // Extraer la fecha de emisión
            const fchEmis = idDoc.querySelector('FchEmis')?.textContent;
            if (fchEmis) {
              factura.fechaEmision = fchEmis;
            }
          }
          
          // Datos del emisor
          const emisor = encabezado.querySelector('Emisor');
          if (emisor) {
            factura.rutEmisor = emisor.querySelector('RUTEmisor')?.textContent || '';
            factura.razonSocialEmisor = emisor.querySelector('RznSoc')?.textContent || '';
            factura.giroEmisor = emisor.querySelector('GiroEmis')?.textContent || '';
            factura.acteco = emisor.querySelector('Acteco')?.textContent || '';
            factura.direccionEmisor = emisor.querySelector('DirOrigen')?.textContent || '';
            factura.comunaEmisor = emisor.querySelector('CmnaOrigen')?.textContent || '';
            factura.ciudadEmisor = emisor.querySelector('CiudadOrigen')?.textContent || '';
          }
          
          // Datos del receptor
          const receptor = encabezado.querySelector('Receptor');
          if (receptor) {
            factura.rutReceptor = receptor.querySelector('RUTRecep')?.textContent || '';
            factura.razonSocialReceptor = receptor.querySelector('RznSocRecep')?.textContent || '';
            factura.giroReceptor = receptor.querySelector('GiroRecep')?.textContent || '';
            factura.direccionReceptor = receptor.querySelector('DirRecep')?.textContent || '';
            factura.comunaReceptor = receptor.querySelector('CmnaRecep')?.textContent || '';
            factura.ciudadReceptor = receptor.querySelector('CiudadRecep')?.textContent || '';
          }
          
          // Totales
          const totales = encabezado.querySelector('Totales');
          if (totales) {
            // Extraer valores de totales
            const mntNetoText = totales.querySelector('MntNeto')?.textContent || '0';
            const mntExeText = totales.querySelector('MntExe')?.textContent || '0';
            const ivaText = totales.querySelector('IVA')?.textContent || '0';
            const mntTotalText = totales.querySelector('MntTotal')?.textContent || '0';
            
            console.log(`Totales originales - Neto: '${mntNetoText}', Exento: '${mntExeText}', IVA: '${ivaText}', Total: '${mntTotalText}'`);
            
            // Convertir a números y truncar a enteros
            factura.totalNeto = Math.floor(parseFloat(mntNetoText));
            factura.totalExento = Math.floor(parseFloat(mntExeText));
            factura.totalIva = Math.floor(parseFloat(ivaText));
            factura.totalMontoTotal = Math.floor(parseFloat(mntTotalText));
            
            console.log(`Totales procesados - Neto: ${factura.totalNeto}, Exento: ${factura.totalExento}, IVA: ${factura.totalIva}, Total: ${factura.totalMontoTotal}`);
          }
        }
        
        // Extraer detalles (probar diferentes variaciones de mayúsculas/minúsculas)
        const detalles = docNode.querySelectorAll('Detalle, detalle, DETALLE, Detalle, DETALLE');
        let totalCalculado = 0;
        
        console.log(`Se encontraron ${detalles.length} detalles en la factura`);
        
        // Función para extraer texto de un elemento
        const extraerTexto = (elemento: Element, selector: string): string => {
          if (!elemento) return '';
          
          // Probar diferentes variaciones del selector (mayúsculas/minúsculas)
          const selectores = [
            selector,
            selector.toLowerCase(),
            selector.toUpperCase(),
            selector.charAt(0).toUpperCase() + selector.slice(1).toLowerCase()
          ];
          
          for (const sel of selectores) {
            const nodo = elemento.querySelector(sel);
            if (nodo && nodo.textContent && nodo.textContent.trim() !== '') {
              return nodo.textContent.trim();
            }
          }
          return '';
        };
        
        // Procesar cada detalle
        detalles.forEach((detalleNode: Element, idx: number) => {
          try {
            const detalleIndex = idx + 1;
            console.log(`Procesando detalle ${detalleIndex}:`, detalleNode.outerHTML.substring(0, 200) + '...');
            
            // Extraer valores del detalle - Probar con diferentes selectores
            // Intentar con todos los posibles nombres de nodos para cantidad
            let qtyText = '';
            for (const selector of ['QtyItem', 'Cantidad', 'QTYITEM', 'CANTIDAD', 'qtyitem', 'cantidad']) {
              const node = detalleNode.querySelector(selector);
              if (node && node.textContent) {
                qtyText = node.textContent.trim();
                console.log(`Encontrado nodo cantidad con selector '${selector}': '${qtyText}'`);
                break;
              }
            }
            
            // Intentar con todos los posibles nombres de nodos para precio
            let prcText = '';
            for (const selector of ['PrcItem', 'Precio', 'PRCITEM', 'PRECIO', 'prcitem', 'precio']) {
              const node = detalleNode.querySelector(selector);
              if (node && node.textContent) {
                prcText = node.textContent.trim();
                console.log(`Encontrado nodo precio con selector '${selector}': '${prcText}'`);
                break;
              }
            }
            
            // Intentar con todos los posibles nombres de nodos para monto
            let montoText = '';
            for (const selector of ['MontoItem', 'Monto', 'MONTOITEM', 'MONTO', 'montoitem', 'monto']) {
              const node = detalleNode.querySelector(selector);
              if (node && node.textContent) {
                montoText = node.textContent.trim();
                console.log(`Encontrado nodo monto con selector '${selector}': '${montoText}'`);
                break;
              }
            }
            
            console.log(`XML del detalle:`, detalleNode.outerHTML);
            console.log(`Valores originales - Cantidad: '${qtyText}', Precio: '${prcText}', Monto: '${montoText}'`);
            
            // Extraer valores numéricos con manejo especial para formatos chilenos
            let cantidad = 1;
            if (qtyText) {
              // Convertir directamente el texto a número
              const qtyNum = parseFloat(qtyText);
              // Truncar a entero
              cantidad = Math.floor(qtyNum);
              if (isNaN(cantidad)) cantidad = 1;
              console.log(`Cantidad procesada: '${qtyText}' -> ${qtyNum} -> ${cantidad}`);
            }
            
            let precio = 0;
            if (prcText) {
              // Convertir directamente el texto a número
              const prcNum = parseFloat(prcText);
              // Truncar a entero
              precio = Math.floor(prcNum);
              if (isNaN(precio)) precio = 0;
              console.log(`Precio procesado: '${prcText}' -> ${prcNum} -> ${precio}`);
            }
            
            let montoItem = 0;
            if (montoText) {
              // Convertir directamente el texto a número
              const montoNum = parseFloat(montoText);
              // Truncar a entero
              montoItem = Math.floor(montoNum);
              if (isNaN(montoItem)) montoItem = 0;
              console.log(`Monto procesado: '${montoText}' -> ${montoNum} -> ${montoItem}`);
            }
            
            console.log(`Valores procesados finales - Cantidad: ${cantidad}, Precio: ${precio}, Monto: ${montoItem}`);
            
            // Si no hay montoItem pero hay cantidad y precio, calcularlo
            if ((!montoItem || montoItem <= 0) && cantidad > 0 && precio > 0) {
              montoItem = cantidad * precio;
              console.log(`Monto calculado para detalle ${detalleIndex}: ${montoItem} (${cantidad} x ${precio})`);
            }
            
            // Obtener descripción del ítem
            const nombreItem = extraerTexto(detalleNode, 'NmbItem') || extraerTexto(detalleNode, 'Nmb') || '';
            const descripcionItem = extraerTexto(detalleNode, 'DscItem') || extraerTexto(detalleNode, 'Dsc') || '';
            const nroLinDet = extraerTexto(detalleNode, 'NroLinDet') || detalleIndex.toString();
            
            // Crear el objeto de detalle con valores numéricos correctos
            const detalle: FacturaDetalle = {
              item: parseInt(nroLinDet) || detalleIndex,
              codigo: extraerTexto(detalleNode, 'CdgItem') || extraerTexto(detalleNode, 'Codigo') || `ITEM${detalleIndex}`,
              descripcion: descripcionItem || nombreItem || `Producto ${detalleIndex}`,
              nombre: nombreItem || descripcionItem || `Producto ${detalleIndex}`,
              cantidad: cantidad,
              precio: precio,
              precioUnitario: precio,
              montoItem: montoItem || (cantidad * precio),
              montoTotal: montoItem || (cantidad * precio)
            };
            
            // Verificar que los valores numéricos sean correctos
            console.log('Detalle creado:', JSON.stringify(detalle, null, 2));
            
            // Manejar descuentos si existen
            const descuentoPct = detalleNode.querySelector('DescuentoPct, descuentoPct, DESCUENTOPCT');
            const descuentoMonto = detalleNode.querySelector('DescuentoMonto, descuentoMonto, DESCUENTOMONTO');
            
            if (descuentoPct && descuentoPct.textContent) {
              const descuentoValor = parseFloat(descuentoPct.textContent.replace(',', '.')) || 0;
              if (descuentoValor > 0) {
                detalle.descuentoPorcentaje = descuentoValor;
                console.log(`Descuento porcentual ${descuentoValor}% para detalle ${detalleIndex}`);
              }
            }
            
            if (descuentoMonto && descuentoMonto.textContent) {
              const montoDescuento = parseFloat(descuentoMonto.textContent.replace(/\./g, '').replace(',', '.')) || 0;
              if (montoDescuento > 0) {
                detalle.descuentoMonto = montoDescuento;
                console.log(`Descuento monto ${montoDescuento} para detalle ${detalleIndex}`);
              }
            }
            
            factura.detalles!.push(detalle);
            console.log(`Detalle ${detalleIndex} agregado:`, detalle);
            
            // Acumular al total calculado
            totalCalculado += montoItem;
          } catch (error) {
            const errorIndex = (idx + 1).toString();
            console.error(`Error al procesar el detalle ${errorIndex}:`, error);
          }
        });
        
        // Extraer información de firma si es necesario
        const signature = dteNode.querySelector('Signature');
        if (signature) {
          const fechaFirma = signature.querySelector('TmstFirma')?.textContent;
          if (fechaFirma && !factura.fechaEmision) {
            // Usar la fecha de firma solo si no hay fecha de emisión
            factura.fechaEmision = fechaFirma.split('T')[0];
          }
        }
        
        // Si no se encontraron detalles pero la factura tiene monto, crear un detalle genérico
        if (factura.detalles!.length === 0) {
          // Si hay un monto total, usarlo
          if (factura.totalMontoTotal && factura.totalMontoTotal > 0) {
            factura.detalles!.push({
              item: 1,
              codigo: 'GEN1',
              descripcion: 'Producto o servicio genérico',
              nombre: 'Producto o servicio genérico',
              cantidad: 1,
              precio: factura.totalMontoTotal,
              precioUnitario: factura.totalMontoTotal,
              montoItem: factura.totalMontoTotal,
              montoTotal: factura.totalMontoTotal
            });
            console.log(`Se agregó un detalle genérico basado en el monto total: ${factura.totalMontoTotal}`);
          } else if (totalCalculado > 0) {
            factura.totalMontoTotal = totalCalculado;
            factura.detalles!.push({
              item: 1,
              codigo: 'CALC1',
              descripcion: 'Detalle de factura',
              nombre: 'Detalle de factura',
              cantidad: 1,
              precio: totalCalculado,
              precioUnitario: totalCalculado,
              montoItem: totalCalculado,
              montoTotal: totalCalculado
            });
            console.log(`Se agregó un detalle genérico basado en el total calculado: ${totalCalculado}`);
          }
        }
        
        // Validar que la factura tenga los datos mínimos necesarios
        if (!factura.tipoDTE || !factura.folio || !factura.fechaEmision) {
          console.warn(`[Factura ${dteIndex + 1}] Faltan datos obligatorios en la factura. Se omitirá.`);
          return;
        }
        
        // Asegurarse de que los montos sean consistentes
        if (factura.totalMontoTotal <= 0) {
          console.warn(`[Factura ${dteIndex + 1}] El monto total es 0 o inválido.`);
          // Si no hay monto total pero hay detalles, usar la suma de los detalles
          if (factura.detalles && factura.detalles.length > 0) {
            const totalDetalles = factura.detalles.reduce((sum, detalle) => sum + (detalle.montoItem || 0), 0);
            if (totalDetalles > 0) {
              factura.totalMontoTotal = totalDetalles;
              console.log(`Monto total actualizado a partir de detalles: ${factura.totalMontoTotal}`);
            }
          }
        }
        
        // Validar montos
        if (factura.totalMontoTotal === 0 && factura.detalles && factura.detalles.length > 0) {
          // Si el monto total es 0 pero hay detalles, calcular el total a partir de los detalles
          const totalDetalles = factura.detalles.reduce((sum, detalle) => sum + (detalle.montoItem || 0), 0);
          
          // Si el total de los detalles es mayor que 0, actualizar el monto total
          if (totalDetalles > 0) {
            factura.totalMontoTotal = totalDetalles;
            console.log(`Monto total actualizado a partir de detalles: ${factura.totalMontoTotal}`);
          }
        }
        // Crear un objeto Factura completo basado en la factura parcial
        const facturaCompleta: Factura = {
          ...factura,
          // Asegurarse de que todos los campos requeridos estén presentes
          tipoDTE: factura.tipoDTE || '',
          folio: factura.folio || 0,
          fechaEmision: factura.fechaEmision || new Date().toISOString().split('T')[0],
          tipoDespacho: factura.tipoDespacho || '',
          formaPago: factura.formaPago || '',
          rutEmisor: factura.rutEmisor || '',
          razonSocialEmisor: factura.razonSocialEmisor || '',
          giroEmisor: factura.giroEmisor || '',
          acteco: factura.acteco || '',
          codSucursal: factura.codSucursal || '',
          direccionEmisor: factura.direccionEmisor || '',
          comunaEmisor: factura.comunaEmisor || '',
          ciudadEmisor: factura.ciudadEmisor || '',
          rutReceptor: factura.rutReceptor || '',
          razonSocialReceptor: factura.razonSocialReceptor || '',
          giroReceptor: factura.giroReceptor || '',
          direccionReceptor: factura.direccionReceptor || '',
          comunaReceptor: factura.comunaReceptor || '',
          ciudadReceptor: factura.ciudadReceptor || '',
          totalNeto: factura.totalNeto || 0,
          totalExento: factura.totalExento || 0,
          totalIva: factura.totalIva || 0,
          totalMontoTotal: factura.totalMontoTotal || 0,
          montoPeriodo: factura.montoPeriodo || 0,
          montoNoFacturable: factura.montoNoFacturable || 0,
          saldoAnterior: factura.saldoAnterior || 0,
          valorPagar: factura.valorPagar || 0,
          detalles: factura.detalles || []
        };
        
        // Añadir la factura al arreglo
        facturas.push(facturaCompleta);
      } catch (error) {
        console.error(`Error al procesar factura ${dteIndex + 1}:`, error);
      }
    });
    
    if (facturas.length === 0) {
      throw new Error('No se pudo procesar ninguna factura del archivo XML');
    }
    
    console.log(`Procesamiento completado. Se importaron ${facturas.length} facturas.`);
    return facturas;
    
  } catch (error) {
    console.error('Error al procesar DTE XML:', error);
    throw new Error(`Error al procesar el archivo DTE XML: ${error instanceof Error ? error.message : String(error)}`);
  }
}
