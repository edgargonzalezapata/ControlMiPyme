import { db } from './firestore';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  serverTimestamp 
} from 'firebase/firestore';
import type { RecurringService, ServiceBilling } from './recurringServiceTypes';
import { isFirestoreAvailable as checkFirestore } from './firestore';

// Colecciones
const SERVICES_COLLECTION = 'recurringServices';
const BILLINGS_COLLECTION = 'serviceBillings';

// Función de utilidad para verificar si Firestore está disponible
function isFirestoreAvailable(): boolean {
  return checkFirestore();
}

// Funciones para servicios recurrentes
export async function createRecurringService(
  companyId: string,
  serviceData: Omit<RecurringService, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'nextBillingDate'>
): Promise<{ id: string } | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }
    
    // Calcular la próxima fecha de facturación
    const nextBillingDate = calculateNextBillingDate(serviceData.billingDay);
    
    const serviceRef = await addDoc(collection(db!, SERVICES_COLLECTION), {
      ...serviceData,
      companyId,
      nextBillingDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: serviceRef.id };
  } catch (error: any) {
    console.error('Error creating recurring service:', error);
    return { error: `Error al crear el servicio recurrente: ${error.message}` };
  }
}

export async function updateRecurringService(
  serviceId: string,
  serviceData: Partial<Omit<RecurringService, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean } | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }
    
    const serviceRef = doc(db!, SERVICES_COLLECTION, serviceId);
    const serviceSnap = await getDoc(serviceRef);
    
    if (!serviceSnap.exists()) {
      return { error: 'El servicio recurrente no existe' };
    }
    
    // Si se actualiza el día de facturación, recalcular la próxima fecha
    let updateData: any = {
      ...serviceData,
      updatedAt: serverTimestamp()
    };
    
    if (serviceData.billingDay) {
      updateData.nextBillingDate = calculateNextBillingDate(serviceData.billingDay);
    }
    
    await updateDoc(serviceRef, updateData);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating recurring service:', error);
    return { error: `Error al actualizar el servicio recurrente: ${error.message}` };
  }
}

export async function deleteRecurringService(
  serviceId: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }
    
    const serviceRef = doc(db!, SERVICES_COLLECTION, serviceId);
    await deleteDoc(serviceRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting recurring service:', error);
    return { error: `Error al eliminar el servicio recurrente: ${error.message}` };
  }
}

export async function getRecurringService(
  serviceId: string
): Promise<RecurringService | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }
    
    const serviceRef = doc(db!, SERVICES_COLLECTION, serviceId);
    const serviceSnap = await getDoc(serviceRef);
    
    if (!serviceSnap.exists()) {
      return { error: 'El servicio recurrente no existe' };
    }
    
    return { id: serviceId, ...serviceSnap.data() } as RecurringService;
  } catch (error: any) {
    console.error('Error getting recurring service:', error);
    return { error: `Error al obtener el servicio recurrente: ${error.message}` };
  }
}

export async function getCompanyRecurringServices(
  companyId: string
): Promise<RecurringService[] | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }
    
    const servicesQuery = query(
      collection(db!, SERVICES_COLLECTION),
      where('companyId', '==', companyId),
      orderBy('nextBillingDate', 'asc')
    );
    
    const servicesSnap = await getDocs(servicesQuery);
    const services: RecurringService[] = [];
    
    servicesSnap.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() } as RecurringService);
    });
    
    return services;
  } catch (error: any) {
    console.error('Error getting company recurring services:', error);
    return { error: `Error al obtener los servicios recurrentes de la empresa: ${error.message}` };
  }
}

