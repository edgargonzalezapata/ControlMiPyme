
"use client";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signInWithGoogle, signOutUser } from '@/lib/authService';
import { useAuthContext } from '@/context/AuthProvider';
import { LogIn, LogOut, UserCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AuthButtons() {
  const { user, loading, isFirebaseReady } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/dashboard'); 
      toast({ title: "Inicio de Sesión Exitoso", description: "Bienvenido de nuevo!" });
    } catch (error: any) {
      console.error("Sign in failed", error);
      toast({
        title: "Error de inicio de sesión",
        description: error.message || "No se pudo iniciar sesión. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.push('/');
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión correctamente." });
    } catch (error: any) {
      console.error("Sign out failed", error);
      toast({
        title: "Error al cerrar sesión",
        description: error.message || "No se pudo cerrar sesión. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  if (!isFirebaseReady && !loading) { 
     return (
      <div className="flex items-center gap-2 text-destructive">
        <ShieldAlert className="h-5 w-5" />
        <span className="text-sm">Auth no disponible</span>
      </div>
    );
  }

  if (loading) {
    return <Button variant="outline" disabled size="sm" className="w-[140px]"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...</Button>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-accent/50">
          <Link href="/dashboard/perfil" aria-label="Ir al perfil">
            <UserCircle className="h-6 w-6 text-foreground hover:text-primary" />
          </Link>
        </Button>
        <Button onClick={handleSignOut} variant="outline" size="sm" className="rounded-md">
          <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleSignIn} size="sm" className="rounded-md bg-primary hover:bg-primary/90 text-primary-foreground">
      <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
      Acceder
    </Button>
  );
}

