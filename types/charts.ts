// Base types para todos los charts
export interface ChartDataPoint {
  [key: string]: string | number
}

// Específicos para cada chart de admin
export interface ManagersChartData extends ChartDataPoint {
  name: string
  value: number
  subadminId: string
}

export interface AmountChartData extends ChartDataPoint {
  name: string
  amount: number
  subadminId: string
}

export interface ClientsEvolutionData extends ChartDataPoint {
  date: string
  clients: number
}

// Charts para otros módulos
export interface CurrencyChartData extends ChartDataPoint {
  name: string
  value: number
  amount: number
}

export interface StatusChartData extends ChartDataPoint {
  name: string
  value: number
  amount: number
}

// Props para componentes de tooltip customizados
export interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload?: ChartDataPoint
  }>
  label?: string
}

// Props para labels customizados de pie charts
export interface PieChartLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  value: number
}

// Props para legend customizado
export interface ChartLegendProps {
  payload?: Array<{
    value: string
    payload?: ChartDataPoint
  }>
}

// Type-safe alternatives para Recharts
export type RechartsCompatibleData = ChartDataPoint[]

// Formatter types para recharts
export type ChartFormatter = (value: string | number, entry?: any) => string

// Props base para componentes de chart
export interface BaseChartProps<T extends ChartDataPoint> {
  data: T[]
  isLoading?: boolean
  height?: number | string
  width?: number | string
}