export async function getServicesToInvoice(
  companyId: string
): Promise<RecurringService[] | { error: string }> {
  try {
    console.log(`[getServicesToInvoice] Iniciando búsqueda de servicios para facturar para la empresa: ${companyId}`);
    
    if (!isFirestoreAvailable()) {
      const errorMsg = 'Firestore no está disponible. Verifica la configuración de Firebase.';
      console.error('[getServicesToInvoice] Error:', errorMsg);
      return { error: errorMsg };
    }
    
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    console.log(`[getServicesToInvoice] Fecha actual: ${now.toISOString()}`);
    console.log(`[getServicesToInvoice] Fin del día: ${endOfDay.toISOString()}`);
    
    // Primero, obtener todos los servicios activos de la compañía
    console.log('[getServicesToInvoice] Obteniendo todos los servicios activos...');
    const allServicesQuery = query(
      collection(db!, SERVICES_COLLECTION),
      where('companyId', '==', companyId),
      where('status', '==', 'active')
    );
    
    const allServicesSnap = await getDocs(allServicesQuery);
    console.log(`[getServicesToInvoice] Total de servicios activos: ${allServicesSnap.size}`);
    
    // Luego, obtener solo los que tienen nextBillingDate <= endOfDay
    console.log('[getServicesToInvoice] Buscando servicios con nextBillingDate <=', endOfDay.toISOString());
    const servicesQuery = query(
      collection(db!, SERVICES_COLLECTION),
      where('companyId', '==', companyId),
      where('status', '==', 'active'),
      where('nextBillingDate', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('nextBillingDate', 'asc')
    );
    
    const servicesSnap = await getDocs(servicesQuery);
    console.log(`[getServicesToInvoice] Servicios encontrados para facturar: ${servicesSnap.size}`);
    
    const services: RecurringService[] = [];
    
    servicesSnap.forEach((doc) => {
      const data = doc.data();
      console.log(`[getServicesToInvoice] Servicio ${doc.id}:`, {
        name: data.name,
        nextBillingDate: data.nextBillingDate?.toDate ? data.nextBillingDate.toDate().toISOString() : data.nextBillingDate,
        amount: data.amount,
        billingDay: data.billingDay
      });
      services.push({ id: doc.id, ...data } as RecurringService);
    });
    
    if (servicesSnap.size === 0) {
      console.log('[getServicesToInvoice] No se encontraron servicios para facturar. Verificando posibles problemas...');
      
      // Verificar si hay servicios activos
      if (allServicesSnap.size > 0) {
        console.log(`[getServicesToInvoice] Hay ${allServicesSnap.size} servicios activos pero no cumplen con el filtro de nextBillingDate`);
        allServicesSnap.forEach(doc => {
          const data = doc.data();
          console.log(`[getServicesToInvoice] Servicio activo ${doc.id}:`, {
            name: data.name,
            nextBillingDate: data.nextBillingDate?.toDate ? data.nextBillingDate.toDate().toISOString() : data.nextBillingDate,
            amount: data.amount,
            billingDay: data.billingDay
          });
        });
      } else {
        console.log('[getServicesToInvoice] No hay servicios activos para esta empresa');
      }
    }
    
    return services;
  } catch (error: any) {
    console.error('Error getting services to invoice:', error);
    return { error: `Error al obtener los servicios para facturar: ${error.message}` };
  }
}

// Funciones para facturación de servicios
export async function createServiceBilling(
  serviceId: string,
  companyId: string,
  billingData: Omit<ServiceBilling, 'id' | 'serviceId' | 'companyId' | 'createdAt' | 'updatedAt'>
): Promise<{ id: string } | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }
    
    const billingRef = await addDoc(collection(db!, BILLINGS_COLLECTION), {
      ...billingData,
      serviceId,
      companyId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: billingRef.id };
  } catch (error: any) {
    console.error('Error creating service billing:', error);
    return { error: `Error al crear la facturación del servicio: ${error.message}` };
  }
}

