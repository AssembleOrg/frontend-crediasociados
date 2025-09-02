import { DateTime } from 'luxon'

/**
 * Hook para manejar fechas con timezone de Buenos Aires
 */
export const useBuenosAiresDate = () => {
  const TIMEZONE = 'America/Argentina/Buenos_Aires'

  // Obtener fecha actual en Buenos Aires
  const now = (): DateTime => {
    return DateTime.now().setZone(TIMEZONE)
  }

  // Convertir Date a DateTime con timezone Buenos Aires
  const fromJSDate = (date: Date): DateTime => {
    return DateTime.fromJSDate(date).setZone(TIMEZONE)
  }

  // Convertir DateTime a Date
  const toJSDate = (dateTime: DateTime): Date => {
    return dateTime.toJSDate()
  }

  // Formatear fecha para mostrar (DD/MM/YYYY)
  const formatDate = (date: Date | DateTime | null): string => {
    if (!date) return ''
    
    const dt = date instanceof DateTime ? date : fromJSDate(date)
    return dt.toFormat('dd/MM/yyyy')
  }

  // Formatear fecha y hora para mostrar (DD/MM/YYYY HH:mm)
  const formatDateTime = (date: Date | DateTime | null): string => {
    if (!date) return ''
    
    const dt = date instanceof DateTime ? date : fromJSDate(date)
    return dt.toFormat('dd/MM/yyyy HH:mm')
  }

  // Parsear fecha desde string (DD/MM/YYYY)
  const parseDate = (dateString: string): Date | null => {
    if (!dateString.trim()) return null
    
    const dt = DateTime.fromFormat(dateString, 'dd/MM/yyyy', { zone: TIMEZONE })
    
    if (!dt.isValid) return null
    
    return dt.toJSDate()
  }

  // Crear fecha desde componentes
  const createDate = (year: number, month: number, day: number): Date => {
    const dt = DateTime.fromObject({ year, month, day }, { zone: TIMEZONE })
    return dt.toJSDate()
  }

  // Obtener inicio del día en Buenos Aires
  const startOfDay = (date: Date | DateTime): DateTime => {
    const dt = date instanceof DateTime ? date : fromJSDate(date)
    return dt.startOf('day')
  }

  // Obtener fin del día en Buenos Aires
  const endOfDay = (date: Date | DateTime): DateTime => {
    const dt = date instanceof DateTime ? date : fromJSDate(date)
    return dt.endOf('day')
  }

  // Agregar días a una fecha
  const addDays = (date: Date | DateTime, days: number): Date => {
    const dt = date instanceof DateTime ? date : fromJSDate(date)
    return dt.plus({ days }).toJSDate()
  }

  // Agregar meses a una fecha
  const addMonths = (date: Date | DateTime, months: number): Date => {
    const dt = date instanceof DateTime ? date : fromJSDate(date)
    return dt.plus({ months }).toJSDate()
  }

  // Agregar años a una fecha
  const addYears = (date: Date | DateTime, years: number): Date => {
    const dt = date instanceof DateTime ? date : fromJSDate(date)
    return dt.plus({ years }).toJSDate()
  }

  // Comparar fechas (retorna -1, 0, o 1)
  const compareDates = (date1: Date | DateTime, date2: Date | DateTime): number => {
    const dt1 = date1 instanceof DateTime ? date1 : fromJSDate(date1)
    const dt2 = date2 instanceof DateTime ? date2 : fromJSDate(date2)
    
    if (dt1 < dt2) return -1
    if (dt1 > dt2) return 1
    return 0
  }

  // Verificar si una fecha está entre dos fechas
  const isBetween = (date: Date | DateTime, start: Date | DateTime, end: Date | DateTime): boolean => {
    const dt = date instanceof DateTime ? date : fromJSDate(date)
    const startDt = start instanceof DateTime ? start : fromJSDate(start)
    const endDt = end instanceof DateTime ? end : fromJSDate(end)
    
    return dt >= startDt && dt <= endDt
  }

  // Obtener diferencia en días entre dos fechas
  const diffInDays = (date1: Date | DateTime, date2: Date | DateTime): number => {
    const dt1 = date1 instanceof DateTime ? date1 : fromJSDate(date1)
    const dt2 = date2 instanceof DateTime ? date2 : fromJSDate(date2)
    
    return Math.floor(dt2.diff(dt1, 'days').days)
  }

  return {
    TIMEZONE,
    now,
    fromJSDate,
    toJSDate,
    formatDate,
    formatDateTime,
    parseDate,
    createDate,
    startOfDay,
    endOfDay,
    addDays,
    addMonths,
    addYears,
    compareDates,
    isBetween,
    diffInDays,
  }
}
