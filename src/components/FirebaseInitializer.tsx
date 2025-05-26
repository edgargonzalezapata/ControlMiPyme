'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Importaciones dinámicas para asegurar que solo se carguen en el cliente
let app: any = null;
let db: any = null;
let isFirestoreAvailable: () => boolean = () => false;

interface FirebaseInitializerProps {
  children: React.ReactNode;
}

export function FirebaseInitializer({ children }: FirebaseInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFirebase = async () => {
      try {
        // Importar Firebase y Firestore dinámicamente solo en el cliente
        const firebaseModule = await import('@/lib/firebase');
        const firestoreModule = await import('@/lib/firestore');
        
        // Asignar las referencias
        app = firebaseModule.app;
        db = firestoreModule.db;
        isFirestoreAvailable = firestoreModule.isFirestoreAvailable;
        
        // Verificar si Firebase está inicializado
        if (!app) {
          console.error('Firebase no está inicializado correctamente');
          setError('Firebase no está inicializado correctamente. Verifica la configuración en .env.local');
          return;
        }
        
        // Verificar si Firestore está disponible
        if (!isFirestoreAvailable()) {
          console.error('Firestore no está disponible');
          setError('Firestore no está disponible. Verifica la configuración de Firebase.');
          return;
        }
        
        console.log('Firebase y Firestore inicializados correctamente');
        setIsInitialized(true);
      } catch (error) {
        console.error('Error al inicializar Firebase:', error);
        setError('Error al inicializar Firebase. Verifica la consola para más detalles.');
      }
    };
    
    loadFirebase();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error de inicialización</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Verifica la configuración de Firebase en el archivo .env.local y asegúrate de que las variables de entorno estén correctamente definidas.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
