import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthProvider';
import { ActiveCompanyProvider } from '@/context/ActiveCompanyProvider';
import { ActivePeriodProvider } from '@/context/ActivePeriodProvider';
import { ThemeProvider } from '@/context/ThemeProvider';
import { FirebaseInitializer } from '@/components/FirebaseInitializer';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Control Mipyme',
  description: 'Inicio de sesión seguro con Google',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
      <head>
        {/* Script para detectar JS y activar transiciones después de la carga */}
        <Script id="js-detection" strategy="beforeInteractive">
          {`(function() {
            document.documentElement.classList.add('js-enabled');
          })()`}
        </Script>
      </head>
      <body>
        <AuthProvider>
          <FirebaseInitializer>
            <ActiveCompanyProvider>
              <ActivePeriodProvider>
                <ThemeProvider>
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-grow container mx-auto px-4 py-8">{children}</main>
                </div>
                <Toaster />
              </ThemeProvider>
              </ActivePeriodProvider>
            </ActiveCompanyProvider>
          </FirebaseInitializer>
        </AuthProvider>
      </body>
    </html>
  );
}
