
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
import { Loader2, LayoutDashboard, Briefcase, UserCircle, Banknote, FileText, Settings, ArrowLeftRight, BarChart3, LogOut, Building, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import type { Company } from '@/lib/types';


function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isFirebaseReady } = useAuthContext();
  const { activeCompanyId, activeCompanyDetails, isLoadingActiveCompany } = useActiveCompany();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isUserAdminOfActiveCompany, setIsUserAdminOfActiveCompany] = useState(false);
  const [currentCompanyName, setCurrentCompanyName] = useState<string | null>(null);
  const [isCompanyContext, setIsCompanyContext] = useState(false);


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
    // Check if the current path is related to a specific company context
    // This logic might need adjustment based on your exact routing for "active company" views
    const companySpecificPaths = [
      '/dashboard/cuentas',
      '/dashboard/transacciones',
      '/dashboard/reportes',
      '/dashboard/configuracion',
    ];
    // A more robust check might involve dynamic segments if you had /dashboard/company/[companyId]/cuentas etc.
    // For now, if activeCompanyId is set, we assume we are in a company context for these paths.
    setIsCompanyContext(!!activeCompanyId && companySpecificPaths.some(p => pathname.startsWith(p)));

    if (activeCompanyDetails && user) {
      setCurrentCompanyName(activeCompanyDetails.name);
      setIsUserAdminOfActiveCompany(activeCompanyDetails.members[user.uid] === 'admin');
    } else {
      setCurrentCompanyName(null);
      setIsUserAdminOfActiveCompany(false);
    }
  }, [activeCompanyId, activeCompanyDetails, user, pathname]);


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
  
  const baseNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresActiveCompany: true },
    { href: '/dashboard/cuentas', label: 'Cuentas', icon: Banknote, requiresActiveCompany: true },
    { href: '/dashboard/transacciones', label: 'Transacciones', icon: FileText, requiresActiveCompany: true },
    { href: '/dashboard/reportes', label: 'Reportes', icon: BarChart3, requiresActiveCompany: true, isPlaceholder: true },
    { href: '/dashboard/configuracion', label: 'Config. Empresa', icon: Settings, requiresActiveCompany: true, isAdminOnly: true },
  ];

  const managementNavItems = [
     { href: '/dashboard/empresas', label: 'Gestionar Empresas', icon: Briefcase },
     { href: '/dashboard/perfil', label: 'Mi Perfil', icon: UserCircle },
  ];

  let currentNavItems;
  if (isCompanyContext && activeCompanyDetails) { // If in a company specific view and company is active
    currentNavItems = [
      { href: '/dashboard/empresas', label: 'Volver a Empresas', icon: ArrowLeft },
      ...baseNavItems.filter(item => !item.isAdminOnly || isUserAdminOfActiveCompany),
    ];
  } else { // General dashboard view or managing companies
     currentNavItems = [
        { href: '/dashboard', label: 'Dashboard Principal', icon: LayoutDashboard, requiresActiveCompany: false}, // Link to general dashboard / welcome
        ...managementNavItems
    ];
  }
  
  // Filter items that require an active company if no company is active
  // (This filter is more relevant if some baseNavItems were shown even without company context)
  currentNavItems = currentNavItems.filter(item => !item.requiresActiveCompany || !!activeCompanyId);


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
                        disabled={item.isPlaceholder || (item.requiresActiveCompany && !activeCompanyId && !isCompanyContext)}
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

// Remove ActiveCompanyProvider from here as it's now in RootLayout
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
  );
}
