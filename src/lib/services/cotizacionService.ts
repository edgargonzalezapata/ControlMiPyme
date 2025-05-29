import { collection, addDoc, getFirestore, doc, updateDoc, deleteDoc, getDocs, query, where, orderBy, Timestamp, getDoc, limit } from 'firebase/firestore';
import { app } from '../firebase';

// Inicializar Firestore
if (!app) {
  throw new Error('Firebase app is not initialized');
}
const db = getFirestore(app);

// Tipos
export interface ItemCotizacion {
  id?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  impuesto: number;
  total: number;
}

export interface Cotizacion {
  id?: string;
  numero: string;
  clienteId: string;
  clienteNombre: string;
  clienteRut: string;
  clienteEmail: string;
  fecha: Date;
  fechaVencimiento: Date;
  items: ItemCotizacion[];
  subtotal: number;
  impuestos: number;
  total: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'vencida';
  observaciones?: string;
  empresaId: string;
  creadoPor: string;
  creadoEn: Date;
  actualizadoEn: Date;
}

// Crear una nueva cotización
export const crearCotizacion = async (cotizacion: Omit<Cotizacion, 'id' | 'creadoEn' | 'actualizadoEn'>): Promise<string> => {
  try {
    const cotizacionRef = await addDoc(collection(db, 'cotizaciones'), {
      ...cotizacion,
      fecha: Timestamp.fromDate(new Date(cotizacion.fecha)),
      fechaVencimiento: Timestamp.fromDate(new Date(cotizacion.fechaVencimiento)),
      creadoEn: Timestamp.now(),
      actualizadoEn: Timestamp.now(),
    });
    
    return cotizacionRef.id;
  } catch (error) {
    console.error('Error al crear la cotización:', error);
    throw new Error('No se pudo crear la cotización');
  }
};

// Actualizar una cotización existente
export const actualizarCotizacion = async (id: string, cotizacion: Partial<Cotizacion>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'cotizaciones', id), {
      ...cotizacion,
      ...(cotizacion.fecha && { fecha: Timestamp.fromDate(new Date(cotizacion.fecha)) }),
      ...(cotizacion.fechaVencimiento && { fechaVencimiento: Timestamp.fromDate(new Date(cotizacion.fechaVencimiento)) }),
      actualizadoEn: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error al actualizar la cotización:', error);
    throw new Error('No se pudo actualizar la cotización');
  }
};

// Eliminar una cotización
export const eliminarCotizacion = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'cotizaciones', id));
  } catch (error) {
    console.error('Error al eliminar la cotización:', error);
    throw new Error('No se pudo eliminar la cotización');
  }
};

// Obtener una cotización por ID
export const obtenerCotizacion = async (id: string): Promise<Cotizacion | null> => {
  try {
    const docRef = doc(db, 'cotizaciones', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        fecha: data.fecha?.toDate(),
        fechaVencimiento: data.fechaVencimiento?.toDate(),
        creadoEn: data.creadoEn?.toDate(),
        actualizadoEn: data.actualizadoEn?.toDate(),
      } as Cotizacion;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error al obtener la cotización:', error);
    throw new Error('No se pudo obtener la cotización');
  }
};

// Listar cotizaciones con filtros
export const listarCotizaciones = async (empresaId: string, filtros: {
  estado?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  clienteId?: string;
} = {}): Promise<Cotizacion[]> => {
  try {
    let q = query(
      collection(db, 'cotizaciones'),
      where('empresaId', '==', empresaId),
      orderBy('fecha', 'desc')
    );
    
    // Aplicar filtros adicionales si existen
    if (filtros.estado) {
      q = query(q, where('estado', '==', filtros.estado));
    }
    
    if (filtros.clienteId) {
      q = query(q, where('clienteId', '==', filtros.clienteId));
    }
    
    if (filtros.fechaInicio && filtros.fechaFin) {
      q = query(
        q,
        where('fecha', '>=', Timestamp.fromDate(new Date(filtros.fechaInicio))),
        where('fecha', '<=', Timestamp.fromDate(new Date(filtros.fechaFin)))
      );
    }
    
    const querySnapshot = await getDocs(q);
    const cotizaciones: Cotizacion[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      cotizaciones.push({
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate(),
        fechaVencimiento: data.fechaVencimiento?.toDate(),
        creadoEn: data.creadoEn?.toDate(),
        actualizadoEn: data.actualizadoEn?.toDate(),
      } as Cotizacion);
    });
    
    return cotizaciones;
  } catch (error) {
    console.error('Error al listar las cotizaciones:', error);
    throw new Error('No se pudieron listar las cotizaciones');
  }
};

// Generar número de cotización secuencial
export const generarNumeroCotizacion = async (empresaId: string): Promise<string> => {
  try {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    
    // Obtener el último número de cotización para hoy
    const q = query(
      collection(db, 'cotizaciones'),
      where('empresaId', '==', empresaId),
      where('fecha', '>=', Timestamp.fromDate(new Date(hoy.setHours(0, 0, 0, 0)))),
      where('fecha', '<=', Timestamp.fromDate(new Date(hoy.setHours(23, 59, 59, 999)))),
      orderBy('fecha', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    let siguienteNumero = 1;
    if (!querySnapshot.empty) {
      const ultimaCotizacion = querySnapshot.docs[0].data();
      if (ultimaCotizacion.numero) {
        const ultimoNumeroStr = ultimaCotizacion.numero.split('-').pop() || '0000';
        siguienteNumero = parseInt(ultimoNumeroStr, 10) + 1;
      }
    }
    
    return `COT-${anio}${mes}${dia}-${String(siguienteNumero).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error al generar el número de cotización:', error);
    // En caso de error, devolver un número basado en la fecha y hora actual
    const ahora = new Date();
    return `COT-${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}-${String(ahora.getHours()).padStart(2, '0')}${String(ahora.getMinutes()).padStart(2, '0')}${String(ahora.getSeconds()).padStart(2, '0')}`;
  }
};
