import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Register fonts if needed (optional, for better typography)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf'
// })

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 28,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  logo: {
    width: 180,
    height: 60,
    objectFit: 'contain',
  },
  headerText: {
    flex: 1,
    marginLeft: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
  dateInfo: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'right',
  },
  managerInfo: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 5,
    marginBottom: 14,
  },
  managerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 3,
  },
  managerEmail: {
    fontSize: 11,
    color: '#666666',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 5,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1976d2',
    padding: 6,
    borderRadius: 3,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableCell: {
    fontSize: 9,
    color: '#333333',
  },
  tableCellClient: {
    flex: 2,
    fontWeight: 'bold',
  },
  tableCellAmount: {
    flex: 1,
    textAlign: 'right',
  },
  tableCellDate: {
    flex: 1,
    textAlign: 'center',
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    marginTop: 10,
    borderRadius: 3,
    fontWeight: 'bold',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1976d2',
    flex: 2,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'right',
    flex: 1,
  },
  warningText: {
    color: '#F57C00',
    fontWeight: 'bold',
  },
  successText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
})

interface ActiveLoansPDFProps {
  managerDetail: {
    manager: {
      id: string
      fullName: string
      email: string
    }
    dineroEnCalle: number
    totalLoans: number
    loans: Array<{
      id: string
      loanTrack: string
      amount: number
      originalAmount: number
      currency: string
      status: string
      createdAt: string
      client: {
        id: string
        fullName: string
        dni: string | null
        phone: string | null
      }
      stats: {
        totalPaid: number
        totalPending: number
      }
    }>
  }
  capitalEnCalle: number
  withDebt: number
  searchQuery?: string
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export const ActiveLoansPDF: React.FC<ActiveLoansPDFProps> = ({ managerDetail, capitalEnCalle, withDebt, searchQuery }) => {
  const currentDate = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const filteredLoans = searchQuery
    ? managerDetail.loans.filter((loan) => {
        const query = searchQuery.toLowerCase()
        return (
          loan.client.fullName?.toLowerCase().includes(query) ||
          loan.loanTrack?.toLowerCase().includes(query) ||
          loan.client.dni?.toLowerCase().includes(query) ||
          loan.client.phone?.toLowerCase().includes(query)
        )
      })
    : managerDetail.loans

  // Calculate totals
  const totalOriginal = filteredLoans.reduce((sum, loan) => sum + (loan.originalAmount || 0), 0)
  const totalIntereses = filteredLoans.reduce((sum, loan) => sum + (loan.amount - (loan.originalAmount || 0)), 0)
  const totalPagado = filteredLoans.reduce((sum, loan) => sum + loan.stats.totalPaid, 0)
  const totalFaltante = filteredLoans.reduce((sum, loan) => sum + loan.stats.totalPending, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Image
              src="/logo-prestamito.png"
              style={styles.logo}
            />
            <View style={styles.headerText}>
              <Text style={styles.title}>Clientes con Préstamos Activos</Text>
              <Text style={styles.subtitle}>Reporte Detallado de Préstamos</Text>
            </View>
          </View>
          <Text style={styles.dateInfo}>Generado el {currentDate}</Text>
        </View>

        {/* Manager Info */}
        <View style={styles.managerInfo}>
          <Text style={styles.managerName}>{managerDetail.manager.fullName}</Text>
          <Text style={styles.managerEmail}>{managerDetail.manager.email}</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Préstamos con Deuda</Text>
            <Text style={styles.summaryValue}>
              {searchQuery
                ? filteredLoans.filter((l) => l.stats.totalPending > 0).length
                : withDebt}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            {/* ponytail: capitalEnCalle es total del manager; con búsqueda activa no se recalcula por filtro (el prop no trae subLoans) */}
            <Text style={styles.summaryLabel}>Dinero en Calle</Text>
            <Text style={styles.summaryValue}>{formatCurrency(capitalEnCalle)}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Cliente</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>M.Ori.</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Int.</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Pagado</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Faltante</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Fecha Sol.</Text>
          </View>

          {filteredLoans.map((loan, index) => {
            const intereses = loan.amount - (loan.originalAmount || 0)
            const isEven = index % 2 === 0

            return (
              <View key={loan.id} style={isEven ? [styles.tableRow, styles.tableRowEven] : styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCellClient]}>
                  {loan.client.fullName}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellAmount]}>
                  {formatCurrency(loan.originalAmount || 0)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellAmount]}>
                  {formatCurrency(intereses)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellAmount, styles.successText]}>
                  {formatCurrency(loan.stats.totalPaid)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellAmount, styles.warningText]}>
                  {formatCurrency(loan.stats.totalPending)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellDate]}>
                  {formatDate(loan.createdAt)}
                </Text>
              </View>
            )
          })}

          {/* Total Row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTALES</Text>
            <Text style={[styles.totalValue]}>{formatCurrency(totalOriginal)}</Text>
            <Text style={[styles.totalValue]}>{formatCurrency(totalIntereses)}</Text>
            <Text style={[styles.totalValue, styles.successText]}>{formatCurrency(totalPagado)}</Text>
            <Text style={[styles.totalValue, styles.warningText]}>{formatCurrency(totalFaltante)}</Text>
            <Text style={[styles.totalValue, { flex: 1 }]}></Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Total clientes: {new Set(filteredLoans.map((l) => l.client.id)).size}
          </Text>
          <Text style={styles.footerText}>
            CrediAsociados - Sistema de Gestión de Préstamos
          </Text>
        </View>
      </Page>
    </Document>
  )
}

