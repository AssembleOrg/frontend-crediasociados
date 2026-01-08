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
  // Payment info
  payment: {
    id: string
    amount: number
    paymentDate: Date
    description?: string
  }
  // SubLoan where payment was applied
  subLoan: {
    id: string
    paymentNumber: number
    totalAmount: number
    status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'
    paidAmount: number
    pendingAmount: number
  }
  // Loan info
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
  // Summary
  loanSummary: LoanSummary
  // All subloans
  subLoans: SubLoanInfo[]
  // Notes
  notes?: string
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
const COLORS = {
  primary: { r: 26, g: 64, b: 137 },      // #1A4089 - Crediasociados blue
  primaryLight: { r: 41, g: 98, b: 186 }, // Lighter blue
  success: { r: 34, g: 139, b: 34 },      // Forest green
  warning: { r: 255, g: 152, b: 0 },      // Orange
  danger: { r: 211, g: 47, b: 47 },       // Red
  text: { r: 33, g: 37, b: 41 },          // Dark gray
  textMuted: { r: 108, g: 117, b: 125 },  // Muted gray
  border: { r: 222, g: 226, b: 230 },     // Light border
  background: { r: 248, g: 249, b: 250 }, // Light background
  white: { r: 255, g: 255, b: 255 },
}

// ============ HELPERS ============
const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateLong = (date: Date): string => {
  return new Date(date).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatDateTime24h = (date: Date): string => {
  return new Date(date).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // Formato 24 horas
  })
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'PAID': return 'Pagada'
    case 'PARTIAL': return 'Parcial'
    case 'PENDING': return 'Pendiente'
    case 'OVERDUE': return 'Vencida'
    default: return status
  }
}

// ============ MAIN PDF GENERATOR ============
export const generatePaymentPDF = (data: PaymentReceiptData | LegacyPaymentReceiptData) => {
  // Check if it's legacy format
  if ('clientName' in data) {
    return generateLegacyPDF(data)
  }
  
  return generateNewPDF(data)
}

