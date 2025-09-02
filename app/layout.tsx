import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/ThemeProvider";
import DolarBlueProvider from "@/components/providers/DolarBlueProvider";
import "@/lib/luxon-config"; // Configurar Luxon con timezone Buenos Aires
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
