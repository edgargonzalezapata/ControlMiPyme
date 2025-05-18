
"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { useAuthContext } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar'; // Keep Navbar if this layout is standalone

// This layout is for /empresas and its children (like /empresas/[empresaId])
// If /dashboard/layout.tsx is meant to be the primary authenticated layout,
// this one might need to be adjusted or removed if /empresas routes move under /dashboard route group.
// For now, keeping it to ensure /empresas still works independently and has its auth check.

export default function EmpresasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isFirebaseReady } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isFirebaseReady && !loading) { 
      router.push('/'); 
      return;
    }

    if (isFirebaseReady && !loading && !user) {
      router.push('/'); 
    }
  }, [user, loading, router, isFirebaseReady]);

  // If we are already inside the dashboard layout, we don't need another full screen loader.
  // The DashboardLayout handles its own loading state.
  // This check assumes /empresas might be accessed directly or via dashboard.
  const isInsideDashboardLayout = pathname.startsWith('/dashboard');

  if (!isInsideDashboardLayout && (loading || !isFirebaseReady)) { 
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!isInsideDashboardLayout && !user && isFirebaseReady) { 
     return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirigiendo...</p>
      </div>
    );
  }
  
  // If /empresas is rendered within /dashboard/layout.tsx, 
  // this EmpresasLayout might become simpler or be removed if dashboard layout handles sidebar.
  // For now, it provides content padding.
  return (
    <>
      {/* If not inside dashboard, this implies a direct navigation, so Navbar might be needed if not already provided by a higher layout */}
      {/* {!isInsideDashboardLayout && <Navbar />} */} 
      {/* The Navbar is already in DashboardLayout and RootLayout, so likely not needed here unless this path is hit outside those */}
      <div className={isInsideDashboardLayout ? "" : "py-6 container mx-auto"}> {/* Adjust padding if inside dashboard */}
        {children}
      </div>
    </>
  );
}
