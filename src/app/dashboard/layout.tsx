
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthProvider, useAuthContext } from '@/context/AuthProvider'; // Asegúrate que AuthProvider se exporta si es necesario aquí, o que el contexto es suficiente.
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
import { Navbar } from '@/components/layout/Navbar'; // Reutilizamos la Navbar superior
import { Loader2, LayoutDashboard, Briefcase, UserCircle, Settings } from 'lucide-react';
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
    // Podríamos añadir un ítem de Configuración General aquí si existiera
  ];

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col">
        <Navbar /> {/* Mantenemos la Navbar superior para el logo y botones de Auth */}
        <div className="flex flex-1">
          <Sidebar className="border-r" collapsible="icon"> {/* o "offcanvas" */}
            <SidebarHeader>
              {/* Podríamos poner un logo más pequeño o título aquí si el sidebar está expandido */}
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
                        tooltip={{children: item.label, side: 'right', align: 'center'}}
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
          <main className="flex-1 flex-col bg-background p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
