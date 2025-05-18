
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthContext } from '@/context/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Loader2, LayoutDashboard, Briefcase, UserCircle } from 'lucide-react'; // Settings icon removed as it's part of Empresas section now
import Image from 'next/image';

export default function DashboardLayout({
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

  if (loading || !isFirebaseReady || (isFirebaseReady && !user && pathname !== '/')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </div>
    );
  }
  
  if (!user) {
     // Esto es un fallback, el useEffect debería redirigir.
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/empresas', label: 'Empresas', icon: Briefcase },
    { href: '/perfil', label: 'Mi Perfil', icon: UserCircle },
  ];

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col">
        {/* Navbar ya está en RootLayout, no se necesita aquí */}
        <div className="flex flex-1 pt-16"> {/* pt-16 para compensar la altura de la Navbar fija en RootLayout */}
          <Sidebar 
            className="border-r fixed top-16 left-0 h-[calc(100vh-4rem)] z-30" 
            collapsible="none" /* Cambiado de "icon" a "none" para que esté siempre expandido en desktop */
          >
            <SidebarHeader>
               <Button variant="ghost" size="icon" className="md:hidden" asChild>
                 <SidebarTrigger />
               </Button>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref legacyBehavior>
                      <SidebarMenuButton
                        isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                        // Tooltip no es necesario si el texto siempre es visible en desktop
                        // tooltip={{children: item.label, side: 'right', align: 'center'}} 
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              {/* Podríamos añadir info del usuario o un botón de cerrar sesión específico del sidebar */}
            </SidebarFooter>
          </Sidebar>
          {/* Contenido principal con margen izquierdo para el sidebar siempre expandido en desktop */}
          <main className="flex-1 flex-col bg-background p-4 md:p-6 lg:p-8 overflow-auto ml-0 md:ml-[16rem] transition-all duration-200 ease-linear">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
