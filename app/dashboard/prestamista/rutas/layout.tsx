'use client';

/**
 * Layout para la sección de Rutas de Cobro
 * Deshabilita SSR para react-beautiful-dnd
 */
export default function RutasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

