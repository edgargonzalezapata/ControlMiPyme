
"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import Image from 'next/image';
import { useAuthContext } from '@/context/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, UserCheck2, ShieldX, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, loading, isFirebaseReady } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseReady && !loading) {
        toast({
            title: "Servicio de Autenticación No Disponible",
            description: "No se pudo conectar con el servicio de autenticación. Serás redirigido.",
            variant: "destructive"
        });
        router.push('/');
        return;
    }

    if (isFirebaseReady && !loading && !user) {
      toast({
        title: "Acceso Denegado",
        description: "Debes iniciar sesión para ver esta página.",
        variant: "destructive"
      });
      router.push('/');
    }
  }, [user, loading, router, toast, isFirebaseReady]);

  const isInsideDashboardLayout = pathname.startsWith('/dashboard');

  if (!isInsideDashboardLayout && (loading || !isFirebaseReady)) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  if (!isInsideDashboardLayout && !user && isFirebaseReady) {
    return (
        <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center text-center p-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Verificando sesión, serás redirigido si no estás autenticado...</p>
        </div>
    );
  }
  
  if (!user && isFirebaseReady && loading) { // Still loading user info but firebase is ready
     return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando datos del perfil...</p>
      </div>
    );
  }
  
  if (!user) { // Should be caught by useEffect, but as a final fallback
    return null;
  }


  return (
    <div className="flex flex-col items-center justify-center"> {/* Removed py-8 sm:py-12 if inside dashboard */}
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
           {/* The main sign out button is in the Navbar via AuthButtons component */}
           <p className="text-xs text-muted-foreground">Puedes cerrar sesión desde el menú de navegación superior.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
