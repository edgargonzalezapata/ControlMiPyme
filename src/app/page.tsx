"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithGoogle } from '@/lib/authService';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      router.push('/perfil');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // The useEffect above will handle redirection upon successful login
    } catch (error) {
      console.error("Sign in failed", error);
      toast({ 
        title: "Error de inicio de sesión", 
        description: "No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.", 
        variant: "destructive" 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-xl rounded-lg">
          <CardHeader className="text-center p-6 sm:p-8">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">Bienvenido a AuthNexus</CardTitle>
            <CardDescription className="text-sm sm:text-md text-muted-foreground mt-2">
              Inicia sesión de forma segura y rápida con tu cuenta de Google.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6 p-6 sm:p-8">
            <Button 
              onClick={handleSignIn} 
              size="lg" 
              className="w-full transform transition-transform hover:scale-[1.02] active:scale-[0.98] bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
              aria-label="Continuar con Google"
            >
              <svg className="mr-3 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
              Continuar con Google
            </Button>
            <p className="text-xs text-muted-foreground text-center px-4">
              Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is loaded and present, useEffect will redirect.
  return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirigiendo a tu perfil...</p>
      </div>
  );
}
