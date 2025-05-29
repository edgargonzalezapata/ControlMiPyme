"use client";

import Link from 'next/link';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { Briefcase, Users, Menu, X, Home, BarChart3, Settings, CreditCard, Banknote, ArrowLeftRight, FileText, PieChart, Calendar } from 'lucide-react';
import { useAuthContext } from '@/context/AuthProvider';
import { CompanySelector } from './CompanySelector'; // Import the new selector
import { ThemeToggle } from '@/components/ui/theme-toggle'; // Import theme toggle
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';

export function Navbar() {
  const { user } = useAuthContext();
  const { activeCompanyId } = useActiveCompany();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  // Check if we're in dashboard routes
  const isDashboardRoute = pathname?.startsWith('/dashboard');

  // Debug log
  useEffect(() => {
    console.log('Menu isOpen:', isOpen, 'isDashboardRoute:', isDashboardRoute);
  }, [isOpen, isDashboardRoute]);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-gray-900 shadow-sm">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4 lg:px-8">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <div className="flex items-center justify-center bg-indigo-600 text-white p-1 sm:p-1.5 rounded-lg shadow-md">
              <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 8L12 12L20 8L12 4Z" fill="currentColor" />
                <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="hidden xs:inline font-bold">Control MiPyme</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-4">
            {user && !isDashboardRoute && (
              <div className="mr-2">
                <CompanySelector />
              </div>
            )}
            <ThemeToggle className="mr-2" />
            <AuthButtons />
          </div>

          {/* Mobile Navigation - Always show when user is logged in */}
          {user && (
            <div className="flex sm:hidden items-center gap-2">
              <ThemeToggle className="h-8 w-8" />
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => {
                  console.log('Menu button clicked, toggling from:', isOpen, 'to:', !isOpen);
                  setIsOpen(!isOpen);
                }}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </div>
          )}

          {/* Mobile Navigation for non-logged users */}
          {!user && (
            <div className="flex sm:hidden items-center gap-2">
              <ThemeToggle className="h-8 w-8" />
            </div>
          )}
        </div>
      </header>

      {/* Mobile menu overlay - Show for all logged users */}
      {isOpen && user && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => {
              console.log('Backdrop clicked, closing menu');
              setIsOpen(false);
            }}
          />
          
          {/* Menu content */}
          <div className="fixed top-0 right-0 h-full w-[320px] bg-white dark:bg-gray-900 shadow-xl z-[110] transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center bg-indigo-600 text-white p-1.5 rounded-lg shadow-md">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4L4 8L12 12L20 8L12 4Z" fill="currentColor" />
                      <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-gray-100">Control MiPyme</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    console.log('Close button clicked');
                    setIsOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Company Selector - Always show for logged users */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Empresa Activa
                  </h3>
                  <CompanySelector />
                </div>
                
                {/* Panel Principal */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Panel Principal
                  </h3>
                  <div className="space-y-2">
                    <Link 
                      href="/dashboard" 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        console.log('Dashboard link clicked');
                        setIsOpen(false);
                      }}
                    >
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                        <Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                  </div>
                </div>

                {/* Finanzas Section */}
                {activeCompanyId && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Finanzas
                    </h3>
                    <div className="space-y-2">
                      <Link 
                        href="/dashboard/cuentas" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          console.log('Cuentas link clicked');
                          setIsOpen(false);
                        }}
                      >
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                          <Banknote className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium">Bancos</span>
                      </Link>

                      <Link 
                        href="/dashboard/transacciones" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          console.log('Transacciones link clicked');
                          setIsOpen(false);
                        }}
                      >
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium">Transacciones</span>
                      </Link>


                      <Link 
                        href="/dashboard/reportes" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-60"
                        onClick={() => {
                          console.log('Reportes link clicked');
                          setIsOpen(false);
                        }}
                      >
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                          <PieChart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-sm font-medium">Reportes</span>
                        <span className="text-xs text-gray-500 ml-auto">(Próx.)</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Facturación Section */}
                {activeCompanyId && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Facturación
                    </h3>
                    <div className="space-y-2">
                      <Link 
                        href="/dashboard/facturacion/dashboard" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          console.log('Facturación Dashboard link clicked');
                          setIsOpen(false);
                        }}
                      >
                        <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <span className="text-sm font-medium">Dashboard</span>
                      </Link>

                      <Link 
                        href="/dashboard/facturacion/lista" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          console.log('Facturas Emitidas link clicked');
                          setIsOpen(false);
                        }}
                      >
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-sm font-medium">Facturas Emitidas</span>
                      </Link>

                      <Link 
                        href="/dashboard/facturacion/recibidas" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          console.log('Facturas Recibidas link clicked');
                          setIsOpen(false);
                        }}
                      >
                        <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <span className="text-sm font-medium">Facturas Recibidas</span>
                      </Link>

                      <Link 
                        href="/dashboard/servicios-recurrentes" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          console.log('Servicios Recurrentes link clicked');
                          setIsOpen(false);
                        }}
                      >
                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-sm font-medium">Servicios Recurrentes</span>
                      </Link>

                      <Link 
                        href="/dashboard/cotizaciones" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          console.log('Cotizaciones link clicked');
                          setIsOpen(false);
                        }}
                      >
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm font-medium">Cotizaciones</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Configuración Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Configuración
                  </h3>
                  <div className="space-y-2">
                    <Link 
                      href="/dashboard/empresas" 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        console.log('Empresas link clicked');
                        setIsOpen(false);
                      }}
                    >
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-sm font-medium">Empresas</span>
                    </Link>

                    <Link 
                      href="/dashboard/periodo" 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        console.log('Periodo link clicked');
                        setIsOpen(false);
                      }}
                    >
                      <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="text-sm font-medium">Periodo</span>
                    </Link>
                  </div>
                </div>
                
                {/* Account Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Cuenta
                  </h3>
                  <AuthButtons />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
