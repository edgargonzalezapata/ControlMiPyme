"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthProvider';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/lib/authService';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
      toast({
        title: "Iniciando sesión",
        description: "Conectando con tu cuenta de Google...",
        variant: "default",
      });
    } catch (error) {
      console.error("Sign in failed", error);
      toast({
        title: "Error de inicio de sesión",
        description: "No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const renderLoader = (message, icon = "loader") => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4 text-center">
      <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center max-w-md mx-auto">
        {icon === "loader" ? (
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        ) : icon === "success" ? (
          <CheckCircle className="h-16 w-16 text-green-500" />
        ) : (
          <AlertCircle className="h-16 w-16 text-amber-500" />
        )}
        <p className="mt-6 text-xl font-medium text-gray-800">{message}</p>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
          <div className="bg-primary h-1 rounded-full animate-pulse w-full"></div>
        </div>
      </div>
    </div>
  );

  if (loading || !isFirebaseReady) {
    return renderLoader("Cargando servicios de autenticación...");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Left side: Brand showcase */}
        <div className="relative hidden w-1/2 lg:flex bg-gradient-to-br from-blue-600 to-indigo-800 overflow-hidden">
          <div className="relative z-10 p-12 flex flex-col h-full justify-between">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">Controla tu Mipyme</h2>
              <div className="h-1 w-20 bg-yellow-400 rounded mb-6"></div>
              <p className="text-lg text-blue-100">La herramienta definitiva para gestionar tus finanzas y empresas de manera eficiente.</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <h3 className="text-white font-semibold mb-2">Control financiero simple</h3>
                <p className="text-blue-100 text-sm">Gestiona tus ingresos, gastos y flujos de caja con interfaces intuitivas y reportes claros.</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <h3 className="text-white font-semibold mb-2">Decisiones informadas</h3>
                <p className="text-blue-100 text-sm">Analíticas avanzadas y paneles personalizados para tomar mejores decisiones empresariales.</p>
              </div>
              
              <div className="text-xs text-blue-200 mt-8">
                © 2025 MiPyme Control. Todos los derechos reservados.
              </div>
            </div>
          </div>
        
          {/* Abstract pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Right side: Login form */}
        <div className="flex w-full items-center justify-center p-4 md:p-8 lg:w-1/2">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary text-white rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bienvenido</h1>
              <p className="mt-2 text-sm text-gray-600">
                Accede a tu cuenta para gestionar tu negocio
              </p>
            </div>

            <div className="bg-white p-8 shadow-lg rounded-xl space-y-6 border border-gray-100">
              <div className="space-y-4">
                <Button
                  onClick={handleSignIn}
                  size="lg"
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-base font-semibold flex items-center justify-center space-x-3 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-md"
                  aria-label="Continuar con Google"
                  disabled={!isFirebaseReady || loading}
                >
                  <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                  <span>Iniciar sesión con Google</span>
                </Button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-xs">o</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-14 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-base font-semibold flex items-center justify-center space-x-3 transition-all duration-200"
                  disabled={true}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <span>Iniciar con correo electrónico</span>
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center px-4 pt-4 border-t border-gray-100">
                Al continuar, aceptas nuestros <a href="#" className="text-primary hover:underline">Términos de Servicio</a> y <a href="#" className="text-primary hover:underline">Política de Privacidad</a>.
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿Necesitas ayuda? <a href="#" className="text-primary font-medium hover:underline">Contáctanos</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return renderLoader("Preparando tu espacio de trabajo...", "success");
}