import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/ThemeProvider";
import DolarBlueProvider from "@/components/providers/DolarBlueProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "Prestamito - Gestión de Préstamos",
  description: "Plataforma moderna para gestionar préstamos y clientes de forma simple y profesional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://crediasociados-backend-production.up.railway.app" />
        <link
          rel="preload"
          href="/_next/static/media/4cf2300e9c8272f7-s.p.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <DolarBlueProvider>
            {children}
          </DolarBlueProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
