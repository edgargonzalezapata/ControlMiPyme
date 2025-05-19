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
import { 
  Loader2, LayoutDashboard, Briefcase, UserCircle, Banknote, FileText, 
  Settings, ArrowLeftRight, BarChart3, LogOut, Building, ArrowLeft,
  Home, CreditCard, PieChart, TrendingUp, ChevronRight, User, HelpCircle,
  Moon, Sun
} from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import type { Company } from '@/lib/types';
import { signOutUser } from '@/lib/authService';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/context/ThemeProvider';

// Definir tipos para los elementos de navegación
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  description: string;
  requiresActiveCompany?: boolean;
  isPlaceholder?: boolean;
  isAdminOnly?: boolean;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isFirebaseReady } = useAuthContext();
  const { activeCompanyId, activeCompanyDetails, isLoadingActiveCompany } = useActiveCompany();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [isUserAdminOfActiveCompany, setIsUserAdminOfActiveCompany] = useState(false);
  const [currentCompanyName, setCurrentCompanyName] = useState<string | null>(null);
  const [isCompanyContext, setIsCompanyContext] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    const companySpecificPaths = [
      '/dashboard/cuentas',
      '/dashboard/transacciones',
      '/dashboard/reportes',
      '/dashboard/configuracion',
    ];
    setIsCompanyContext(!!activeCompanyId && companySpecificPaths.some(p => pathname.startsWith(p)));

    if (activeCompanyDetails && user) {
      setCurrentCompanyName(activeCompanyDetails.name);
      setIsUserAdminOfActiveCompany(activeCompanyDetails.members[user.uid] === 'admin');
    } else {
      setCurrentCompanyName(null);
      setIsUserAdminOfActiveCompany(false);
    }
  }, [activeCompanyId, activeCompanyDetails, user, pathname]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.push('/');
      toast({ 
        title: "Sesión cerrada", 
        description: "Has cerrado sesión correctamente."
      });
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error);
      toast({
        title: "Error al cerrar sesión",
        description: error.message || "No se pudo cerrar sesión. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  if (authLoading || !isFirebaseReady || (isFirebaseReady && !user && !pathname.startsWith('/dashboard') && pathname !== '/')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-indigo-600/20 dark:bg-indigo-500/30 blur-md animate-pulse"></div>
          <Loader2 className="h-16 w-16 animate-spin text-indigo-600 dark:text-indigo-400 relative z-10" />
        </div>
        <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-200">Cargando dashboard...</p>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }

  const userInitials = user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : <UserCircle size={18}/>;
  
  // Define menu items with improved structure and icons
  const baseNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresActiveCompany: true, description: 'Vista general de la empresa' },
    { href: '/dashboard/cuentas', label: 'Cuentas', icon: CreditCard, requiresActiveCompany: true, description: 'Gestión de cuentas bancarias' },
    { href: '/dashboard/transacciones', label: 'Transacciones', icon: ArrowLeftRight, requiresActiveCompany: true, description: 'Registro de movimientos' },
    { href: '/dashboard/reportes', label: 'Reportes', icon: PieChart, requiresActiveCompany: true, isPlaceholder: true, description: 'Análisis financiero' },
    { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings, requiresActiveCompany: true, isAdminOnly: true, description: 'Ajustes de empresa' },
  ];

  const managementNavItems: NavItem[] = [
     { href: '/dashboard/empresas', label: 'Mis Empresas', icon: Briefcase, description: 'Gestionar todas tus empresas' },
     { href: '/dashboard/perfil', label: 'Mi Perfil', icon: User, description: 'Configuración de usuario' },
  ];

  let currentNavItems: NavItem[];
  if (isCompanyContext && activeCompanyDetails) {
    currentNavItems = [
      { href: '/dashboard/empresas', label: 'Volver a Empresas', icon: ArrowLeft, description: 'Regresar al listado de empresas' },
      ...baseNavItems.filter(item => !item.isAdminOnly || isUserAdminOfActiveCompany),
    ];
  } else {
    currentNavItems = [
      { href: '/dashboard', label: 'Dashboard Principal', icon: Home, requiresActiveCompany: false, description: 'Panel de control principal'},
      ...managementNavItems
    ];
  }
  
  // Filter items that require an active company if no company is active
  currentNavItems = currentNavItems.filter(item => !item.requiresActiveCompany || !!activeCompanyId);

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-1 pt-16"> 
          {/* Main Sidebar */}
          <Sidebar 
            className="border-r border-indigo-100 dark:border-indigo-900/50 fixed top-16 left-0 h-[calc(100vh-4rem)] z-30 bg-white dark:bg-gray-900 shadow-sm" 
            collapsible="none" 
          >
            {/* Sidebar Header with User Info */}
            <SidebarHeader className="p-3 border-b border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-indigo-600/20 dark:bg-indigo-600/30 rounded-full blur-sm"></div>
                  <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800 relative z-10">
                    {user.photoURL ? (
                      <AvatarImage src={user.photoURL} alt={user.displayName || 'Usuario'} />
                    ) : null}
                    <AvatarFallback className="bg-indigo-600 text-white font-semibold text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate" title={user.displayName || undefined}>
                    {user.displayName || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={user.email || undefined}>
                    {user.email || 'No email'}
                  </p>
                </div>
                <SidebarTrigger className="md:hidden ml-auto h-7 w-7" />
              </div>
              
              {/* Active Company Display */}
              {isLoadingActiveCompany && activeCompanyId && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500 dark:text-indigo-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Cargando empresa...</span>
                </div>
              )}
              {!isLoadingActiveCompany && activeCompanyDetails && (
                <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Building className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Empresa Activa</p>
                    {isUserAdminOfActiveCompany && (
                      <Badge variant="outline" className="ml-auto text-[10px] py-0 h-4 bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                    {activeCompanyDetails.name}
                  </p>
                </div>
              )}
            </SidebarHeader>

            {/* Sidebar Content with Navigation */}
            <SidebarContent className="p-3">
              <div className="mb-2">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-1.5">
                  {isCompanyContext ? 'Navegación' : 'General'}
                </p>
                <SidebarMenu>
                  {currentNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <Link href={item.href} passHref legacyBehavior>
                        <SidebarMenuButton
                          isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                          disabled={!!item.isPlaceholder || (!!item.requiresActiveCompany && !activeCompanyId && !isCompanyContext)}
                          className={`
                            group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200
                            ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300'}
                            ${item.isPlaceholder ? 'opacity-60' : ''}
                          `}
                        >
                          <span className={`
                            flex h-5 w-5 shrink-0 items-center justify-center rounded-md 
                            ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900 dark:group-hover:text-indigo-300'}
                          `}>
                            <item.icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.isPlaceholder && <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">(Próx.)</span>}
                          {!item.isPlaceholder && (
                            <ChevronRight className={`
                              h-3.5 w-3.5 shrink-0 ml-auto opacity-0 transition-opacity duration-200
                              ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                                ? 'opacity-100 text-indigo-600 dark:text-indigo-400'
                                : 'group-hover:opacity-100 text-gray-400 dark:text-gray-500'}
                            `} />
                          )}
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            </SidebarContent>

            {/* Sidebar Footer with Logout Button */}
            <SidebarFooter className="p-3 border-t border-indigo-100 dark:border-indigo-900/50 mt-auto">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <Button 
                    variant="ghost" 
                    className="flex-1 justify-start gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                    onClick={handleSignOut}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      <LogOut className="h-3.5 w-3.5" />
                    </span>
                    <span>Cerrar Sesión</span>
                  </Button>
                  
                  <ThemeToggle 
                    className="h-7 w-7"
                    iconClassName="h-3.5 w-3.5"
                  />
                </div>
                
                <div className="p-2 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100/50 dark:border-indigo-900/50">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">¿Necesitas ayuda?</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Contacta con soporte desde la sección de perfil.</p>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          {/* Main Content */}
          <main className="flex-1 flex-col bg-gray-50 dark:bg-gray-900 p-3 md:p-4 lg:p-6 overflow-auto ml-0 md:ml-[16rem] transition-all duration-200 ease-linear">
            <div className="w-full h-full dark:text-gray-100">
              {children}
            </div>
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
