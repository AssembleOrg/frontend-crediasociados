import jsPDF from 'jspdf'
import { formatAmount } from '@/lib/formatters'

export interface PaymentReceiptData {
  clientName: string
  paymentNumber: number
  amount: number
  paymentDate: Date
  loanTrack: string
  status: 'PARTIAL' | 'PAID'
  remainingAmount?: number
  notes?: string
}

/**
 * Genera un comprobante de pago en PDF profesional
 * @param data Datos del pago
 */
export const generatePaymentPDF = (data: PaymentReceiptData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = margin

  // ============ HEADER ============
  doc.setFillColor(76, 175, 80) // Green for PAID, will override for PARTIAL
  if (data.status === 'PARTIAL') {
    doc.setFillColor(255, 152, 0) // Orange for PARTIAL
  }

  doc.rect(0, 0, pageWidth, 30, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.text('COMPROBANTE DE PAGO', pageWidth / 2, 12, { align: 'center' })

  // Status badge
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(`Estado: ${data.status}`, pageWidth / 2, 20, { align: 'center' })

  yPosition = 45

  // ============ CLIENT INFO ============
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('Información del Cliente', margin, yPosition)
  yPosition += 10

  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(`Cliente: ${data.clientName}`, margin, yPosition)
  yPosition += 6
  doc.text(`Código de Préstamo: ${data.loanTrack}`, margin, yPosition)
  yPosition += 6
  doc.text(`Cuota #: ${data.paymentNumber}`, margin, yPosition)
  yPosition += 12

  // ============ PAYMENT DETAILS ============
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('Detalles del Pago', margin, yPosition)
  yPosition += 10

  // Table-like layout
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')

  const labelWidth = 40
  const valueX = margin + labelWidth

  doc.text('Monto Pagado:', margin, yPosition)
  doc.setFont(undefined, 'bold')
  doc.text(`$${formatAmount(data.amount.toString())}`, valueX, yPosition)
  doc.setFont(undefined, 'normal')
  yPosition += 6

  doc.text('Fecha de Pago:', margin, yPosition)
  doc.setFont(undefined, 'bold')
  doc.text(data.paymentDate.toLocaleDateString('es-AR'), valueX, yPosition)
  doc.setFont(undefined, 'normal')
  yPosition += 6

  // Remaining amount if PARTIAL
  if (data.status === 'PARTIAL' && data.remainingAmount && data.remainingAmount > 0) {
    doc.setTextColor(255, 152, 0) // Orange
    doc.setFont(undefined, 'bold')
    doc.text('Restante por Pagar:', margin, yPosition)
    doc.text(`$${formatAmount(data.remainingAmount.toString())}`, valueX, yPosition)
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, 'normal')
    yPosition += 6
  }

  yPosition += 6

  // ============ NOTES ============
  if (data.notes) {
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('Notas:', margin, yPosition)
    yPosition += 6

    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 2 * margin)
    doc.text(notesLines, margin, yPosition)
    yPosition += notesLines.length * 5 + 6
  }

  // ============ FOOTER ============
  const footerY = pageHeight - 20

  // Border line
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(100, 100, 100)

  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, margin, footerY)
  doc.text('Sistema: Prestamito', margin, footerY + 4)
  doc.text('Este comprobante es válido como constancia de pago', margin, footerY + 8)

  // ============ DOWNLOAD ============
  const fileName = `comprobante-pago-${data.clientName.replace(/\s+/g, '-')}-cuota${data.paymentNumber}.pdf`
  doc.save(fileName)
}

export default generatePaymentPDF
