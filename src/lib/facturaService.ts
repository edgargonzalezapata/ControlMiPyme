import { db } from './firestore';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  serverTimestamp 
} from 'firebase/firestore';
import { Factura, FacturaConEstado, EstadoFactura } from '@/types/factura';
import { isFirestoreAvailable } from './firestore';

const FACTURAS_COLLECTION = 'facturas';

/**
 * Verifica si una factura ya existe en la base de datos
 * @param empresaId ID de la empresa
 * @param folio Folio de la factura
 * @param rutEmisor RUT del emisor
 * @param rutReceptor RUT del receptor
 * @returns true si la factura ya existe, false si no existe, o un objeto de error
 */
export async function checkFacturaDuplicada(
  empresaId: string,
  folio: string,
  rutEmisor: string,
  rutReceptor: string
): Promise<boolean | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }

    if (!empresaId) {
      return { error: 'Se requiere el ID de la empresa' };
    }

    // Consulta para buscar facturas con el mismo folio, emisor y receptor
    const q = query(
      collection(db!, FACTURAS_COLLECTION),
      where('empresaId', '==', empresaId),
      where('folio', '==', folio),
      where('rutEmisor', '==', rutEmisor),
      where('rutReceptor', '==', rutReceptor)
    );

    const querySnapshot = await getDocs(q);
    
    // Si hay resultados, la factura ya existe
    return !querySnapshot.empty;
  } catch (error: any) {
    console.error('Error al verificar factura duplicada:', error);
    return { error: `Error al verificar factura duplicada: ${error.message}` };
  }
}

/**
 * Obtiene las facturas emitidas por una empresa (donde la empresa es el emisor)
 * @param empresaId ID de la empresa
 * @returns Array de facturas emitidas o un objeto de error
 */
export async function getFacturasByEmpresa(empresaId: string): Promise<FacturaConEstado[] | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }

    if (!empresaId) {
      return { error: 'Se requiere el ID de la empresa' };
    }

    // Obtenemos todas las facturas de la empresa y filtramos por tipo
    const q = query(
      collection(db!, FACTURAS_COLLECTION),
      where('empresaId', '==', empresaId),
      orderBy('fechaEmision', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    const facturas: FacturaConEstado[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Solo incluimos las facturas que NO son recibidas
      if (data.tipoDocumento !== 'factura_recibida') {
        facturas.push({
          id: doc.id,
          ...data,
          // Asegurarse de que las fechas sean manejadas correctamente
          fechaEmision: data.fechaEmision?.toDate ? data.fechaEmision.toDate().toISOString() : data.fechaEmision,
          fechaVencimiento: data.fechaVencimiento?.toDate ? data.fechaVencimiento.toDate().toISOString() : data.fechaVencimiento,
          fechaPago: data.fechaPago?.toDate ? data.fechaPago.toDate().toISOString() : data.fechaPago,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as FacturaConEstado);
      }
    });

    return facturas;
  } catch (error: any) {
    console.error('Error al obtener las facturas emitidas:', error);
    return { error: `Error al obtener las facturas emitidas: ${error.message}` };
  }
}

/**
 * Obtiene las facturas recibidas por una empresa (donde la empresa es el receptor)
 * @param empresaId ID de la empresa
 * @returns Array de facturas recibidas o un objeto de error
 */
export async function getFacturasRecibidasByEmpresa(empresaId: string): Promise<FacturaConEstado[] | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }

    if (!empresaId) {
      return { error: 'Se requiere el ID de la empresa' };
    }

    // Obtenemos todas las facturas de la empresa y filtramos por tipo
    const q = query(
      collection(db!, FACTURAS_COLLECTION),
      where('empresaId', '==', empresaId),
      orderBy('fechaEmision', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    const facturas: FacturaConEstado[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Solo incluimos las facturas que son recibidas
      if (data.tipoDocumento === 'factura_recibida') {
        facturas.push({
          id: doc.id,
          ...data,
          // Asegurarse de que las fechas sean manejadas correctamente
          fechaEmision: data.fechaEmision?.toDate ? data.fechaEmision.toDate().toISOString() : data.fechaEmision,
          fechaVencimiento: data.fechaVencimiento?.toDate ? data.fechaVencimiento.toDate().toISOString() : data.fechaVencimiento,
          fechaPago: data.fechaPago?.toDate ? data.fechaPago.toDate().toISOString() : data.fechaPago,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as FacturaConEstado);
      }
    });

    return facturas;
  } catch (error: any) {
    console.error('Error al obtener las facturas recibidas:', error);
    return { error: `Error al obtener las facturas recibidas: ${error.message}` };
  }
}

