"use client";
// No se necesita useEffect para redirigir, DashboardLayout lo maneja.
// No se necesita usePathname o isInsideDashboardLayout, siempre estará dentro.
import Image from 'next/image';
import { useAuthContext } from '@/context/AuthProvider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, UserCheck2, ShieldCheck, ShieldAlert, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firestore"; // Import db
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";

export default function ProfileDashboardPage() {
  const { user, loading, isFirebaseReady } = useAuthContext(); // AuthProvider ya maneja el loading y redirect.
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState(true);

  // Memoize expectedConfirmationText
  const expectedConfirmationText = useMemo(() => {
    return user?.email?.split('@')[0] || "confirmar";
  }, [user?.email]);

  useEffect(() => {
    if (isDeleteDialogOpen) {
      setIsDeleteButtonDisabled(confirmationText !== expectedConfirmationText);
    } else {
      // Reset when dialog is closed
      setConfirmationText("");
      setIsDeleteButtonDisabled(true);
    }
  }, [confirmationText, isDeleteDialogOpen, expectedConfirmationText]);

  // El DashboardLayout ya muestra un cargador y maneja la redirección si no hay usuario.
  // Si llegamos aquí, el usuario debería estar cargado o cargándose por el AuthProvider.
  // No necesitamos el loader grande de página completa aquí, el DashboardLayout se encarga.
  if (loading || !isFirebaseReady) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }
  
  if (!user) { 
    // Esto no debería ocurrir si DashboardLayout funciona correctamente, pero es un fallback.
    return (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
            <p className="text-muted-foreground">Usuario no encontrado. Serás redirigido.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-lg shadow-xl rounded-lg overflow-hidden transform transition-all hover:shadow-2xl">
        <CardHeader className="bg-muted/20 p-6 sm:p-8 text-center border-b">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt="Foto de perfil"
              width={100}
              height={100}
              className="rounded-full mx-auto mb-4 border-4 border-primary shadow-lg"
              data-ai-hint="profile avatar"
              priority
            />
          ) : (
            <div className="w-24 h-24 bg-primary text-primary-foreground flex items-center justify-center rounded-full mx-auto mb-4 border-4 border-primary/50 shadow-lg text-4xl">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCheck2 size={48} />}
            </div>
          )}
          <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">{user.displayName || 'Usuario Autenticado'}</CardTitle>
          <CardDescription className="text-sm sm:text-md text-muted-foreground mt-1">
            Esta es la información de tu perfil obtenida de Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start space-x-4 p-3 bg-background rounded-md shadow-sm border border-transparent hover:border-primary/30 transition-colors">
            <UserCheck2 className="h-6 w-6 text-primary mt-1 shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Nombre Completo</p>
              <p className="text-md sm:text-lg font-medium text-foreground">{user.displayName || 'No disponible'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-4 p-3 bg-background rounded-md shadow-sm border border-transparent hover:border-primary/30 transition-colors">
            <Mail className="h-6 w-6 text-primary mt-1 shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Correo Electrónico</p>
              <p className="text-md sm:text-lg font-medium text-foreground">{user.email || 'No disponible'}</p>
            </div>
          </div>
          {user.emailVerified !== undefined && (
             <div className="flex items-start space-x-4 p-3 bg-background rounded-md shadow-sm border border-transparent hover:border-primary/30 transition-colors">
                {user.emailVerified ?
                    <ShieldCheck className="h-6 w-6 text-green-500 mt-1 shrink-0" /> :
                    <ShieldAlert className="h-6 w-6 text-yellow-500 mt-1 shrink-0" />
                }
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Verificación de Correo</p>
                    <p className={`text-md sm:text-lg font-medium ${user.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                        {user.emailVerified ? 'Verificado' : 'No Verificado'}
                    </p>
                </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 bg-muted/20 border-t flex justify-center">
           <p className="text-xs text-muted-foreground">Puedes cerrar sesión desde el menú de navegación superior.</p>
        </CardFooter>

        <CardFooter className="p-6 border-t bg-destructive/10 dark:bg-destructive/20 flex flex-col items-start space-y-3">
          <CardTitle className="text-lg text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
          <CardDescription className="text-destructive/80 text-sm">
            Las acciones en esta sección son permanentes y no se pueden deshacer. Procede con precaución.
          </CardDescription>
          
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Mis Datos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive"/>
                  ¿Estás absolutamente seguro?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left">
                  Esta acción es irreversible. Se eliminarán todas tus empresas, cuentas bancarias asociadas y transacciones.
                </AlertDialogDescription>
                <div className="mt-2 space-y-2 text-sm">
                  <strong className="text-destructive">Todos los datos que hayas ingresado se perderán permanentemente.</strong>
                  <div>Esta acción no eliminará tu cuenta de Google, solo los datos almacenados en Control MiPyme.</div>
                  <div className="mt-2">Por favor, escribe <strong className="text-destructive">{expectedConfirmationText}</strong> para confirmar.</div>
                </div>
              </AlertDialogHeader>
              <Input 
                type="text" 
                value={confirmationText} 
                onChange={(e) => setConfirmationText(e.target.value)} 
                placeholder={`Escribe "${expectedConfirmationText}"`} 
                className="mt-2 border-destructive/50 focus-visible:ring-destructive"
              />
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  disabled={isDeleteButtonDisabled}
                  onClick={async () => {
                    if (user?.uid) {
                      await handleDeleteData(user.uid, toast);
                      setIsDeleteDialogOpen(false); // Close dialog after action
                    } else {
                      toast({
                        title: "Error de Usuario",
                        description: "No se pudo obtener la identificación del usuario para la eliminación.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sí, eliminar todos mis datos
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>

      </Card>
    </div>
  );
}

// Actualizada la firma y lógica de handleDeleteData
async function handleDeleteData(uid: string, toast: (options: any) => void) {
  if (!db) {
    toast({
      title: "Error de Base de Datos",
      description: "No se pudo conectar a la base de datos.",
      variant: "destructive",
    });
    return;
  }

  // Mostramos toast de inicio del proceso
  toast({
    title: "Iniciando proceso...",
    description: "Consultando tus empresas...",
  });

  try {
    // 1. Primero consultamos las empresas donde el usuario es propietario
    // Usamos una consulta más directa y simple compatible con las reglas de Firestore
    const companiesQuery = query(
      collection(db, "companies"), 
      where("ownerUid", "==", uid)
    );
    
    const companiesSnapshot = await getDocs(companiesQuery);
    
    if (companiesSnapshot.empty) {
      toast({
        title: "No tienes empresas",
        description: "No se encontraron empresas de las que seas propietario.",
        variant: "info",
      });
      return;
    }

    let totalEmpresas = companiesSnapshot.size;
    let eliminadas = 0;
    let noEliminadas = 0;
    
    toast({
      title: `Encontradas ${totalEmpresas} empresas`,
      description: "Iniciando proceso de eliminación...",
    });

    // Intentar eliminar cada empresa una por una
    for (const companyDoc of companiesSnapshot.docs) {
      try {
        // Verificación adicional del propietario
        const companyData = companyDoc.data();
        if (companyData.ownerUid !== uid) {
          console.warn(`No eres propietario de la empresa ${companyDoc.id}, omitiendo`);
          noEliminadas++;
          continue;
        }
        
        await deleteDoc(companyDoc.ref);
        console.log(`Empresa eliminada: ${companyDoc.id}`);
        eliminadas++;
      } catch (error) {
        console.error(`Error al eliminar empresa ${companyDoc.id}:`, error);
        noEliminadas++;
      }
    }

    // Informar al usuario sobre el resultado
    if (eliminadas > 0) {
      toast({
        title: "Proceso completado",
        description: `Se eliminaron ${eliminadas} de ${totalEmpresas} empresas. Las cuentas bancarias y transacciones asociadas requieren limpieza manual.`,
        variant: "success",
        duration: 5000
      });
    } else {
      toast({
        title: "No se pudo eliminar nada",
        description: "No se logró eliminar ninguna empresa. Es posible que no tengas los permisos necesarios.",
        variant: "destructive",
        duration: 5000
      });
    }
  } catch (error) {
    console.error("Error al procesar la eliminación de datos:", error);
    toast({
      title: "Error en el proceso",
      description: "Ocurrió un error al intentar eliminar tus datos. Por favor, contacta al administrador.",
      variant: "destructive",
      duration: 5000
    });
  }
}
