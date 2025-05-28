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
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
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
                  <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8">{children}</main>
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