/**
 * Obtiene una factura por su ID
 * @param facturaId ID de la factura
 * @returns La factura o un objeto de error
 */
export async function getFacturaById(facturaId: string): Promise<FacturaConEstado | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }

    if (!facturaId) {
      return { error: 'Se requiere el ID de la factura' };
    }

    console.log('Obteniendo factura con ID:', facturaId);
    const docRef = doc(db!, FACTURAS_COLLECTION, facturaId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error('No se encontró la factura con ID:', facturaId);
      return { error: 'La factura no existe' };
    }

    const data = docSnap.data();
    console.log('Datos de la factura desde Firestore:', JSON.stringify(data, null, 2));
    
    const factura = {
      id: docSnap.id,
      ...data,
      // Asegurarse de que los detalles existan y sean un array
      detalles: Array.isArray(data.detalles) ? data.detalles : [],
      // Asegurarse de que las fechas sean manejadas correctamente
      fechaEmision: data.fechaEmision?.toDate ? data.fechaEmision.toDate().toISOString() : data.fechaEmision,
      fechaVencimiento: data.fechaVencimiento?.toDate ? data.fechaVencimiento.toDate().toISOString() : data.fechaVencimiento,
      fechaPago: data.fechaPago?.toDate ? data.fechaPago.toDate().toISOString() : data.fechaPago,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
    } as FacturaConEstado;

    console.log('Factura procesada:', JSON.stringify(factura, null, 2));
    return factura;
  } catch (error: any) {
    console.error('Error al obtener la factura:', error);
    return { error: `Error al obtener la factura: ${error.message}` };
  }
}

/**
 * Crea una nueva factura
 * @param factura Datos de la factura
 * @returns El ID de la factura creada o un objeto de error
 */
export async function createFactura(factura: Omit<Factura, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string } | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }

    if (!factura.empresaId) {
      return { error: 'Se requiere el ID de la empresa' };
    }

    const facturaData = {
      ...factura,
      estado: 'pendiente' as EstadoFactura,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db!, FACTURAS_COLLECTION), facturaData);
    
    return { id: docRef.id };
  } catch (error: any) {
    console.error('Error al crear la factura:', error);
    return { error: `Error al crear la factura: ${error.message}` };
  }
}

/**
 * Actualiza una factura existente
 * @param facturaId ID de la factura a actualizar
 * @param updates Campos a actualizar
 * @returns Objeto con éxito o error
 */
export async function updateFactura(
  facturaId: string, 
  updates: Partial<Omit<FacturaConEstado, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean } | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }

    if (!facturaId) {
      return { error: 'Se requiere el ID de la factura' };
    }

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    const docRef = doc(db!, FACTURAS_COLLECTION, facturaId);
    await updateDoc(docRef, updateData);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error al actualizar la factura:', error);
    return { error: `Error al actualizar la factura: ${error.message}` };
  }
}

/**
 * Elimina una factura
 * @param facturaId ID de la factura a eliminar
 * @returns Objeto con éxito o error
 */
export async function deleteFactura(facturaId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }

    if (!facturaId) {
      return { error: 'Se requiere el ID de la factura' };
    }

    const docRef = doc(db!, FACTURAS_COLLECTION, facturaId);
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar la factura:', error);
    return { error: `Error al eliminar la factura: ${error.message}` };
  }
}
