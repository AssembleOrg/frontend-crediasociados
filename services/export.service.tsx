import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getFrequencyLabel, getStatusLabel, formatInterestRate } from '@/lib/formatters';
import type {
  ExportLoanData,
  LoanPDFData,
  ExcelLoanData,
  ExportFormat,
  AdminReportsData,
  AdminReportsPDFData,
  SubadminReportsData,
  SubadminReportsPDFData
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
   * Generate PDF document for Admin reports
   */
  async generateAdminReportsPDF(reportsData: AdminReportsData): Promise<Blob> {
    const pdfData = this.transformAdminReportsToPDFData(reportsData);

    // Create PDF Document component
    const AdminReportsPDFDocument = this.createAdminReportsPDFDocument(pdfData);

    // Generate PDF blob
    const blob = await pdf(AdminReportsPDFDocument).toBlob();
    return blob;
  }

  /**
   * Generate PDF document for Subadmin reports
   */
  async generateSubadminReportsPDF(reportsData: SubadminReportsData, subadminName: string): Promise<Blob> {
    const pdfData = this.transformSubadminReportsToPDFData(reportsData, subadminName);

    // Create PDF Document component
    const SubadminReportsPDFDocument = this.createSubadminReportsPDFDocument(pdfData);

    // Generate PDF blob
    const blob = await pdf(SubadminReportsPDFDocument).toBlob();
    return blob;
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
      baseInterestRate: 0, // NOTE: Interest rate removed per client request (feedback.md)
      totalAmount: loan.amount, // Changed: Show only capital, no interest
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
      
      // Payment Schedule - Without interest
      paymentSchedule: subLoans.map(subLoan => ({
        paymentNumber: subLoan.paymentNumber,
        dueDate: new Date(subLoan.dueDate).toLocaleDateString('es-AR'),
        principalAmount: subLoan.amount,
        totalAmount: subLoan.amount, // Changed: Show only principal, no interest
        status: subLoan.status
      })),
      
      // Summary - Without interest per client request
      summary: {
        totalPrincipal: loan.amount,
        totalInterest: 0, // NOTE: Interest removed per client request (feedback.md)
        totalAmount: loan.amount, // Changed: Show only capital, no interest
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
      // NOTE: Interest rate removed per client request (feedback.md)
      // 'Tasa Interés (%)': formatInterestRate(loan.baseInterestRate),
      'Monto Total': loan.amount, // Changed: Show only capital, no interest
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

  /**
   * Transform admin reports data to PDF structure
   */
  private transformAdminReportsToPDFData(reportsData: AdminReportsData): AdminReportsPDFData {
    return {
      // Report Information
      reportTitle: 'Reporte Administrativo',
      reportType: 'Resumen Ejecutivo de Subadministradores',
      generatedAt: new Date().toLocaleString('es-AR'),
      generatedBy: 'Prestamito - Sistema de Gestión de Préstamos',

      // Summary
      summary: {
        totalSubadmins: reportsData.totalUsers,
        totalManagers: reportsData.subadmins.reduce((sum, s) => sum + (s.totalClients > 0 ? 1 : 0), 0), // Estimación
        totalClients: reportsData.totalClients,
        totalLoans: reportsData.totalLoans,
        totalAmountLent: reportsData.totalAmountLent,
        averagePerSubadmin: reportsData.totalUsers > 0 ? Math.round(reportsData.totalAmountLent / reportsData.totalUsers) : 0,
      },

      // Subadmins data
      subadmins: reportsData.subadmins.map(subadmin => ({
        name: subadmin.userName,
        email: subadmin.userEmail,
        managersCount: subadmin.totalClients > 0 ? Math.ceil(subadmin.totalClients / 10) : 0, // Estimación
        clientsCount: subadmin.totalClients,
        loansCount: subadmin.totalLoans,
        totalAmount: subadmin.totalAmountLent,
        createdAt: new Date(subadmin.createdAt).toLocaleDateString('es-AR')
      }))
    };
  }

  /**
   * Transform subadmin reports data to PDF structure
   */
  private transformSubadminReportsToPDFData(reportsData: SubadminReportsData, subadminName: string): SubadminReportsPDFData {
    return {
      // Report Information
      reportTitle: 'Reporte de Sub-Administrador',
      reportType: `Resumen de Managers - ${subadminName}`,
      generatedAt: new Date().toLocaleString('es-AR'),
      generatedBy: 'Prestamito - Sistema de Gestión de Préstamos',
      subadminName,

      // Summary
      summary: {
        totalManagers: reportsData.totalManagers,
        totalClients: reportsData.totalClients,
        totalLoans: reportsData.totalLoans,
        totalAmountLent: reportsData.totalAmountLent,
        averagePerManager: reportsData.totalManagers > 0 ? Math.round(reportsData.totalAmountLent / reportsData.totalManagers) : 0,
      },

      // Managers data
      managers: reportsData.managers.map(manager => ({
        name: manager.name,
        email: manager.email,
        clientsCount: manager.totalClients,
        loansCount: manager.totalLoans,
        totalAmount: manager.totalAmountLent,
        createdAt: new Date(manager.createdAt).toLocaleDateString('es-AR')
      }))
    };
  }

  /**
   * Create Admin Reports PDF Document React component
   */
  private createAdminReportsPDFDocument(data: AdminReportsPDFData) {
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
        fontSize: 14,
        color: '#666666',
        marginBottom: 5
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
        marginBottom: 5,
        backgroundColor: '#f5f5f5'
      },
      tableRow: {
        flexDirection: 'row',
        marginBottom: 3,
        paddingVertical: 2
      },
      tableCell: {
        flex: 1,
        fontSize: 8,
        paddingHorizontal: 3
      },
      tableCellHeader: {
        flex: 1,
        fontSize: 9,
        fontWeight: 'bold',
        paddingHorizontal: 3,
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
            <Text style={styles.title}>{data.reportTitle}</Text>
            <Text style={styles.subtitle}>{data.reportType}</Text>
            <Text style={styles.subtitle}>
              Generado el {data.generatedAt}
            </Text>
          </View>

          {/* Executive Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Total Subadministradores:</Text>
              <Text style={styles.value}>{data.summary.totalSubadmins}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Managers:</Text>
              <Text style={styles.value}>{data.summary.totalManagers}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Clientes:</Text>
              <Text style={styles.value}>{data.summary.totalClients}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Prestamos:</Text>
              <Text style={styles.value}>{data.summary.totalLoans}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Monto Total Prestado:</Text>
              <Text style={styles.value}>${data.summary.totalAmountLent.toLocaleString('es-AR')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Promedio por Subadmin:</Text>
              <Text style={styles.value}>${data.summary.averagePerSubadmin.toLocaleString('es-AR')}</Text>
            </View>
          </View>

          {/* Subadmins Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalle de Subadministradores</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellHeader}>Nombre</Text>
                <Text style={styles.tableCellHeader}>Email</Text>
                <Text style={styles.tableCellHeader}>Clientes</Text>
                <Text style={styles.tableCellHeader}>Prestamos</Text>
                <Text style={styles.tableCellHeader}>Monto Total</Text>
              </View>
              {data.subadmins.map((subadmin, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{subadmin.name}</Text>
                  <Text style={styles.tableCell}>{subadmin.email}</Text>
                  <Text style={styles.tableCell}>{subadmin.clientsCount}</Text>
                  <Text style={styles.tableCell}>{subadmin.loansCount}</Text>
                  <Text style={styles.tableCell}>${subadmin.totalAmount.toLocaleString('es-AR')}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            {data.generatedBy} | Reporte confidencial - Solo para uso interno
          </Text>
        </Page>
      </Document>
    );
  }

  /**
   * Create Subadmin Reports PDF Document React component
   */
  private createSubadminReportsPDFDocument(data: SubadminReportsPDFData) {
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
        fontSize: 14,
        color: '#666666',
        marginBottom: 5
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
        marginBottom: 5,
        backgroundColor: '#f5f5f5'
      },
      tableRow: {
        flexDirection: 'row',
        marginBottom: 3,
        paddingVertical: 2
      },
      tableCell: {
        flex: 1,
        fontSize: 9,
        paddingHorizontal: 3
      },
      tableCellHeader: {
        flex: 1,
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 3,
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
            <Text style={styles.title}>{data.reportTitle}</Text>
            <Text style={styles.subtitle}>{data.reportType}</Text>
            <Text style={styles.subtitle}>
              Generado el {data.generatedAt}
            </Text>
          </View>

          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Total Managers:</Text>
              <Text style={styles.value}>{data.summary.totalManagers}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Clientes:</Text>
              <Text style={styles.value}>{data.summary.totalClients}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Prestamos:</Text>
              <Text style={styles.value}>{data.summary.totalLoans}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Monto Total Prestado:</Text>
              <Text style={styles.value}>${data.summary.totalAmountLent.toLocaleString('es-AR')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Promedio por Manager:</Text>
              <Text style={styles.value}>${data.summary.averagePerManager.toLocaleString('es-AR')}</Text>
            </View>
          </View>

          {/* Managers Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalle de Managers</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellHeader}>Nombre</Text>
                <Text style={styles.tableCellHeader}>Email</Text>
                <Text style={styles.tableCellHeader}>Clientes</Text>
                <Text style={styles.tableCellHeader}>Prestamos</Text>
                <Text style={styles.tableCellHeader}>Monto Total</Text>
              </View>
              {data.managers.map((manager, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{manager.name}</Text>
                  <Text style={styles.tableCell}>{manager.email}</Text>
                  <Text style={styles.tableCell}>{manager.clientsCount}</Text>
                  <Text style={styles.tableCell}>{manager.loansCount}</Text>
                  <Text style={styles.tableCell}>${manager.totalAmount.toLocaleString('es-AR')}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            {data.generatedBy} | Reporte confidencial - Solo para uso interno
          </Text>
        </Page>
      </Document>
    );
  }

}

export const exportService = new ExportService();