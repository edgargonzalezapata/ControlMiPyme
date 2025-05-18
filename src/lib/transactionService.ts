
"use server";
import * as xlsx from 'xlsx';
import type { Timestamp } from 'firebase/firestore';

export interface ParsedTransaction {
  date: string; // ISO date string
  description: string;
  amount: number;
  type: 'ingreso' | 'egreso';
}

export async function processBankStatement(
  fileBufferArray: ArrayBuffer,
  originalFileName: string
): Promise<{ data?: ParsedTransaction[]; error?: string; fileName?: string; warnings?: string[] }> {
  try {
    const workbook = xlsx.read(new Uint8Array(fileBufferArray), { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { error: 'El archivo Excel no contiene hojas.', fileName: originalFileName };
    }
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      return { error: `No se pudo encontrar la hoja de trabajo: ${firstSheetName}`, fileName: originalFileName };
    }

    // Convertir a JSON, esperando que la primera fila sea la cabecera.
    // Usar raw: false para que las fechas se intenten parsear por la librería si es posible.
    // Si cellDates: true no funciona bien para tu formato, puedes quitarlo y parsear manualmente como antes.
    const jsonData: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, raw: false });

    if (jsonData.length < 2) { // Necesita al menos cabecera y una fila de datos
      return { error: 'El archivo no contiene suficientes datos (mínimo cabecera y una fila).', fileName: originalFileName };
    }

    const headerRow = jsonData.shift() as string[]; // Extraer la fila de cabecera
    if (!headerRow || headerRow.length < 4) {
      return { error: 'Formato de cabecera de archivo no esperado. Se esperaban al menos 4 columnas.', fileName: originalFileName };
    }
    
    // Encontrar índices de columnas basados en nombres comunes (ajusta según sea necesario)
    // Esto es más robusto que depender de índices fijos.
    const normalizeHeader = (header: string) => header ? header.trim().toLowerCase() : "";

    const fechaIndex = headerRow.findIndex(h => normalizeHeader(h).includes('fecha'));
    const descIndex = headerRow.findIndex(h => normalizeHeader(h).includes('descripción') || normalizeHeader(h).includes('descripcion'));
    const cargosIndex = headerRow.findIndex(h => normalizeHeader(h).includes('cargo') || normalizeHeader(h).includes('cheque')); // Ej: "Cargos", "Cheques / Cargos"
    const abonosIndex = headerRow.findIndex(h => normalizeHeader(h).includes('abono') || normalizeHeader(h).includes('depósito')); // Ej: "Abonos", "Depósitos / Abonos"

    if (fechaIndex === -1 || descIndex === -1 || (cargosIndex === -1 && abonosIndex === -1) ) {
        let missing = [];
        if (fechaIndex === -1) missing.push("Fecha");
        if (descIndex === -1) missing.push("Descripción");
        if (cargosIndex === -1 && abonosIndex === -1) missing.push("Cargos o Abonos");
        return { error: `Columnas esperadas no encontradas en el archivo: ${missing.join(', ')}. Cabeceras encontradas: ${headerRow.join(', ')}`, fileName: originalFileName };
    }


    const transactions: ParsedTransaction[] = [];
    const warnings: string[] = [];

    for (const row of jsonData) {
      if (!row || row.every(cell => cell === null || cell === undefined || String(cell).trim() === "")) {
        continue; // Saltar filas completamente vacías
      }

      try {
        const dateValue = row[fechaIndex];
        let date: Date;
        if (dateValue instanceof Date) {
          date = dateValue;
        } else if (typeof dateValue === 'number') { // Excel date serial number
           // Convert Excel serial date to JS Date: Excel dates are 1-indexed from 1900-01-00 or 1904-01-01
           // This formula is for Windows Excel (1900 base). Mac Excel might use 1904 base.
           // (excelSerialNumber - 25569) * 86400 * 1000 for dates after 1900-03-01 due to leap year bug in Excel for 1900
           // Simpler: (serial - (25567 + 1)) * 86400 * 1000 for dates post 1900, where 25567 is days from 1899-12-30 to 1970-01-01.
           // The `cellDates: true` option in xlsx.read should handle this, but as a fallback:
          date = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
        } else if (typeof dateValue === 'string') {
          date = new Date(dateValue);
        } else {
          warnings.push(`Fila omitida: Formato de fecha no reconocido: ${dateValue}`);
          continue;
        }

        if (isNaN(date.getTime())) {
          warnings.push(`Fila omitida: Fecha inválida '${row[fechaIndex]}'.`);
          continue;
        }

        const description = String(row[descIndex] || '').trim();
        if (!description) {
          warnings.push(`Fila omitida: Descripción vacía.`);
          continue;
        }
        
        // Leer cargos y abonos. Si una columna no existe, su índice será -1.
        const chargeValue = cargosIndex !== -1 ? String(row[cargosIndex] || '0').replace(',', '.') : '0';
        const depositValue = abonosIndex !== -1 ? String(row[abonosIndex] || '0').replace(',', '.') : '0';

        const charge = parseFloat(chargeValue) || 0;
        const deposit = parseFloat(depositValue) || 0;
        
        if (charge === 0 && deposit === 0) {
          // Si ambos son cero y la descripción no es trivial, podría ser una fila informativa.
          // Por ahora, las omitimos si no tienen impacto financiero.
          if (description.length > 5) { // Heurística
             warnings.push(`Fila omitida: Sin monto de cargo o abono para "${description}".`);
          }
          continue;
        }

        if (charge !== 0 && deposit !== 0) {
          warnings.push(`Fila omitida: Contiene tanto cargo (${charge}) como abono (${deposit}) para "${description}". Se procesará como dos transacciones separadas si es necesario en el futuro.`);
          // Podríamos crear dos transacciones aquí, pero por simplicidad, lo omitimos.
          continue;
        }
        
        let amount: number;
        let type: 'ingreso' | 'egreso';

        if (deposit !== 0) {
          amount = deposit;
          type = 'ingreso';
        } else { // charge !== 0
          amount = -Math.abs(charge); // Asegurar que los egresos sean negativos
          type = 'egreso';
        }
        
        transactions.push({
          date: date.toISOString(), // Devolver como ISO string
          description,
          amount,
          type,
        });

      } catch (rowError: any) {
        console.error('Error procesando fila:', row, rowError);
        warnings.push(`Error procesando una fila: ${rowError.message}. Fila: ${row.join(', ')}`);
      }
    }

    if (transactions.length === 0 && warnings.length === 0) {
        return { error: 'No se encontraron transacciones válidas en el archivo.', fileName: originalFileName, warnings };
    }

    return { data: transactions, fileName: originalFileName, warnings };

  } catch (error: any) {
    console.error('Error en processBankStatement:', error);
    return { error: `Error al procesar el archivo Excel: ${error.message}`, fileName: originalFileName };
  }
}
