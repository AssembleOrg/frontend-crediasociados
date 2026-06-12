import jsPDF from 'jspdf'

// ============ TYPES ============
export interface PaymentInfo {
  id: string
  amount: number
  paymentDate: Date
  description?: string
}

export interface SubLoanInfo {
  id: string
  paymentNumber: number
  amount: number
  totalAmount: number
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'
  dueDate: Date
  paidDate: Date | null
  paidAmount: number
  pendingAmount: number
  daysOverdue: number
}

export interface LoanSummary {
  montoPrestado: number
  totalADevolver: number
  totalPendiente: number
  saldoPagadoTotal: number
  totalCuotas: number
  cuotasPagadasTotales: number
  cuotasPagadasParciales: number
  cuotasNoPagadas: number
}

export interface PaymentReceiptData {
  payment: {
    id: string
    amount: number
    paymentDate: Date
    description?: string
  }
  subLoan: {
    id: string
    paymentNumber: number
    totalAmount: number
    status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'
    paidAmount: number
    pendingAmount: number
  }
  loan: {
    id: string
    loanTrack: string
    amount: number
    originalAmount: number
    currency: string
    client: {
      id: string
      fullName: string
      dni: string | null
      cuit: string | null
    }
  }
  loanSummary: LoanSummary
  subLoans: SubLoanInfo[]
  notes?: string
  distributedPayments?: {
    subLoanPaymentNumber: number
    distributedAmount: number
    newStatus: 'PARTIAL' | 'PAID'
  }[]
}

// Legacy interface for backwards compatibility
export interface LegacyPaymentReceiptData {
  clientName: string
  paymentNumber: number
  amount: number
  paymentDate: Date
  loanTrack: string
  status: 'PARTIAL' | 'PAID'
  remainingAmount?: number
  notes?: string
}

// ============ COLORS ============
const C = {
  primary:   [26,  64,  137] as const,
  success:   [34,  163,  90] as const,
  warning:   [224, 120,   0] as const,
  danger:    [200,  40,  40] as const,
  text:      [22,   22,  30] as const,
  muted:     [108, 118, 130] as const,
  border:    [218, 222, 228] as const,
  bg:        [245, 246, 248] as const,
  bgDark:    [235, 237, 242] as const,
  white:     [255, 255, 255] as const,
}

type RGB = readonly [number, number, number]

// ============ HELPERS ============
const fc = (amount: number): string => {
  const fixed = Math.abs(amount).toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `$${withDots},${decPart}`
}

const fd = (date: Date) =>
  new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const fdLong = (date: Date) =>
  new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

const fdt = (date: Date) =>
  new Date(date).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })

const statusLabel = (s: string) =>
  ({ PAID: 'Pagada', PARTIAL: 'Parcial', PENDING: 'Pendiente', OVERDUE: 'Vencida' })[s] ?? s

const statusColor = (s: string): RGB =>
  s === 'PAID' ? C.success : s === 'PARTIAL' ? C.warning : s === 'OVERDUE' ? C.danger : C.muted

// Helpers to set colors without destructuring each time
const setFill  = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2])
const setStroke= (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2])
const setTxt   = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2])

// ============ MAIN PDF GENERATOR ============
export const generatePaymentPDF = (data: PaymentReceiptData | LegacyPaymentReceiptData) => {
  if ('clientName' in data) return generateLegacyPDF(data)
  return generateNewPDF(data)
}

