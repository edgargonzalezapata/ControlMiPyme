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

    const jsonData: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, raw: false });

    if (jsonData.length < 2) {
      return { error: 'El archivo no contiene suficientes datos (mínimo cabecera y una fila).', fileName: originalFileName };
    }

    const headerRow = jsonData.shift() as string[]; 
    if (!headerRow || headerRow.length === 0) { // Adjusted to check for empty headerRow
      return { error: 'Formato de cabecera de archivo no esperado o cabecera vacía.', fileName: originalFileName };
    }
    
    const normalizeHeader = (header: string) => header ? header.trim().toLowerCase() : "";

    const fechaIndex = headerRow.findIndex(h => normalizeHeader(h).includes('fecha'));
    const descIndex = headerRow.findIndex(h => normalizeHeader(h).includes('descripción') || normalizeHeader(h).includes('descripcion'));
    const cargosIndex = headerRow.findIndex(h => normalizeHeader(h).includes('cargo') || normalizeHeader(h).includes('cheque'));
    const abonosIndex = headerRow.findIndex(h => normalizeHeader(h).includes('abono') || normalizeHeader(h).includes('depósito'));

    if (fechaIndex === -1 || descIndex === -1 || (cargosIndex === -1 && abonosIndex === -1) ) {
        let missing = [];
        if (fechaIndex === -1) missing.push("Fecha");
        if (descIndex === -1) missing.push("Descripción/Descripcion");
        if (cargosIndex === -1 && abonosIndex === -1) missing.push("Cargos/Cheques o Abonos/Depósitos");
        return { error: `Columnas esperadas no encontradas: ${missing.join(', ')}. Cabeceras encontradas: ${headerRow.join(', ')}`, fileName: originalFileName };
    }

    const transactions: ParsedTransaction[] = [];
    const warnings: string[] = [];

    const parseAmount = (value: string): number => {
      if (!value) return 0;
      // Para valores en formato CLP:
      // 1. Remover símbolos '$' y espacios
      // 2. Remover puntos (separadores de miles en CLP)
      // 3. La coma es un separador de miles, NO un separador decimal
      // 4. Interpretar todo el número como un entero
      
      // Limpiamos el valor quitando '$', espacios y puntos
      let cleanedValue = String(value).replace(/\$/g, '').replace(/\s/g, '').replace(/\./g, '');
      
      // Si hay comas, las tratamos como separadores de miles y las eliminamos
      cleanedValue = cleanedValue.replace(/,/g, '');
      
      // Convertimos a número entero
      return parseInt(cleanedValue, 10) || 0;
    };

    for (const row of jsonData) {
      if (!row || row.every(cell => cell === null || cell === undefined || String(cell).trim() === "")) {
        continue; 
      }

      try {
        const dateValue = row[fechaIndex];
        let date: Date;

        if (dateValue instanceof Date) {
          date = dateValue;
        } else if (typeof dateValue === 'number') { 
          date = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
        } else if (typeof dateValue === 'string') {
          const parts = dateValue.split('/');
          if (parts.length === 2) { // DD/MM format
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
            const year = new Date().getFullYear(); // Assume current year
            date = new Date(year, month, day);
          } else if (parts.length === 3) { // DD/MM/YY or DD/MM/YYYY
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            let year = parseInt(parts[2], 10);
            if (year < 100) { // YY format
              year += 2000; // Assume 20xx
            }
            date = new Date(year, month, day);
          } else {
            warnings.push(`Fila omitida: Formato de fecha string no reconocido: ${dateValue}`);
            continue;
          }
        } else {
          warnings.push(`Fila omitida: Tipo de dato de fecha no reconocido: ${typeof dateValue} para valor ${dateValue}`);
          continue;
        }

        if (isNaN(date.getTime())) {
          warnings.push(`Fila omitida: Fecha inválida '${row[fechaIndex]}'.`);
          continue;
        }

        const description = String(row[descIndex] || '').trim();
        if (!description) {
          // warnings.push(`Fila omitida: Descripción vacía.`); // Allow empty descriptions if amounts are present
        }
        
        const chargeValue = cargosIndex !== -1 ? String(row[cargosIndex] || '0') : '0';
        const depositValue = abonosIndex !== -1 ? String(row[abonosIndex] || '0') : '0';

        const charge = parseAmount(chargeValue);
        const deposit = parseAmount(depositValue);
        
        if (charge === 0 && deposit === 0) {
          if (description.length > 3) { // Only warn if description is not trivial
             warnings.push(`Fila con descripción "${description}" omitida: Sin monto de cargo o abono.`);
          }
          continue;
        }

        if (charge !== 0 && deposit !== 0) {
          warnings.push(`Fila para "${description}" tiene tanto cargo (${charge}) como abono (${deposit}). Se procesará como dos transacciones separadas si es necesario en el futuro o se puede ajustar esta lógica.`);
          // For now, we could prioritize one or skip. Let's skip to avoid ambiguity without further rules.
          // Or, create two transactions? For simplicity, let's take the first non-zero one or create two.
          // Creating two separate transactions:
          if (deposit !== 0) {
             transactions.push({
                date: date.toISOString(),
                description: `${description} (Abono)`,
                amount: deposit,
                type: 'ingreso',
            });
          }
          if (charge !== 0) {
             transactions.push({
                date: date.toISOString(),
                description: `${description} (Cargo)`,
                amount: -Math.abs(charge),
                type: 'egreso',
            });
          }
          continue; // Continue as we've handled this row.
        }
        
        let amount: number;
        let type: 'ingreso' | 'egreso';

        if (deposit !== 0) {
          amount = deposit;
          type = 'ingreso';
        } else { // charge !== 0
          amount = -Math.abs(charge); 
          type = 'egreso';
        }
        
        transactions.push({
          date: date.toISOString(),
          description,
          amount,
          type,
        });

      } catch (rowError: any) {
        console.error('Error procesando fila:', row, rowError);
        warnings.push(`Error procesando una fila: ${rowError.message}. Fila: ${row ? row.join(', ') : 'FILA INDEFINIDA'}`);
      }
    }

    if (transactions.length === 0 && warnings.length === 0) {
        return { error: 'No se encontraron transacciones válidas en el archivo.', fileName: originalFileName, warnings };
    } else if (transactions.length === 0 && warnings.length > 0) {
        return { error: 'No se extrajeron transacciones. Revise las advertencias.', fileName: originalFileName, warnings };
    }


    return { data: transactions, fileName: originalFileName, warnings };

  } catch (error: any) {
    console.error('Error en processBankStatement:', error);
    return { error: `Error al procesar el archivo Excel: ${error.message}`, fileName: originalFileName };
  }
}
