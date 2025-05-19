"use client";

import Link from 'next/link';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { Briefcase, Users } from 'lucide-react';
import { useAuthContext } from '@/context/AuthProvider';
import { CompanySelector } from './CompanySelector'; // Import the new selector
import { ThemeToggle } from '@/components/ui/theme-toggle'; // Import theme toggle

export function Navbar() {
  const { user } = useAuthContext();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-gray-900 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 text-lg font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <div className="flex items-center justify-center bg-indigo-600 text-white p-1.5 rounded-lg shadow-md">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 8L12 12L20 8L12 4Z" fill="currentColor" />
              <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="hidden sm:inline font-bold">Control MiPyme</span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-5">
          {user && (
            <div className="mr-2">
              <CompanySelector />
            </div>
          )}
          <ThemeToggle className="mr-2" />
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