// ============ NEW PDF FORMAT ============
const generateNewPDF = (data: PaymentReceiptData) => {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = doc.internal.pageSize.getWidth()   // 210
  const H    = doc.internal.pageSize.getHeight()  // 297
  const M    = 16          // margin
  const CW   = W - 2 * M  // content width
  let y      = 0

  const { payment, subLoan, loan, loanSummary } = data
  const cuota    = subLoan.paymentNumber
  const total    = loanSummary.totalCuotas
  const pagadas  = loanSummary.cuotasPagadasTotales
  const restan   = loanSummary.cuotasNoPagadas
  const sColor   = statusColor(subLoan.status)
  const hasPend  = loanSummary.totalPendiente > 0
  const hasOver  = data.subLoans.some(s => s.status === 'OVERDUE')
  const recNum   = `REC-${Date.now().toString().slice(-8)}`

  // ─── HEADER BAR ────────────────────────────────────────────────────────────
  setFill(doc, C.primary)
  doc.rect(0, 0, W, 18, 'F')

  // Thin accent line below header
  setFill(doc, [16, 45, 100])
  doc.rect(0, 18, W, 1, 'F')

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.white)
  doc.text('CREDIASOCIADOS', M, 12)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, [180, 200, 235])
  doc.text('COMPROBANTE DE PAGO', W - M, 12, { align: 'right' })

  y = 28

  // ─── CLIENTE + PRÉSTAMO (dos columnas) ─────────────────────────────────────
  // Left: cliente
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.muted)
  doc.text('CLIENTE', M, y)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.text)
  doc.text(loan.client.fullName, M, y + 7)

  const clientId = loan.client.dni
    ? `DNI ${loan.client.dni}`
    : loan.client.cuit ? `CUIT ${loan.client.cuit}` : ''
  if (clientId) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    setTxt(doc, C.muted)
    doc.text(clientId, M, y + 13)
  }

  // Right: préstamo
  const RX = W / 2 + 8
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.muted)
  doc.text('PRÉSTAMO', RX, y)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.primary)
  doc.text(loan.loanTrack, RX, y + 7)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, C.muted)
  doc.text(fdLong(payment.paymentDate), RX, y + 13)

  y += 22

  // ─── DIVIDER ───────────────────────────────────────────────────────────────
  setStroke(doc, C.border)
  doc.setLineWidth(0.25)
  doc.line(M, y, W - M, y)
  y += 10

  // ─── SECCIÓN CUOTA (caja destacada) ────────────────────────────────────────
  const CBOX_H = 34
  setFill(doc, C.bg)
  // Borde izquierdo azul como acento
  setFill(doc, C.primary)
  doc.rect(M, y, 3, CBOX_H, 'F')
  setFill(doc, C.bg)
  doc.rect(M + 3, y, CW - 3, CBOX_H, 'F')

  // Label "CUOTA ACTUAL"
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.muted)
  doc.text('CUOTA ACTUAL', M + 9, y + 7)

  // Número grande (32pt) + "/ total" (13pt) en la MISMA baseline
  const baseY = y + 25
  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.primary)
  doc.text(`${cuota}`, M + 9, baseY)

  const numW = doc.getTextWidth(`${cuota}`)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, C.muted)
  doc.text(`/ ${total}`, M + 9 + numW + 2, baseY)

  // Barra de progreso (fina, debajo del número)
  const barX = M + 9
  const barY = y + CBOX_H - 5
  const barW = CW / 2 - 16
  const pct  = total > 0 ? Math.min(pagadas / total, 1) : 0

  setFill(doc, C.border)
  doc.roundedRect(barX, barY, barW, 2.5, 1, 1, 'F')
  if (pct > 0) {
    setFill(doc, C.primary)
    doc.roundedRect(barX, barY, barW * pct, 2.5, 1, 1, 'F')
  }

  // Resumen derecha: "Pagadas X · Restan Y"
  const statX = W - M - 52
  const statY = y + 7

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.muted)
  doc.text('PAGADAS', statX, statY)
  doc.text('RESTAN', statX + 30, statY)

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.success)
  doc.text(`${pagadas}`, statX, statY + 14)

  setTxt(doc, restan > 0 ? C.warning : C.success)
  doc.text(`${restan}`, statX + 30, statY + 14)

  // Separador vertical entre los dos bloques de stat
  setStroke(doc, C.border)
  doc.setLineWidth(0.2)
  doc.line(statX - 5, y + 5, statX - 5, y + CBOX_H - 4)

  y += CBOX_H + 10

  // ─── MONTO ABONADO ─────────────────────────────────────────────────────────
  const MBOX_H = 30
  setStroke(doc, sColor)
  doc.setLineWidth(0.7)
  doc.roundedRect(M, y, CW, MBOX_H, 2, 2, 'S')

  // Accent line top inside box
  setFill(doc, sColor)
  doc.roundedRect(M, y, CW, 3, 2, 2, 'F')
  // Cover bottom corners of accent
  doc.rect(M, y + 1.5, CW, 1.5, 'F')

  // Label
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, C.muted)
  doc.text('MONTO ABONADO', M + 6, y + 11)

  // Amount
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, sColor)
  doc.text(fc(payment.amount), M + 6, y + 24)

  // Right: estado + fecha
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, C.muted)
  doc.text('ESTADO', RX, y + 11)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, sColor)
  doc.text(statusLabel(subLoan.status).toUpperCase(), RX, y + 19)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, C.muted)
  doc.text(fd(payment.paymentDate), RX, y + 26)

  // Saldo pendiente de esta cuota
  if (subLoan.pendingAmount > 0) {
    const px = RX + 38
    doc.setFontSize(7)
    setTxt(doc, C.muted)
    doc.text('PENDIENTE CUOTA', px, y + 11)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    setTxt(doc, C.danger)
    doc.text(fc(subLoan.pendingAmount), px, y + 19)
  }

  y += MBOX_H + 8

  // ─── ALERTA DEUDA / VENCIDAS ────────────────────────────────────────────────
  if (hasPend) {
    const aC = hasOver ? C.danger : C.warning
    setFill(doc, aC)
    doc.roundedRect(M, y, CW, 12, 2, 2, 'F')

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    setTxt(doc, C.white)
    const alertMsg = hasOver
      ? `Cuotas vencidas · Saldo pendiente: ${fc(loanSummary.totalPendiente)}`
      : `Deuda pendiente del préstamo: ${fc(loanSummary.totalPendiente)}`
    doc.text(alertMsg, M + 5, y + 8)
    y += 19
  }

  // ─── EXCEDENTE / DISTRIBUCIÓN ──────────────────────────────────────────────
  if (data.distributedPayments && data.distributedPayments.length > 0) {
    const rowH = 7
    const boxH = 10 + data.distributedPayments.length * rowH + 4
    setFill(doc, [255, 244, 229])
    doc.roundedRect(M, y, CW, boxH, 2, 2, 'F')
    setStroke(doc, C.warning)
    doc.setLineWidth(0.4)
    doc.roundedRect(M, y, CW, boxH, 2, 2, 'S')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    setTxt(doc, C.warning)
    doc.text('PAGO CON EXCEDENTE — SE APLICÓ A:', M + 5, y + 8)

    data.distributedPayments.forEach((dp, i) => {
      const rowY = y + 13 + i * rowH
      const dColor: RGB = dp.newStatus === 'PAID' ? C.success : C.warning
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      setTxt(doc, C.text)
      doc.text(`• Cuota #${dp.subLoanPaymentNumber}`, M + 7, rowY)
      doc.text(`→  ${fc(dp.distributedAmount)}`, M + 50, rowY)
      doc.setFont('helvetica', 'bold')
      setTxt(doc, dColor)
      doc.text(dp.newStatus === 'PAID' ? 'PAGADA' : 'PARCIAL', M + 110, rowY)
    })

    y += boxH + 8
  }

  // ─── RESUMEN FINANCIERO ─────────────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.text)
  doc.text('RESUMEN DEL PRÉSTAMO', M, y + 4)
  y += 9

  setFill(doc, C.bg)
  doc.roundedRect(M, y, CW, 20, 2, 2, 'F')
  // Thin top border on summary
  setFill(doc, C.bgDark)
  doc.roundedRect(M, y, CW, 2, 2, 2, 'F')
  doc.rect(M, y + 1, CW, 1, 'F')

  const finItems: [string, number, RGB][] = [
    ['PRESTADO',       loanSummary.montoPrestado,    C.text],
    ['A DEVOLVER',     loanSummary.totalADevolver,   C.text],
    ['YA PAGADO',      loanSummary.saldoPagadoTotal, C.success],
    ['SALDO PEND.',    loanSummary.totalPendiente,   loanSummary.totalPendiente > 0 ? C.danger : C.success],
  ]

  const colW = CW / 4
  finItems.forEach(([label, value, color], i) => {
    const x = M + colW * i + 5
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    setTxt(doc, C.muted)
    doc.text(label, x, y + 9)

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    setTxt(doc, color)
    doc.text(fc(value), x, y + 16)
  })

  y += 27

  // ─── OBSERVACIONES ─────────────────────────────────────────────────────────
  const noteText = payment.description || data.notes
  if (noteText) {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    setTxt(doc, C.muted)
    doc.text('OBSERVACIONES', M, y)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    setTxt(doc, C.text)
    const lines = doc.splitTextToSize(noteText, CW)
    doc.text(lines, M, y + 7)
    y += 7 + lines.length * 4 + 4
  }

  // ─── WATERMARK ─────────────────────────────────────────────────────────────
  doc.saveGraphicsState()
  doc.setGState(new (doc as any).GState({ opacity: 0.07 }))
  doc.setFontSize(52)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.primary)
  doc.text('CREDIASOCIADOS', W / 2, H / 2, { align: 'center', angle: 45 })
  doc.restoreGraphicsState()

  // ─── FOOTER ────────────────────────────────────────────────────────────────
  const fY = H - 22
  setStroke(doc, C.border)
  doc.setLineWidth(0.2)
  doc.line(M, fY, W - M, fY)

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, C.muted)
  doc.text(`${recNum}  ·  ${fdt(new Date())}`, M, fY + 5)
  doc.text('Comprobante válido como constancia de pago · CREDIASOCIADOS', W - M, fY + 5, { align: 'right' })

  // Pistech credit
  doc.setFontSize(5.5)
  setTxt(doc, [180, 185, 195])
  doc.text('Desarrollado por Pistech', W / 2, fY + 10, { align: 'center' })

  // Bottom bar
  setFill(doc, C.primary)
  doc.rect(0, H - 3.5, W, 3.5, 'F')

  // ─── SAVE ──────────────────────────────────────────────────────────────────
  const name = loan.client.fullName.replace(/\s+/g, '-').substring(0, 20)
  doc.save(`comprobante-${loan.loanTrack}-${name}.pdf`)
}

