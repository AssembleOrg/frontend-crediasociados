import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/ThemeProvider";
import DolarBlueProvider from "@/components/providers/DolarBlueProvider";
import { CacheResetProvider } from "@/components/providers/CacheResetProvider";
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
  title: "Crediasociados - Gestión de Préstamos",
  description: "Plataforma moderna para gestionar préstamos y clientes de forma simple y profesional",
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <CacheResetProvider>
            <DolarBlueProvider>
              {children}
            </DolarBlueProvider>
          </CacheResetProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