export async function updateServiceBillingStatus(
  billingId: string,
  status: 'pending' | 'paid' | 'overdue',
  paymentDate?: Date,
  notes?: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }
    
    const billingRef = doc(db!, BILLINGS_COLLECTION, billingId);
    const billingSnap = await getDoc(billingRef);
    
    if (!billingSnap.exists()) {
      return { error: 'La facturación no existe' };
    }
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (status === 'paid' && paymentDate) {
      updateData.paymentDate = Timestamp.fromDate(paymentDate);
    }
    
    if (notes) {
      updateData.notes = notes;
    }
    
    await updateDoc(billingRef, updateData);
    
    // Si se marca como pagado, actualizar la próxima fecha de facturación del servicio
    if (status === 'paid') {
      const billingData = billingSnap.data() as ServiceBilling;
      const serviceRef = doc(db!, SERVICES_COLLECTION, billingData.serviceId);
      const serviceSnap = await getDoc(serviceRef);
      
      if (serviceSnap.exists()) {
        const serviceData = serviceSnap.data() as RecurringService;
        const nextBillingDate = calculateNextBillingDate(serviceData.billingDay);
        
        await updateDoc(serviceRef, {
          nextBillingDate,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating service billing status:', error);
    return { error: `Error al actualizar el estado de la facturación: ${error.message}` };
  }
}

export async function getServiceBillings(
  serviceId: string
): Promise<ServiceBilling[] | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }
    
    const billingsQuery = query(
      collection(db!, BILLINGS_COLLECTION),
      where('serviceId', '==', serviceId),
      orderBy('billingDate', 'desc')
    );
    
    const billingsSnap = await getDocs(billingsQuery);
    const billings: ServiceBilling[] = [];
    
    billingsSnap.forEach((doc) => {
      billings.push({ id: doc.id, ...doc.data() } as ServiceBilling);
    });
    
    return billings;
  } catch (error: any) {
    console.error('Error getting service billings:', error);
    return { error: `Error al obtener las facturaciones del servicio: ${error.message}` };
  }
}

export async function getCompanyServiceBillings(
  companyId: string,
  status?: 'pending' | 'paid' | 'overdue'
): Promise<ServiceBilling[] | { error: string }> {
  try {
    console.log(`[getCompanyServiceBillings] Solicitando facturas para empresa ${companyId} con estado:`, status || 'todos');
    
    if (!isFirestoreAvailable()) {
      const errorMsg = 'Firestore no está disponible. Verifica la configuración de Firebase.';
      console.error('[getCompanyServiceBillings] Error:', errorMsg);
      return { error: errorMsg };
    }
    
    let billingsQuery;
    
    if (status) {
      billingsQuery = query(
        collection(db!, BILLINGS_COLLECTION),
        where('companyId', '==', companyId),
        where('status', '==', status),
        orderBy('billingDate', 'desc')
      );
      console.log(`[getCompanyServiceBillings] Consulta con filtro de estado: ${status}`);
    } else {
      billingsQuery = query(
        collection(db!, BILLINGS_COLLECTION),
        where('companyId', '==', companyId),
        orderBy('billingDate', 'desc')
      );
      console.log('[getCompanyServiceBillings] Consulta sin filtro de estado');
    }
    
    console.log('[getCompanyServiceBillings] Ejecutando consulta...');
    const billingsSnap = await getDocs(billingsQuery);
    console.log(`[getCompanyServiceBillings] Consulta completada. Documentos encontrados:`, billingsSnap.size);
    
    const billings: ServiceBilling[] = [];
    
    billingsSnap.forEach((doc) => {
      const data = doc.data();
      console.log(`[getCompanyServiceBillings] Procesando factura ${doc.id}:`, {
        status: data.status,
        amount: data.amount,
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate().toISOString() : data.dueDate,
        billingDate: data.billingDate?.toDate ? data.billingDate.toDate().toISOString() : data.billingDate
      });
      billings.push({ id: doc.id, ...data } as ServiceBilling);
    });
    
    console.log(`[getCompanyServiceBillings] Total de facturas procesadas: ${billings.length}`);
    return billings;
  } catch (error: any) {
    console.error('Error getting company service billings:', error);
    return { error: `Error al obtener las facturaciones de servicios de la empresa: ${error.message}` };
  }
}

