import { Document, Page, Text, View, Image, StyleSheet, Font, pdf } from '@react-pdf/renderer';
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
  async generateLoanPDF(loanData: ExportLoanData, opts: { reduced?: boolean } = {}): Promise<Blob> {
    const pdfData = this.transformLoanToPDFData(loanData, opts.reduced);

    // Create PDF Document component
    const LoanPDFDocument = this.createLoanPDFDocument(pdfData, opts.reduced);

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
  private transformLoanToPDFData(loanData: ExportLoanData, reduced = false): LoanPDFData {
    const { loan, client, subLoans } = loanData;

    // Check if this is a simulation (presupuesto)
    const isSimulation = loan.loanTrack === 'PRESUPUESTO' || loan.id === 'simulation';

    // Calculate totals — Number() guards against string values from JSON, Math.round avoids float noise
    const totalAmount = Math.round(subLoans.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0)) || loan.amount;
    const totalPrincipal = Math.round(subLoans.reduce((sum, s) => sum + Number(s.amount || 0), 0)) || (loan.originalAmount ?? loan.amount);
    const totalInterest = totalAmount - totalPrincipal;

    // Calculate remaining balance and paid count
    const totalPaid = Math.round(subLoans.reduce((sum, s) => {
      if (s.status === 'PAID') return sum + Number(s.totalAmount || 0)
      if (s.status === 'PARTIAL') return sum + Number(s.paidAmount || 0)
      return sum
    }, 0))
    const remainingBalance = Math.max(0, totalAmount - totalPaid)
    const paidCount = subLoans.filter(s => s.status === 'PAID').length

    // Capital original prestado (sin interés)
    const originalAmount = loan.originalAmount ?? loan.amount;

    return {
      // Loan Information
      loanId: loan.id,
      loanTrack: loan.loanTrack,
      amount: originalAmount,
      // reduced = vista pública: nunca mostrar tasa de interés
      baseInterestRate: reduced ? 0 : (loan.baseInterestRate || 0),
      totalAmount: isSimulation ? totalAmount : loan.amount,
      paymentFrequency: loan.paymentFrequency,
      numberOfInstallments: loan.totalPayments || subLoans.length,
      startDate: new Date(loan.firstDueDate || loan.createdAt).toLocaleDateString('es-AR'),
      description: loan.description,

      // Client Information
      clientName: client.fullName,
      clientPhone: client.phone,
      clientEmail: client.email,
      clientDNI: client.dni,
      clientCUIT: client.cuit,
      clientAddress: client.address,

      // Payment Schedule - Use actual subloan data
      paymentSchedule: subLoans
        .slice()
        .sort((a, b) => (a.paymentNumber ?? 0) - (b.paymentNumber ?? 0))
        .map((subLoan, idx) => ({
          paymentNumber: subLoan.paymentNumber ?? (idx + 1),
          dueDate: new Date(subLoan.dueDate).toLocaleDateString('es-AR'),
          principalAmount: subLoan.amount,
          totalAmount: subLoan.totalAmount || subLoan.amount,
          status: subLoan.status
        })),

      // Summary - Use calculated totals
      summary: {
        totalPrincipal: totalPrincipal,
        totalInterest: isSimulation ? totalInterest : 0,
        totalAmount: isSimulation ? totalAmount : loan.amount,
        numberOfPayments: loan.totalPayments || subLoans.length,
        paidCount,
        frequency: getFrequencyLabel(loan.paymentFrequency),
        remainingBalance
      },

      // Metadata
      loanStatus: loan.status,
      generatedAt: new Date().toLocaleString('es-AR'),
      generatedBy: 'Crediasociados - Sistema de Gestión de Préstamos'
    };
  }
  
  /**
   * Transform loan data to Excel row structure
   */
  private transformLoanToExcelData = (loanData: ExportLoanData): ExcelLoanData => {
    const { loan, client, subLoans } = loanData;

    // Calculate remaining balance
    const totalPaid = subLoans.reduce((sum, s) => {
      if (s.status === 'PAID') return sum + (s.totalAmount || 0)
      if (s.status === 'PARTIAL') return sum + (s.paidAmount || 0)
      return sum
    }, 0)
    const remainingBalance = loan.amount - totalPaid

    return {
      'ID Préstamo': loan.id,
      'Código Seguimiento': loan.loanTrack || '',
      'Cliente': client.fullName,
      'DNI/CUIT': client.dni || client.cuit || '',
      'Monto Prestado': loan.amount,
      // NOTE: Interest rate removed per client request (feedback.md)
      // 'Tasa Interés (%)': formatInterestRate(loan.baseInterestRate),
      'Monto Total': loan.amount, // Changed: Show only capital, no interest
      'Resta Abonar': remainingBalance,
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
  private createLoanPDFDocument(data: LoanPDFData, reduced = false) {
    const isSimulation = data.loanTrack === 'PRESUPUESTO' || data.loanId === 'simulation';

    const getStatusText = (status: string) => {
      switch (status) {
        case 'PAID': return 'Pagada';
        case 'OVERDUE': return 'Vencida';
        case 'PARTIAL': return 'Parcial';
        default: return 'Pendiente';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'PAID': return '#4caf50';
        case 'OVERDUE': return '#f44336';
        case 'PARTIAL': return '#ff9800';
        default: return '#9e9e9e';
      }
    };

    const getLoanStatusText = (status?: string) => {
      switch (status) {
        case 'ACTIVE': return 'Activo';
        case 'COMPLETED': return 'Completado';
        case 'DEFAULTED': return 'En mora';
        case 'PENDING': return 'Pendiente';
        case 'APPROVED': return 'Aprobado';
        default: return status ?? '';
      }
    };

    const styles = StyleSheet.create({
      page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 30,
        paddingBottom: 50,
        fontFamily: 'Helvetica'
      },
      header: {
        marginBottom: 14,
        borderBottom: 2,
        borderBottomColor: '#4facfe',
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      },
      headerLogo: {
        width: 48,
        height: 48,
      },
      headerText: {
        flex: 1,
      },
      title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 3
      },
      subtitle: {
        fontSize: 10,
        color: '#666666'
      },
      // Two-column layout for client info + loan details
      twoColContainer: {
        flexDirection: 'row',
        marginVertical: 8,
        gap: 14,
      },
      col: {
        flex: 1,
      },
      colSectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#4facfe',
        borderBottom: 1,
        borderBottomColor: '#e0e0e0',
        paddingBottom: 3,
      },
      colRow: {
        marginBottom: 4,
      },
      colLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#777777',
      },
      colValue: {
        fontSize: 9,
        color: '#333333',
      },
      summaryBox: {
        backgroundColor: '#f0f4ff',
        borderRadius: 4,
        padding: 10,
        marginVertical: 8,
        flexDirection: 'row',
      },
      summaryItem: {
        flex: 1,
      },
      summaryLabel: {
        fontSize: 8,
        color: '#6688aa',
        marginBottom: 2,
      },
      summaryValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333333'
      },
      summaryValueHighlight: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#4facfe'
      },
      table: {
        marginTop: 6
      },
      tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#4facfe',
        paddingVertical: 5,
        paddingHorizontal: 4,
        marginBottom: 0,
      },
      tableRow: {
        flexDirection: 'row',
        paddingVertical: 4,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee'
      },
      tableRowAlt: {
        flexDirection: 'row',
        paddingVertical: 4,
        paddingHorizontal: 4,
        backgroundColor: '#f7f9ff',
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee'
      },
      colNum: { width: 36, fontSize: 9, color: '#555' },
      colDate: { flex: 2, fontSize: 9, color: '#555' },
      colAmount: { flex: 2, fontSize: 9, color: '#555', textAlign: 'right' },
      colStatus: { flex: 2, fontSize: 9, textAlign: 'center' },
      colNumHeader: { width: 36, fontSize: 9, fontWeight: 'bold', color: '#ffffff' },
      colDateHeader: { flex: 2, fontSize: 9, fontWeight: 'bold', color: '#ffffff' },
      colAmountHeader: { flex: 2, fontSize: 9, fontWeight: 'bold', color: '#ffffff', textAlign: 'right' },
      colStatusHeader: { flex: 2, fontSize: 9, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 6,
        marginTop: 8,
        color: '#4facfe',
      },
      footer: {
        position: 'absolute',
        bottom: 16,
        left: 30,
        right: 30,
        borderTop: 1,
        borderTopColor: '#dddddd',
        paddingTop: 6,
        fontSize: 8,
        color: '#aaaaaa',
        textAlign: 'center'
      }
    });

    const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.headerLogo} src="/crediasociados-logo.png" />
            <View style={styles.headerText}>
              <Text style={styles.title}>
                {isSimulation ? 'Presupuesto de Préstamo' : reduced ? 'Situación Actual del Préstamo' : 'Reporte de Préstamo'}
              </Text>
              <Text style={styles.subtitle}>
                Generado el {data.generatedAt}
                {!isSimulation && data.loanStatus ? `  ·  Estado: ${getLoanStatusText(data.loanStatus)}` : ''}
                {data.loanTrack && data.loanTrack !== 'PRESUPUESTO' ? `  ·  Código: ${data.loanTrack}` : ''}
              </Text>
            </View>
          </View>

          {/* Two-column: Client Info + Loan Details */}
          <View style={styles.twoColContainer}>
            {/* Column 1 — Cliente */}
            <View style={styles.col}>
              <Text style={styles.colSectionTitle}>Información del Cliente</Text>
              <View style={styles.colRow}>
                <Text style={styles.colLabel}>Nombre</Text>
                <Text style={styles.colValue}>{data.clientName}</Text>
              </View>
              {data.clientDNI && (
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>DNI</Text>
                  <Text style={styles.colValue}>{data.clientDNI}</Text>
                </View>
              )}
              {data.clientCUIT && (
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>CUIT</Text>
                  <Text style={styles.colValue}>{data.clientCUIT}</Text>
                </View>
              )}
              {!reduced && data.clientPhone && (
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>Teléfono</Text>
                  <Text style={styles.colValue}>{data.clientPhone}</Text>
                </View>
              )}
              {!reduced && data.clientEmail && (
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>Email</Text>
                  <Text style={styles.colValue}>{data.clientEmail}</Text>
                </View>
              )}
              {!reduced && data.clientAddress && (
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>Dirección</Text>
                  <Text style={styles.colValue}>{data.clientAddress}</Text>
                </View>
              )}
            </View>

            {/* Column 2 — Préstamo */}
            <View style={styles.col}>
              <Text style={styles.colSectionTitle}>Detalles del Préstamo</Text>
              <View style={styles.colRow}>
                <Text style={styles.colLabel}>Capital prestado</Text>
                <Text style={styles.colValue}>{fmt(data.amount)}</Text>
              </View>
              {data.baseInterestRate > 0 && (
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>Tasa de interés</Text>
                  <Text style={styles.colValue}>
                    {data.baseInterestRate > 1 ? data.baseInterestRate : Number((data.baseInterestRate * 100).toFixed(2))}%
                  </Text>
                </View>
              )}
              <View style={styles.colRow}>
                <Text style={styles.colLabel}>Frecuencia de pago</Text>
                <Text style={styles.colValue}>{data.summary.frequency}</Text>
              </View>
              <View style={styles.colRow}>
                <Text style={styles.colLabel}>Total de cuotas</Text>
                <Text style={styles.colValue}>{data.numberOfInstallments}</Text>
              </View>
              <View style={styles.colRow}>
                <Text style={styles.colLabel}>Fecha de inicio</Text>
                <Text style={styles.colValue}>{data.startDate}</Text>
              </View>
              {data.description && (
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>Descripción</Text>
                  <Text style={styles.colValue}>{data.description}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Summary Box */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Cuotas pagadas</Text>
              <Text style={styles.summaryValueHighlight}>
                {data.summary.paidCount} / {data.summary.numberOfPayments}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Saldo pendiente</Text>
              <Text style={styles.summaryValue}>{fmt(data.summary.remainingBalance)}</Text>
            </View>
          </View>

          {/* Payment Schedule */}
          <Text style={styles.sectionTitle}>Cronograma de Pagos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colNumHeader}>#</Text>
              <Text style={styles.colDateHeader}>Vencimiento</Text>
              <Text style={styles.colAmountHeader}>Monto</Text>
              <Text style={styles.colStatusHeader}>Estado</Text>
            </View>
            {data.paymentSchedule.map((payment, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.colNum}>{payment.paymentNumber}</Text>
                <Text style={styles.colDate}>{payment.dueDate}</Text>
                <Text style={styles.colAmount}>{fmt(payment.totalAmount)}</Text>
                <Text style={{ ...styles.colStatus, color: getStatusColor(payment.status) }}>
                  {getStatusText(payment.status)}
                </Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <Text style={styles.footer} fixed>
            Crediasociados - Sistema de Gestión de Préstamos  |  Desarrollado por Pistech
          </Text>

          {/* Watermark — rendered last so it paints on top of content */}
          <View
            fixed
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 0.07,
            }}
          >
            <Text style={{ fontSize: 62, fontWeight: 'bold', color: '#1565c0', transform: 'rotate(-35deg)' }}>
              CREDIASOCIADOS
            </Text>
          </View>
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
      generatedBy: 'Crediasociados - Sistema de Gestión de Préstamos',

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
      generatedBy: 'Crediasociados - Sistema de Gestión de Préstamos',
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