import Link from 'next/link';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { ShieldCheck } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="hidden sm:inline">AuthNexus</span>
        </Link>
        <AuthButtons />
      </div>
    </header>
  );
}
