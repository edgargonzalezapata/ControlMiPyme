
"use client";
// No se necesita useEffect para redirigir, DashboardLayout lo maneja.
// No se necesita usePathname o isInsideDashboardLayout, siempre estará dentro.
import Image from 'next/image';
import { useAuthContext } from '@/context/AuthProvider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, UserCheck2, ShieldCheck, ShieldAlert } from 'lucide-react';
// useToast y Button no son necesarios aquí si no hay acciones específicas.

export default function ProfileDashboardPage() {
  const { user, loading, isFirebaseReady } = useAuthContext(); // AuthProvider ya maneja el loading y redirect.

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
      </Card>
    </div>
  );
}
