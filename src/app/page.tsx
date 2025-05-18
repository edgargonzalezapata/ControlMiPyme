
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthProvider';
import { Button } from '@/components/ui/button';
// Card components are not used in the new design directly, but kept for potential future use
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithGoogle } from '@/lib/authService';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { user, loading, isFirebaseReady } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isFirebaseReady && !loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router, isFirebaseReady]);

  const handleSignIn = async () => {
    if (!isFirebaseReady) {
      toast({
        title: "Servicio no disponible",
        description: "La autenticación no está lista. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
      return;
    }
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in failed", error);
      toast({
        title: "Error de inicio de sesión",
        description: "No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Common loader style for loading and redirecting states
  const renderLoader = (message: string) => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="mt-6 text-lg font-medium text-slate-700">{message}</p>
    </div>
  );

  if (loading || !isFirebaseReady) {
    return renderLoader("Cargando servicios de autenticación...");
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Control Mipyme
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Administra fácilmente tus empresas y finanzas en un solo lugar.
            </p>
          </div>

          <div className="bg-white p-8 shadow-xl rounded-xl space-y-6 sm:p-10">
            <div>
              <Button
                onClick={handleSignIn}
                size="lg"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-base font-semibold flex items-center justify-center space-x-2 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Continuar con Google"
                disabled={!isFirebaseReady || loading}
              >
                <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                <span>Continuar con Google</span>
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">o accede con tu cuenta</span>
              </div>
            </div>

            {/* Placeholder for Email/Password form - not implemented as per current auth logic 
            <form className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Correo electrónico</label>
                <input type="email" name="email" id="email" autoComplete="email" required className="mt-1 block w-full h-11 rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5" />
              </div>
              <div>
                <label htmlFor="password"className="block text-sm font-medium text-slate-700">Contraseña</label>
                <input type="password" name="password" id="password" autoComplete="current-password" required className="mt-1 block w-full h-11 rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5" />
              </div>
              <Button type="submit" size="lg" className="w-full h-11 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md text-base font-semibold" disabled>
                Iniciar Sesión
              </Button>
            </form>
            */} 

            <p className="text-xs text-slate-500 text-center px-4">
              Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // User is loaded and present, useEffect will redirect.
  return renderLoader("Redirigiendo a tu panel principal...");
}
