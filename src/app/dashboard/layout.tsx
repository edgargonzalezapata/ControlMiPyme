
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import { Loader2, LayoutDashboard, Briefcase, UserCircle, Banknote, FileText, Settings, ArrowLeftRight, BarChart3, LogOut } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ActiveCompanyProvider, useActiveCompany } from '@/context/ActiveCompanyProvider'; // Import ActiveCompanyProvider and useActiveCompany

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isFirebaseReady } = useAuthContext();
  const { activeCompanyId, activeCompanyDetails, isLoadingActiveCompany } = useActiveCompany();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isUserAdminOfActiveCompany, setIsUserAdminOfActiveCompany] = useState(false);

  useEffect(() => {
    if (!isFirebaseReady && !authLoading) {
      router.push('/');
      return;
    }
    if (isFirebaseReady && !authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router, isFirebaseReady]);

  useEffect(() => {
    if (activeCompanyDetails && user) {
      setIsUserAdminOfActiveCompany(activeCompanyDetails.members[user.uid] === 'admin');
    } else {
      setIsUserAdminOfActiveCompany(false);
    }
  }, [activeCompanyDetails, user]);

  if (authLoading || !isFirebaseReady || (isFirebaseReady && !user && !pathname.startsWith('/dashboard') && pathname !== '/')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }

  const userInitials = user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : <UserCircle size={18}/>;
  
  const navItemsBase = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresActiveCompany: true },
    { href: '/dashboard/cuentas', label: 'Cuentas', icon: Banknote, requiresActiveCompany: true },
    { href: '/dashboard/transacciones', label: 'Transacciones', icon: FileText, requiresActiveCompany: true },
    { href: '/dashboard/reportes', label: 'Reportes', icon: BarChart3, requiresActiveCompany: true, isPlaceholder: true }, // Placeholder
    { href: '/dashboard/configuracion', label: 'Config. Empresa', icon: Settings, requiresActiveCompany: true, isAdminOnly: true },
  ];

  const navItemsManagement = [
     { href: '/dashboard/empresas', label: 'Gestionar Empresas', icon: Briefcase },
     { href: '/dashboard/perfil', label: 'Mi Perfil', icon: UserCircle },
  ];

  const currentNavItems = navItemsBase
    .filter(item => !item.requiresActiveCompany || !!activeCompanyId)
    .filter(item => !item.isAdminOnly || (!!activeCompanyId && isUserAdminOfActiveCompany))
    .concat(navItemsManagement);

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 pt-16"> 
          <Sidebar 
            className="border-r fixed top-16 left-0 h-[calc(100vh-4rem)] z-30 bg-card" 
            collapsible="none" 
          >
            <SidebarHeader className="p-3 border-b">
               <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-10 w-10">
                  {user.photoURL ? (
                    <AvatarImage src={user.photoURL} alt={user.displayName || 'Usuario'} />
                  ) : null }
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <p className="text-sm font-semibold text-foreground truncate" title={user.displayName || undefined}>
                    {user.displayName || 'Usuario'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" title={user.email || undefined}>
                    {user.email || 'No email'}
                  </p>
                </div>
              </div>
              {isLoadingActiveCompany && activeCompanyId && (
                <div className="p-2 text-sm text-muted-foreground">Cargando empresa...</div>
              )}
              {!isLoadingActiveCompany && activeCompanyDetails && (
                 <div className="p-2 border-t border-dashed mt-2">
                    <p className="text-xs text-muted-foreground">Empresa Activa:</p>
                    <p className="text-sm font-semibold text-primary truncate" title={activeCompanyDetails.name}>
                        {activeCompanyDetails.name}
                    </p>
                 </div>
              )}
               <SidebarTrigger className="md:hidden absolute top-2 right-2 h-8 w-8" />
            </SidebarHeader>
            <SidebarContent className="pt-2">
              <SidebarMenu>
                {currentNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref legacyBehavior>
                      <SidebarMenuButton
                        isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                        disabled={item.isPlaceholder || (item.requiresActiveCompany && !activeCompanyId)}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                        {item.isPlaceholder && <span className="text-xs text-muted-foreground ml-auto">(Próx.)</span>}
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
               {/* Puedes añadir aquí un botón de cierre de sesión si lo prefieres en el sidebar */}
            </SidebarFooter>
          </Sidebar>
          <main className="flex-1 flex-col bg-background p-4 md:p-6 lg:p-8 overflow-auto ml-0 md:ml-[16rem] transition-all duration-200 ease-linear">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveCompanyProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ActiveCompanyProvider>
  );
}
