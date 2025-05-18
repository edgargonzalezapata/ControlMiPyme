
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function EmpresasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isFirebaseReady } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseReady && !loading) { // If Firebase init failed and not in initial load
      router.push('/'); // Redirect, AuthProvider might show toast
      return;
    }

    if (isFirebaseReady && !loading && !user) {
      router.push('/'); // Redirect to login if not authenticated and Firebase is ready
    }
  }, [user, loading, router, isFirebaseReady]);

  if (loading || !isFirebaseReady) { // Show loader if initial loading or Firebase itself isn't ready
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user) { // Fallback for the brief moment before redirect effect runs, or if user is null post-load
     return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirigiendo...</p>
      </div>
    );
  }

  return <div className="py-6">{children}</div>;
}
