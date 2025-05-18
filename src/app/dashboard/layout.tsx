
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
import { Loader2, LayoutDashboard, Briefcase, UserCircle, Mail } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
      // Firebase not ready, and not just initial loading phase
      router.push('/');
      return;
    }
    if (isFirebaseReady && !loading && !user) {
      // Firebase is ready, loading finished, but no user
      router.push('/');
    }
  }, [user, loading, router, isFirebaseReady]);

  if (loading || !isFirebaseReady || (isFirebaseReady && !user && !pathname.startsWith('/dashboard') && pathname !== '/')) {
    // This handles initial load, firebase not ready, or if user is somehow null while not on login page
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </div>
    );
  }
  
  if (!user) {
     // This is a fallback, useEffect should have redirected.
    // Helps prevent rendering children if user is truly null after checks.
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/empresas', label: 'Empresas', icon: Briefcase },
    { href: '/dashboard/perfil', label: 'Mi Perfil', icon: UserCircle },
  ];

  const userInitials = user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : <UserCircle size={18}/>;

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col">
        {/* Navbar is in RootLayout */}
        <div className="flex flex-1 pt-16"> {/* pt-16 for Navbar fixed in RootLayout */}
          <Sidebar 
            className="border-r fixed top-16 left-0 h-[calc(100vh-4rem)] z-30 bg-card" 
            collapsible="none" // Always expanded on desktop
          >
            <SidebarHeader className="p-3 border-b">
               <div className="flex items-center gap-3">
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
               {/* Corrected: SidebarTrigger is already a button and includes its own styling & icon. */}
               {/* It's positioned absolutely for mobile view, hidden on medium screens and up. */}
               <SidebarTrigger className="md:hidden absolute top-2 right-2 h-8 w-8" />
            </SidebarHeader>
            <SidebarContent className="pt-2">
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref legacyBehavior>
                      <SidebarMenuButton
                        isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
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
              {/* Future: Quick actions or compact user info */}
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
