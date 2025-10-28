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
 * Genera un comprobante de pago en PDF profesional con diseño mejorado
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
  const margin = 20
  let yPosition = margin

  // ============ HEADER WITH GRADIENT EFFECT ============
  const headerHeight = 50
  
  // Main header background (status-based color)
  if (data.status === 'PAID') {
    doc.setFillColor(46, 125, 50) // Dark green for PAID
  } else {
    doc.setFillColor(245, 124, 0) // Orange for PARTIAL
  }
  doc.rect(0, 0, pageWidth, headerHeight, 'F')

  // Decorative top bar - lighter shade
  if (data.status === 'PAID') {
    doc.setFillColor(56, 142, 60) // Lighter green
  } else {
    doc.setFillColor(251, 140, 0) // Lighter orange
  }
  doc.rect(0, 0, pageWidth, 8, 'F')

  // Company name / System
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('CREDIASOCIADOS', margin, 15)

  // Title
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPROBANTE DE PAGO', pageWidth / 2, 30, { align: 'center' })

  // Status badge
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const statusText = data.status === 'PAID' ? 'PAGO COMPLETO' : 'PAGO PARCIAL'
  doc.text(statusText, pageWidth / 2, 40, { align: 'center' })

  yPosition = headerHeight + 20

  // ============ RECEIPT NUMBER / DATE BOX ============
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 20, 3, 3, 'S')

  doc.setTextColor(100, 100, 100)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('FECHA DE EMISIÓN', margin + 5, yPosition + 6)
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(new Date().toLocaleDateString('es-AR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), margin + 5, yPosition + 13)

  // Receipt number on the right
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('N° COMPROBANTE', pageWidth - margin - 5, yPosition + 6, { align: 'right' })
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  const receiptNumber = `${Date.now().toString().slice(-8)}`
  doc.text(receiptNumber, pageWidth - margin - 5, yPosition + 13, { align: 'right' })

  yPosition += 35

  // ============ CLIENT INFORMATION CARD ============
  doc.setFillColor(248, 249, 250)
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 35, 3, 3, 'F')
  
  doc.setTextColor(33, 150, 243) // Blue accent
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMACIÓN DEL CLIENTE', margin + 5, yPosition + 8)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const clientInfoY = yPosition + 16
  doc.text('Cliente:', margin + 5, clientInfoY)
  doc.setFont('helvetica', 'bold')
  doc.text(data.clientName, margin + 30, clientInfoY)

  doc.setFont('helvetica', 'normal')
  doc.text('Código de Préstamo:', margin + 5, clientInfoY + 6)
  doc.setFont('helvetica', 'bold')
  doc.text(data.loanTrack || 'N/A', margin + 50, clientInfoY + 6)

  doc.setFont('helvetica', 'normal')
  doc.text('Cuota #:', margin + 5, clientInfoY + 12)
  doc.setFont('helvetica', 'bold')
  doc.text(data.paymentNumber.toString(), margin + 30, clientInfoY + 12)

  yPosition += 50

  // ============ PAYMENT DETAILS BOX ============
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(33, 150, 243)
  doc.setLineWidth(0.8)
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 50, 3, 3, 'FD')

  doc.setTextColor(33, 150, 243)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLES DEL PAGO', margin + 5, yPosition + 8)

  // Payment amount - large and prominent
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Monto Pagado:', margin + 5, yPosition + 20)
  
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  if (data.status === 'PAID') {
    doc.setTextColor(46, 125, 50) // Green
  } else {
    doc.setTextColor(245, 124, 0) // Orange
  }
  doc.text(`$${data.amount.toLocaleString('es-AR')}`, margin + 5, yPosition + 32)

  // Payment date
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Fecha de Pago:', pageWidth / 2 + 10, yPosition + 20)
  doc.setFont('helvetica', 'bold')
  doc.text(data.paymentDate.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), pageWidth / 2 + 10, yPosition + 28)

  yPosition += 65

  // ============ REMAINING AMOUNT (if PARTIAL) ============
  if (data.status === 'PARTIAL' && data.remainingAmount && data.remainingAmount > 0) {
    doc.setFillColor(255, 243, 224) // Light orange background
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 25, 3, 3, 'F')

    doc.setTextColor(230, 81, 0) // Dark orange
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('⚠ SALDO PENDIENTE', margin + 5, yPosition + 8)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Restante por Pagar:', margin + 5, yPosition + 16)
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`$${data.remainingAmount.toLocaleString('es-AR')}`, margin + 60, yPosition + 16)

    yPosition += 35
  }

  // ============ NOTES SECTION ============
  if (data.notes) {
    doc.setFillColor(248, 249, 250)
    const notesHeight = 30
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, notesHeight, 3, 3, 'F')

    doc.setTextColor(100, 100, 100)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTAS ADICIONALES', margin + 5, yPosition + 8)

    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 2 * margin - 10)
    doc.text(notesLines, margin + 5, yPosition + 15)

    yPosition += notesHeight + 10
  }

  // ============ FOOTER ============
  const footerY = pageHeight - 35

  // Separator line
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY, pageWidth - margin, footerY)

  // Footer info box
  doc.setFillColor(248, 249, 250)
  doc.rect(margin, footerY + 5, pageWidth - 2 * margin, 25, 'F')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)

  const footerTextY = footerY + 12
  doc.text('✓ Este comprobante es válido como constancia de pago', margin + 5, footerTextY)
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, margin + 5, footerTextY + 5)
  doc.text('Sistema de Gestión de Préstamos - Crediasociados', margin + 5, footerTextY + 10)

  // QR code placeholder or company logo area (optional)
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.rect(pageWidth - margin - 20, footerY + 7, 18, 18, 'S')
  doc.setFontSize(6)
  doc.setTextColor(150, 150, 150)
  doc.text('QR', pageWidth - margin - 11, footerY + 17, { align: 'center' })

  // ============ DOWNLOAD ============
  const fileName = `comprobante-${data.clientName.replace(/\s+/g, '-')}-${receiptNumber}.pdf`
  doc.save(fileName)
}

export default generatePaymentPDF
