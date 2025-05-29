"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthProvider';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/lib/authService';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
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

  const renderLoader = (message: string, icon = "loader") => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4 text-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center max-w-md mx-auto border border-indigo-100">
        {icon === "loader" ? (
          <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
        ) : icon === "success" ? (
          <CheckCircle className="h-16 w-16 text-green-500" />
        ) : (
          <AlertCircle className="h-16 w-16 text-amber-500" />
        )}
        <p className="mt-6 text-xl font-medium text-gray-800">{message}</p>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
          <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse w-full"></div>
        </div>
      </div>
    </div>
  );

  if (loading || !isFirebaseReady) {
    return renderLoader("Cargando servicios de autenticación...");
  }

  if (user) {
    return renderLoader("Preparando tu espacio de trabajo...", "success");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Header with back button */}
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al inicio</span>
        </Button>
      </div>

      {/* Main login content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-4 shadow-lg transform transition-all hover:scale-105 hover:shadow-xl">
                <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 8L12 12L20 8L12 4Z" fill="currentColor" />
                  <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accede a tu cuenta</h1>
            <p className="text-lg text-gray-600">
              Gestiona tu negocio de forma profesional
            </p>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="space-y-6">
              {/* Google Sign In */}
              <Button
                onClick={handleSignIn}
                size="lg"
                className="w-full h-14 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-base font-semibold flex items-center justify-center space-x-3 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 shadow-lg"
                aria-label="Continuar con Google"
                disabled={!isFirebaseReady || loading}
              >
                <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                <span>Iniciar sesión con Google</span>
              </Button>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">o</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Email option (disabled for now) */}
              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-base font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-sm"
                disabled={true}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <span>Iniciar con correo electrónico</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full ml-2">Próximamente</span>
              </Button>

              {/* Terms */}
              <div className="text-xs text-gray-500 text-center px-4 pt-4 border-t border-gray-100">
                Al continuar, aceptas nuestros{' '}
                <a href="#" className="text-indigo-600 hover:underline font-medium">
                  Términos de Servicio
                </a>{' '}
                y{' '}
                <a href="#" className="text-indigo-600 hover:underline font-medium">
                  Política de Privacidad
                </a>
                .
              </div>
            </div>
          </div>

          {/* Registration CTA */}
          <div className="text-center mt-8 p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
            <p className="text-gray-600 mb-4">
              ¿Aún no tienes cuenta?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Al usar Google para iniciar sesión, automáticamente se creará tu cuenta si es la primera vez que accedes.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Gratis para siempre</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Sin tarjeta requerida</span>
              </div>
            </div>
          </div>

          {/* Help section */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              ¿Necesitas ayuda?{' '}
              <a href="#" className="text-indigo-600 font-medium hover:underline transition-all duration-200">
                Contáctanos
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <div className="flex justify-center space-x-6 mb-4">
          <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors duration-200">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
            </svg>
          </a>
          <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors duration-200">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
          <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors duration-200">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
        <p className="text-sm text-gray-500">
          © 2025 Control MiPyme. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
} 