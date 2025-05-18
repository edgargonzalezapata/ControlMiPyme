
"use client";

import Link from 'next/link';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { TrendingUp, Briefcase } from 'lucide-react';
import { useAuthContext } from '@/context/AuthProvider';
import { CompanySelector } from './CompanySelector'; // Import the new selector

export function Navbar() {
  const { user } = useAuthContext();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors">
          <TrendingUp className="h-7 w-7 text-primary" />
          <span className="hidden sm:inline">Control Mipyme</span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {user && <CompanySelector />} 
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
