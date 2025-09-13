import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getFrequencyLabel, getStatusLabel, formatInterestRate } from '@/lib/formatters';
import type { 
  ExportLoanData, 
  LoanPDFData, 
  ExcelLoanData, 
  ExportFormat 
} from '@/types/export';

/**
 * Export Service - Pure transformation and file generation
 * Following ARCHITECTURE_PATTERNS.md - Services layer
 * 
 * Responsibilities:
 * - PDF generation using @react-pdf/renderer
 * - Excel generation using xlsx
 * - File download handling
 * - Data transformation for export formats
 */
class ExportService {
  
  /**
   * Generate PDF document for loan presupuesto
   */
  async generateLoanPDF(loanData: ExportLoanData): Promise<Blob> {
    const pdfData = this.transformLoanToPDFData(loanData);
    
    // Create PDF Document component
    const LoanPDFDocument = this.createLoanPDFDocument(pdfData);
    
    // Generate PDF blob
    const blob = await pdf(LoanPDFDocument).toBlob();
    return blob;
  }
  
  /**
   * Generate Excel file for loans data
   */
  async generateLoansExcel(loansData: ExportLoanData[]): Promise<Blob> {
    const excelData = loansData.map(this.transformLoanToExcelData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    ws['!cols'] = [
      { width: 15 }, // ID Préstamo
      { width: 20 }, // Código Seguimiento
      { width: 25 }, // Cliente
      { width: 15 }, // DNI/CUIT
      { width: 15 }, // Monto Prestado
      { width: 12 }, // Tasa Interés
      { width: 15 }, // Monto Total
      { width: 12 }, // Frecuencia
      { width: 12 }, // Cantidad Cuotas
      { width: 12 }, // Fecha Inicio
      { width: 10 }, // Estado
      { width: 30 }, // Descripción
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Préstamos');
    
    // Generate blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/octet-stream' });
  }
  
  /**
   * Download file with proper filename
   */
  downloadFile(blob: Blob, filename: string, format: ExportFormat): void {
    const extension = format === 'pdf' ? '.pdf' : '.xlsx';
    const fullFilename = filename.endsWith(extension) ? filename : `${filename}${extension}`;
    
    saveAs(blob, fullFilename);
  }
  
  /**
   * Transform loan data to PDF structure
   */
  private transformLoanToPDFData(loanData: ExportLoanData): LoanPDFData {
    const { loan, client, subLoans } = loanData;
    
    return {
      // Loan Information
      loanId: loan.id,
      loanTrack: loan.loanTrack,
      amount: loan.amount,
      baseInterestRate: loan.baseInterestRate,
      totalAmount: loanData.totalAmount,
      paymentFrequency: loan.paymentFrequency,
      numberOfInstallments: loan.totalPayments,
      startDate: new Date(loan.firstDueDate || loan.createdAt).toLocaleDateString('es-AR'),
      description: loan.description,
      
      // Client Information
      clientName: client.fullName,
      clientPhone: client.phone,
      clientEmail: client.email,
      clientDNI: client.dni,
      clientCUIT: client.cuit,
      clientAddress: client.address,
      
      // Payment Schedule
      paymentSchedule: subLoans.map(subLoan => ({
        paymentNumber: subLoan.paymentNumber,
        dueDate: new Date(subLoan.dueDate).toLocaleDateString('es-AR'),
        principalAmount: subLoan.amount,
        totalAmount: subLoan.totalAmount,
        status: subLoan.status
      })),
      
      // Summary
      summary: {
        totalPrincipal: loan.amount,
        totalInterest: loanData.totalInterest,
        totalAmount: loanData.totalAmount,
        numberOfPayments: loan.totalPayments,
        frequency: getFrequencyLabel(loan.paymentFrequency)
      },
      
      // Metadata
      generatedAt: new Date().toLocaleString('es-AR'),
      generatedBy: 'Prestamito - Sistema de Gestión de Préstamos'
    };
  }
  
  /**
   * Transform loan data to Excel row structure
   */
  private transformLoanToExcelData = (loanData: ExportLoanData): ExcelLoanData => {
    const { loan, client } = loanData;
    
    return {
      'ID Préstamo': loan.id,
      'Código Seguimiento': loan.loanTrack || '',
      'Cliente': client.fullName,
      'DNI/CUIT': client.dni || client.cuit || '',
      'Monto Prestado': loan.amount,
      'Tasa Interés (%)': formatInterestRate(loan.baseInterestRate),
      'Monto Total': loanData.totalAmount,
      'Frecuencia': getFrequencyLabel(loan.paymentFrequency),
      'Cantidad Cuotas': loan.totalPayments,
      'Fecha Inicio': new Date(loan.firstDueDate || loan.createdAt).toLocaleDateString('es-AR'),
      'Estado': getStatusLabel(loan.status),
      'Descripción': loan.description || ''
    };
  };
  
  /**
   * Create PDF Document React component
   */
  private createLoanPDFDocument(data: LoanPDFData) {
    const styles = StyleSheet.create({
      page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 30,
        fontFamily: 'Helvetica'
      },
      header: {
        marginBottom: 20,
        borderBottom: 2,
        borderBottomColor: '#4facfe',
        paddingBottom: 10
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 5
      },
      subtitle: {
        fontSize: 12,
        color: '#666666'
      },
      section: {
        marginVertical: 10,
        paddingVertical: 10
      },
      sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#4facfe'
      },
      row: {
        flexDirection: 'row',
        marginBottom: 5
      },
      label: {
        width: 150,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333333'
      },
      value: {
        flex: 1,
        fontSize: 10,
        color: '#555555'
      },
      table: {
        marginTop: 10
      },
      tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#cccccc',
        paddingBottom: 5,
        marginBottom: 5
      },
      tableRow: {
        flexDirection: 'row',
        marginBottom: 3
      },
      tableCell: {
        flex: 1,
        fontSize: 9,
        paddingHorizontal: 5
      },
      tableCellHeader: {
        flex: 1,
        fontSize: 9,
        fontWeight: 'bold',
        paddingHorizontal: 5,
        color: '#333333'
      },
      footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        borderTop: 1,
        borderTopColor: '#cccccc',
        paddingTop: 10,
        fontSize: 8,
        color: '#666666',
        textAlign: 'center'
      }
    });
    
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Presupuesto de Préstamo</Text>
            <Text style={styles.subtitle}>
              Generado el {data.generatedAt}
            </Text>
          </View>
          
          {/* Client Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Cliente</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nombre Completo:</Text>
              <Text style={styles.value}>{data.clientName}</Text>
            </View>
            {data.clientDNI && (
              <View style={styles.row}>
                <Text style={styles.label}>DNI:</Text>
                <Text style={styles.value}>{data.clientDNI}</Text>
              </View>
            )}
            {data.clientCUIT && (
              <View style={styles.row}>
                <Text style={styles.label}>CUIT:</Text>
                <Text style={styles.value}>{data.clientCUIT}</Text>
              </View>
            )}
            {data.clientPhone && (
              <View style={styles.row}>
                <Text style={styles.label}>Teléfono:</Text>
                <Text style={styles.value}>{data.clientPhone}</Text>
              </View>
            )}
            {data.clientEmail && (
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{data.clientEmail}</Text>
              </View>
            )}
          </View>
          
          {/* Loan Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles del Préstamo</Text>
            <View style={styles.row}>
              <Text style={styles.label}>ID Préstamo:</Text>
              <Text style={styles.value}>{data.loanId}</Text>
            </View>
            {data.loanTrack && (
              <View style={styles.row}>
                <Text style={styles.label}>Código de Seguimiento:</Text>
                <Text style={styles.value}>{data.loanTrack}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Monto Solicitado:</Text>
              <Text style={styles.value}>${data.amount.toLocaleString('es-AR')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tasa de Interés:</Text>
              <Text style={styles.value}>{formatInterestRate(data.baseInterestRate).toFixed(1)}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Monto Total a Devolver:</Text>
              <Text style={styles.value}>${data.totalAmount.toLocaleString('es-AR')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Frecuencia de Pago:</Text>
              <Text style={styles.value}>{data.summary.frequency}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Número de Cuotas:</Text>
              <Text style={styles.value}>{data.numberOfInstallments}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Fecha de Inicio:</Text>
              <Text style={styles.value}>{data.startDate}</Text>
            </View>
          </View>
          
          {/* Payment Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cronograma de Pagos</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellHeader}>Cuota</Text>
                <Text style={styles.tableCellHeader}>Fecha Venc.</Text>
                <Text style={styles.tableCellHeader}>Capital</Text>
                <Text style={styles.tableCellHeader}>Total</Text>
              </View>
              {data.paymentSchedule.map((payment, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>#{payment.paymentNumber}</Text>
                  <Text style={styles.tableCell}>{payment.dueDate}</Text>
                  <Text style={styles.tableCell}>${payment.principalAmount.toLocaleString('es-AR')}</Text>
                  <Text style={styles.tableCell}>${payment.totalAmount.toLocaleString('es-AR')}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Footer */}
          <Text style={styles.footer}>
            {data.generatedBy} | Este documento es un presupuesto informativo
          </Text>
        </Page>
      </Document>
    );
  }
  
}

export const exportService = new ExportService();