// ============ NEW PDF FORMAT ============
const generateNewPDF = (data: PaymentReceiptData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let y = margin

  // Check if client has pending debt
  const hasPendingDebt = data.loanSummary.totalPendiente > 0
  const hasOverduePayments = data.subLoans.some(s => s.status === 'OVERDUE')

  // ============ HEADER ============
  // Top accent line
  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b)
  doc.rect(0, 0, pageWidth, 4, 'F')

  // Company name
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b)
  doc.text('CREDIASOCIADOS', margin, y + 12)

  // Receipt number and date on right
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  const receiptNumber = `REC-${Date.now().toString().slice(-8)}`
  doc.text(`Comprobante: ${receiptNumber}`, pageWidth - margin, y + 8, { align: 'right' })
  doc.text(`Emisión: ${formatDateLong(new Date())}`, pageWidth - margin, y + 12, { align: 'right' })

  y += 20

  // Separator
  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)

  y += 8

  // ============ TITLE ============
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b)
  doc.text('COMPROBANTE DE PAGO', pageWidth / 2, y, { align: 'center' })

  y += 10

  // ============ CLIENT & LOAN INFO ============
  // Background box
  doc.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b)
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F')

  // Left column - Client
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text('CLIENTE', margin + 4, y + 6)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b)
  doc.text(data.loan.client.fullName, margin + 4, y + 12)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  const clientId = data.loan.client.dni 
    ? `DNI: ${data.loan.client.dni}` 
    : data.loan.client.cuit 
      ? `CUIT: ${data.loan.client.cuit}` 
      : ''
  if (clientId) {
    doc.text(clientId, margin + 4, y + 17)
  }

  // Right column - Loan
  const rightCol = pageWidth / 2 + 10
  doc.setFontSize(8)
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text('PRÉSTAMO', rightCol, y + 6)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b)
  doc.text(data.loan.loanTrack, rightCol, y + 12)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text(`Cuota abonada: #${data.subLoan.paymentNumber} de ${data.loanSummary.totalCuotas}`, rightCol, y + 17)

  y += 34

  // ============ PAYMENT DETAILS ============
  // Main payment box with accent border
  const paymentBoxHeight = 35
  doc.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b)
  doc.setLineWidth(1)
  doc.roundedRect(margin, y, contentWidth, paymentBoxHeight, 2, 2, 'S')

  // Payment amount
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text('MONTO ABONADO', margin + 6, y + 8)

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.success.r, COLORS.success.g, COLORS.success.b)
  doc.text(formatCurrency(data.payment.amount), margin + 6, y + 20)

  // Payment date
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text('FECHA DE PAGO', rightCol, y + 8)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b)
  doc.text(formatDateLong(data.payment.paymentDate), rightCol, y + 15)

  // Payment status
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text('ESTADO CUOTA', rightCol, y + 23)

  const statusColor = data.subLoan.status === 'PAID' ? COLORS.success : 
                      data.subLoan.status === 'PARTIAL' ? COLORS.warning : COLORS.danger
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(statusColor.r, statusColor.g, statusColor.b)
  doc.text(getStatusLabel(data.subLoan.status).toUpperCase(), rightCol, y + 29)

  y += paymentBoxHeight + 8

  // ============ PENDING DEBT ALERT ============
  if (hasPendingDebt) {
    const alertHeight = hasOverduePayments ? 24 : 20
    const alertColor = hasOverduePayments ? COLORS.danger : COLORS.warning
    
    // Alert background
    doc.setFillColor(alertColor.r, alertColor.g, alertColor.b)
    doc.roundedRect(margin, y, contentWidth, alertHeight, 2, 2, 'F')

    // Alert icon and text
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    
    const alertIcon = hasOverduePayments ? '!' : '!'
    doc.text(alertIcon, margin + 6, y + (alertHeight / 2) + 1)
    
    const alertTitle = hasOverduePayments 
      ? 'ATENCIÓN: CLIENTE CON CUOTAS VENCIDAS'
      : 'DEUDA PENDIENTE'
    doc.text(alertTitle, margin + 14, y + 8)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Saldo pendiente del préstamo: ${formatCurrency(data.loanSummary.totalPendiente)}`, margin + 14, y + 15)

    if (hasOverduePayments) {
      const overdueCount = data.subLoans.filter(s => s.status === 'OVERDUE').length
      doc.text(`Cuotas vencidas: ${overdueCount}`, margin + 14, y + 21)
    }

    y += alertHeight + 8
  }

  // ============ LOAN SUMMARY ============
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b)
  doc.text('RESUMEN DEL PRÉSTAMO', margin, y + 4)

  y += 8

  // Summary grid
  const colWidth = contentWidth / 4
  const summaryItems = [
    { label: 'Monto Prestado', value: formatCurrency(data.loanSummary.montoPrestado) },
    { label: 'Total a Devolver', value: formatCurrency(data.loanSummary.totalADevolver) },
    { label: 'Total Pagado', value: formatCurrency(data.loanSummary.saldoPagadoTotal), color: COLORS.success },
    { label: 'Saldo Pendiente', value: formatCurrency(data.loanSummary.totalPendiente), color: data.loanSummary.totalPendiente > 0 ? COLORS.danger : COLORS.success },
  ]

  doc.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b)
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F')

  summaryItems.forEach((item, index) => {
    const x = margin + (colWidth * index) + 4
    
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
    doc.text(item.label.toUpperCase(), x, y + 6)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    const valueColor = item.color || COLORS.text
    doc.setTextColor(valueColor.r, valueColor.g, valueColor.b)
    doc.text(item.value, x, y + 14)
  })

  y += 28

  // ============ INSTALLMENTS TABLE ============
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b)
  doc.text('DETALLE DE CUOTAS', margin, y + 4)

  y += 8

  // Table header
  const tableHeaders = ['#', 'Vencimiento', 'Monto', 'Pagado', 'Pendiente', 'Estado']
  const tableColWidths = [10, 30, 35, 35, 35, 30]
  
  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b)
  doc.rect(margin, y, contentWidth, 7, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)

  let xPos = margin + 2
  tableHeaders.forEach((header, index) => {
    const align = index > 1 && index < 5 ? 'right' : 'left'
    const textX = align === 'right' ? xPos + tableColWidths[index] - 4 : xPos
    doc.text(header, textX, y + 5, { align: align as any })
    xPos += tableColWidths[index]
  })

  y += 7

  // Table rows
  const rowHeight = 6
  const maxRows = Math.min(data.subLoans.length, 12) // Limit rows to fit page

  data.subLoans.slice(0, maxRows).forEach((subLoan, index) => {
    const isCurrentPayment = subLoan.id === data.subLoan.id
    const isOverdue = subLoan.status === 'OVERDUE'
    
    // Row background
    if (isCurrentPayment) {
      doc.setFillColor(230, 244, 255) // Light blue highlight
      doc.rect(margin, y, contentWidth, rowHeight, 'F')
    } else if (index % 2 === 0) {
      doc.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b)
      doc.rect(margin, y, contentWidth, rowHeight, 'F')
    }

    // Row border
    doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b)
    doc.setLineWidth(0.1)
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    
    xPos = margin + 2
    const rowData = [
      subLoan.paymentNumber.toString(),
      formatDate(subLoan.dueDate),
      formatCurrency(subLoan.totalAmount),
      formatCurrency(subLoan.paidAmount),
      formatCurrency(subLoan.pendingAmount),
      getStatusLabel(subLoan.status)
    ]

    rowData.forEach((cell, cellIndex) => {
      const align = cellIndex > 1 && cellIndex < 5 ? 'right' : 'left'
      const textX = align === 'right' ? xPos + tableColWidths[cellIndex] - 4 : xPos

      // Color based on status for last column
      if (cellIndex === 5) {
        const statusColor = subLoan.status === 'PAID' ? COLORS.success :
                           subLoan.status === 'PARTIAL' ? COLORS.warning :
                           subLoan.status === 'OVERDUE' ? COLORS.danger : COLORS.textMuted
        doc.setTextColor(statusColor.r, statusColor.g, statusColor.b)
        doc.setFont('helvetica', 'bold')
      } else if (cellIndex === 4 && subLoan.pendingAmount > 0) {
        // Pending amount in red if > 0
        doc.setTextColor(COLORS.danger.r, COLORS.danger.g, COLORS.danger.b)
      } else {
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b)
        doc.setFont('helvetica', 'normal')
      }

      doc.text(cell, textX, y + 4, { align: align as any })
      xPos += tableColWidths[cellIndex]
    })

    y += rowHeight
  })

  // Show "..." if more rows
  if (data.subLoans.length > maxRows) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
    doc.text(`... y ${data.subLoans.length - maxRows} cuotas más`, margin + 4, y + 4)
    y += 6
  }

  y += 6

  // ============ INSTALLMENTS SUMMARY ============
  doc.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b)
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F')

  const cuotaSummaryItems = [
    { label: 'Total Cuotas', value: data.loanSummary.totalCuotas.toString() },
    { label: 'Pagadas', value: data.loanSummary.cuotasPagadasTotales.toString(), color: COLORS.success },
    { label: 'Parciales', value: data.loanSummary.cuotasPagadasParciales.toString(), color: data.loanSummary.cuotasPagadasParciales > 0 ? COLORS.warning : COLORS.textMuted },
    { label: 'Pendientes', value: data.loanSummary.cuotasNoPagadas.toString(), color: data.loanSummary.cuotasNoPagadas > 0 ? COLORS.danger : COLORS.success },
  ]

  const cuotaColWidth = contentWidth / 4
  cuotaSummaryItems.forEach((item, index) => {
    const x = margin + (cuotaColWidth * index) + 4
    
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
    doc.text(item.label.toUpperCase(), x, y + 5)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    const valueColor = item.color || COLORS.text
    doc.setTextColor(valueColor.r, valueColor.g, valueColor.b)
    doc.text(item.value, x, y + 11)
  })

  y += 20

  // ============ NOTES ============
  if (data.notes || data.payment.description) {
    const noteText = data.payment.description || data.notes || ''
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
    doc.text('OBSERVACIONES', margin, y + 4)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b)
    const noteLines = doc.splitTextToSize(noteText, contentWidth - 8)
    doc.text(noteLines, margin, y + 10)

    y += 10 + (noteLines.length * 4)
  }

  // ============ FOOTER ============
  const footerY = pageHeight - 25

  // Separator
  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY, pageWidth - margin, footerY)

  // Footer content
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)

  doc.text('Este comprobante es válido como constancia de pago.', margin, footerY + 6)
  doc.text(`Generado el ${formatDateTime24h(new Date())}`, margin, footerY + 10)
  
  // Company info on right
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b)
  doc.text('CREDIASOCIADOS', pageWidth - margin, footerY + 6, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text('Sistema de Gestión de Préstamos', pageWidth - margin, footerY + 10, { align: 'right' })

  // Bottom accent line
  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b)
  doc.rect(0, pageHeight - 4, pageWidth, 4, 'F')

  // ============ DOWNLOAD ============
  const clientNameClean = data.loan.client.fullName.replace(/\s+/g, '-').substring(0, 20)
  const fileName = `comprobante-${data.loan.loanTrack}-${clientNameClean}-${receiptNumber}.pdf`
  doc.save(fileName)
}

// ============ LEGACY PDF FORMAT (backwards compatibility) ============
const generateLegacyPDF = (data: LegacyPaymentReceiptData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let y = margin

  // ============ HEADER ============
  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b)
  doc.rect(0, 0, pageWidth, 4, 'F')

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b)
  doc.text('CREDIASOCIADOS', margin, y + 12)

  const receiptNumber = `REC-${Date.now().toString().slice(-8)}`
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text(`Comprobante: ${receiptNumber}`, pageWidth - margin, y + 8, { align: 'right' })
  doc.text(`Emisión: ${formatDateLong(new Date())}`, pageWidth - margin, y + 12, { align: 'right' })

  y += 20

  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)

  y += 8

  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b)
  doc.text('COMPROBANTE DE PAGO', pageWidth / 2, y, { align: 'center' })

  y += 12

  // Client info
  doc.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b)
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F')

  doc.setFontSize(8)
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text('CLIENTE', margin + 4, y + 6)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b)
  doc.text(data.clientName, margin + 4, y + 14)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text(`Préstamo: ${data.loanTrack || 'N/A'}  •  Cuota #${data.paymentNumber}`, margin + 4, y + 20)

  y += 30

  // Payment details
  const statusColor = data.status === 'PAID' ? COLORS.success : COLORS.warning
  doc.setDrawColor(statusColor.r, statusColor.g, statusColor.b)
  doc.setLineWidth(1)
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'S')

  doc.setFontSize(8)
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text('MONTO ABONADO', margin + 6, y + 8)

  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(statusColor.r, statusColor.g, statusColor.b)
  doc.text(formatCurrency(data.amount), margin + 6, y + 22)

  doc.setFontSize(8)
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text('FECHA DE PAGO', pageWidth / 2 + 10, y + 8)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b)
  doc.text(formatDateLong(data.paymentDate), pageWidth / 2 + 10, y + 15)

  doc.setFontSize(8)
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text('ESTADO', pageWidth / 2 + 10, y + 22)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(statusColor.r, statusColor.g, statusColor.b)
  doc.text(data.status === 'PAID' ? 'PAGO COMPLETO' : 'PAGO PARCIAL', pageWidth / 2 + 10, y + 28)

  y += 40

  // Remaining amount for partial
  if (data.status === 'PARTIAL' && data.remainingAmount && data.remainingAmount > 0) {
    doc.setFillColor(COLORS.warning.r, COLORS.warning.g, COLORS.warning.b)
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('SALDO PENDIENTE DE ESTA CUOTA', margin + 6, y + 7)

    doc.setFontSize(12)
    doc.text(formatCurrency(data.remainingAmount), margin + 6, y + 14)

    y += 24
  }

  // Notes
  if (data.notes) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
    doc.text('OBSERVACIONES', margin, y + 4)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b)
    const noteLines = doc.splitTextToSize(data.notes, contentWidth - 8)
    doc.text(noteLines, margin, y + 10)
  }

  // Footer
  const footerY = pageHeight - 25
  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY, pageWidth - margin, footerY)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text('Este comprobante es válido como constancia de pago.', margin, footerY + 6)
  doc.text(`Generado el ${formatDateTime24h(new Date())}`, margin, footerY + 10)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b)
  doc.text('CREDIASOCIADOS', pageWidth - margin, footerY + 6, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted.r, COLORS.textMuted.g, COLORS.textMuted.b)
  doc.text('Sistema de Gestión de Préstamos', pageWidth - margin, footerY + 10, { align: 'right' })

  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b)
  doc.rect(0, pageHeight - 4, pageWidth, 4, 'F')

  const clientNameClean = data.clientName.replace(/\s+/g, '-').substring(0, 20)
  const fileName = `comprobante-${data.loanTrack || 'pago'}-${clientNameClean}-${receiptNumber}.pdf`
  doc.save(fileName)
}

export default generatePaymentPDF
