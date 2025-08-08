export interface Cliente {
  id: string
  nombre: string
  dni: string
  email?: string
  telefono?: string
  direccion?: string
  ocupacion?: string
  prestamistaId: string
  fechaRegistro: Date
}

export interface Prestamo {
  id: string
  clienteId: string
  prestamistaId: string
  monto: number
  interes: number
  tipoInteres: 'diario' | 'mensual'
  cuotas: number
  montoTotal: number
  valorCuota: number
  fechaInicio: Date
  fechaVencimiento: Date
  estado: 'activo' | 'completado' | 'vencido'
  pagos: Pago[]
}

export interface Pago {
  id: string
  prestamoId: string
  numeroCuota: number
  monto: number
  fechaPago: Date
  fechaVencimiento: Date
  estado: 'pagado' | 'pendiente' | 'vencido'
}