// Función para generar facturas automáticamente
export async function generatePendingInvoices(
  companyId: string
): Promise<{ generated: number } | { error: string }> {
  try {
    if (!isFirestoreAvailable()) {
      return { error: 'Firestore no está disponible. Verifica la configuración de Firebase.' };
    }
    
    console.log(`[generatePendingInvoices] Iniciando generación de facturas para empresa: ${companyId}`);
    
    // Obtener todos los servicios activos
    const servicesResult = await getCompanyRecurringServices(companyId);
    if ('error' in servicesResult) {
      return { error: servicesResult.error };
    }
    
    const activeServices = servicesResult.filter(s => s.status === 'active');
    console.log(`[generatePendingInvoices] Servicios activos encontrados: ${activeServices.length}`);
    
    // Obtener todas las facturas existentes
    const existingBillings = await getCompanyServiceBillings(companyId);
    if ('error' in existingBillings) {
      return { error: existingBillings.error };
    }
    
    const now = new Date();
    const tenDaysFromNow = new Date(now);
    tenDaysFromNow.setDate(now.getDate() + 10);
    
    console.log(`[generatePendingInvoices] Fecha actual: ${now.toISOString()}`);
    console.log(`[generatePendingInvoices] Marcando facturas como pendientes 10 días antes: ${tenDaysFromNow.toISOString()}`);
    
    let generatedCount = 0;
    
    // Procesar cada servicio activo
    for (const service of activeServices) {
      try {
        const billingDate = new Date(service.nextBillingDate.toDate());
        
        // Verificar si ya existe una factura para este servicio en este mes/año
        const existingBilling = existingBillings.find(b => {
          const bDate = b.billingDate.toDate();
          return (
            b.serviceId === service.id &&
            bDate.getMonth() === billingDate.getMonth() &&
            bDate.getFullYear() === billingDate.getFullYear()
          );
        });
        
        if (existingBilling) {
          // Si la factura ya existe, verificamos si necesita ser actualizada a 'pending'
          if (existingBilling.status !== 'pending' && 
              existingBilling.dueDate.toDate() <= tenDaysFromNow) {
            console.log(`[generatePendingInvoices] Actualizando factura existente a 'pending' para servicio ${service.name}`);
            await updateServiceBillingStatus(existingBilling.id, 'pending');
            generatedCount++;
          }
          continue;
        }
        
        // Si no existe factura para este período, creamos una nueva
        if (billingDate <= tenDaysFromNow) {
          console.log(`[generatePendingInvoices] Creando nueva factura para servicio: ${service.name}`);
          
          const dueDate = new Date(billingDate);
          dueDate.setDate(dueDate.getDate() + 15); // Vencimiento a 15 días
          
          const billingData: Omit<ServiceBilling, 'id' | 'serviceId' | 'companyId' | 'createdAt' | 'updatedAt'> = {
            billingDate: Timestamp.fromDate(billingDate),
            dueDate: Timestamp.fromDate(dueDate),
            amount: service.amount,
            status: 'pending'
          };
          
          // Añadir nombre del servicio si está disponible
          if ('name' in service) {
            (billingData as any).serviceName = (service as any).name;
          }
          
          const result = await createServiceBilling(service.id, companyId, billingData);
          
          if (!('error' in result)) {
            generatedCount++;
            
            // Actualizar la próxima fecha de facturación del servicio
            const nextBillingDate = new Date(billingDate);
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            
            await updateRecurringService(service.id, {
              nextBillingDate: Timestamp.fromDate(nextBillingDate)
            });
          }
        }
      } catch (error) {
        console.error(`[generatePendingInvoices] Error procesando servicio ${service.id}:`, error);
      }
    }
    
    console.log(`[generatePendingInvoices] Proceso completado. Facturas generadas/actualizadas: ${generatedCount}`);
    return { generated: generatedCount };
    
  } catch (error: any) {
    console.error('[generatePendingInvoices] Error inesperado:', error);
    return { error: `Error al generar facturas pendientes: ${error.message}` };
  }
}

// Función auxiliar para calcular la próxima fecha de facturación
function calculateNextBillingDate(billingDay: number): Timestamp {
  const now = new Date();
  let nextBillingDate: Date;
  
  // Asegurarse de que el día de facturación esté entre 1 y 31
  const day = Math.min(Math.max(billingDay, 1), 31);
  
  // Si el día actual es menor al día de facturación, la próxima fecha es este mes
  if (now.getDate() < day) {
    nextBillingDate = new Date(now.getFullYear(), now.getMonth(), day);
  } else {
    // Si no, la próxima fecha es el próximo mes
    nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 1, day);
  }
  
  // Ajustar si el día no existe en el mes (ej. 31 de febrero)
  while (nextBillingDate.getDate() !== day) {
    nextBillingDate.setDate(nextBillingDate.getDate() - 1);
  }
  
  return Timestamp.fromDate(nextBillingDate);
}
