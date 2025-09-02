import { Settings } from 'luxon'

/**
 * Configuración global de Luxon para la aplicación
 * Establece el timezone por defecto a Buenos Aires
 */
export const configureLuxon = () => {
  // Establecer timezone por defecto a Buenos Aires
  Settings.defaultZone = 'America/Argentina/Buenos_Aires'
  
  // Configurar locale en español
  Settings.defaultLocale = 'es'
  
  // Configurar formato de números
  Settings.defaultNumberingSystem = 'latn'
  
  // Configurar formato de salida por defecto
  Settings.defaultOutputCalendar = 'gregory'
}

// Ejecutar configuración al importar el módulo
configureLuxon()