// ============ LEGACY PDF FORMAT (backwards compatibility) ============
const generateLegacyPDF = (data: LegacyPaymentReceiptData) => {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = doc.internal.pageSize.getWidth()
  const H    = doc.internal.pageSize.getHeight()
  const M    = 16
  const CW   = W - 2 * M
  let y      = 0

  const recNum = `REC-${Date.now().toString().slice(-8)}`
  const sColor: RGB = data.status === 'PAID' ? C.success : C.warning

  // Header
  setFill(doc, C.primary)
  doc.rect(0, 0, W, 18, 'F')
  setFill(doc, [16, 45, 100])
  doc.rect(0, 18, W, 1, 'F')

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.white)
  doc.text('CREDIASOCIADOS', M, 12)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, [180, 200, 235])
  doc.text('COMPROBANTE DE PAGO', W - M, 12, { align: 'right' })

  y = 28

  // Cliente
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.muted)
  doc.text('CLIENTE', M, y)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.text)
  doc.text(data.clientName, M, y + 7)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, C.muted)
  doc.text(`Préstamo: ${data.loanTrack || 'N/A'}`, M, y + 13)

  y += 22

  setStroke(doc, C.border)
  doc.setLineWidth(0.25)
  doc.line(M, y, W - M, y)
  y += 10

  // Cuota grande
  const CBOX_H = 32
  setFill(doc, C.primary)
  doc.rect(M, y, 3, CBOX_H, 'F')
  setFill(doc, C.bg)
  doc.rect(M + 3, y, CW - 3, CBOX_H, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.muted)
  doc.text('CUOTA ACTUAL', M + 9, y + 7)

  const baseY = y + 24
  doc.setFontSize(30)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.primary)
  doc.text(`${data.paymentNumber}`, M + 9, baseY)

  const numW = doc.getTextWidth(`${data.paymentNumber}`)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, C.muted)
  doc.text('de préstamo', M + 9 + numW + 3, baseY)

  y += CBOX_H + 10

  // Monto
  setStroke(doc, sColor)
  doc.setLineWidth(0.7)
  doc.roundedRect(M, y, CW, 28, 2, 2, 'S')
  setFill(doc, sColor)
  doc.roundedRect(M, y, CW, 3, 2, 2, 'F')
  doc.rect(M, y + 1.5, CW, 1.5, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, C.muted)
  doc.text('MONTO ABONADO', M + 6, y + 11)

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, sColor)
  doc.text(fc(data.amount), M + 6, y + 23)

  const RX = W / 2 + 8
  doc.setFontSize(7)
  setTxt(doc, C.muted)
  doc.text('ESTADO', RX, y + 11)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, sColor)
  doc.text(data.status === 'PAID' ? 'PAGADA' : 'PARCIAL', RX, y + 19)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, C.muted)
  doc.text(fdLong(data.paymentDate), RX, y + 25)

  y += 36

  if (data.status === 'PARTIAL' && data.remainingAmount && data.remainingAmount > 0) {
    setFill(doc, C.warning)
    doc.roundedRect(M, y, CW, 12, 2, 2, 'F')
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    setTxt(doc, C.white)
    doc.text(`Saldo pendiente: ${fc(data.remainingAmount)}`, M + 5, y + 8)
    y += 18
  }

  if (data.notes) {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    setTxt(doc, C.muted)
    doc.text('OBSERVACIONES', M, y)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    setTxt(doc, C.text)
    const lines = doc.splitTextToSize(data.notes, CW)
    doc.text(lines, M, y + 7)
  }

  // Watermark
  doc.saveGraphicsState()
  doc.setGState(new (doc as any).GState({ opacity: 0.07 }))
  doc.setFontSize(52)
  doc.setFont('helvetica', 'bold')
  setTxt(doc, C.primary)
  doc.text('CREDIASOCIADOS', W / 2, H / 2, { align: 'center', angle: 45 })
  doc.restoreGraphicsState()

  // Footer
  const fY = H - 22
  setStroke(doc, C.border)
  doc.setLineWidth(0.2)
  doc.line(M, fY, W - M, fY)

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  setTxt(doc, C.muted)
  doc.text(`${recNum}  ·  ${fdt(new Date())}`, M, fY + 5)
  doc.text('Comprobante válido · CREDIASOCIADOS', W - M, fY + 5, { align: 'right' })

  doc.setFontSize(5.5)
  setTxt(doc, [180, 185, 195])
  doc.text('Desarrollado por Pistech', W / 2, fY + 10, { align: 'center' })

  setFill(doc, C.primary)
  doc.rect(0, H - 3.5, W, 3.5, 'F')

  const name = data.clientName.replace(/\s+/g, '-').substring(0, 20)
  doc.save(`comprobante-${data.loanTrack || 'pago'}-${name}.pdf`)
}

export default generatePaymentPDF
