"use client";

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Public pages that should not have the dashboard layout
  const publicPages = ['/', '/ingresa'];
  const isPublicPage = publicPages.includes(pathname);
  
  // If it's a public page, render children directly without dashboard layout
  if (isPublicPage) {
    return <>{children}</>;
  }
  
  // For all other pages (dashboard, etc.), use the dashboard layout
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
} 