import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AuthNexus',
  description: 'Inicio de sesión seguro con Google',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
      {/*
        The <body> tag no longer needs font-related classes as they are now on the <html> tag.
        The globals.css file already applies background, foreground, and the primary font-family (var(--font-geist-sans)) to the body element.
      */}
      <body>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
