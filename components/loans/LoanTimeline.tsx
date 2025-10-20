'use client'

import { Box, Typography, Chip, Tooltip, useTheme, useMediaQuery } from '@mui/material'
import { CheckCircle, RadioButtonUnchecked, Warning, Error } from '@mui/icons-material'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

interface LoanTimelineProps {
  clientName: string
  subLoans: SubLoanWithClientInfo[]
  compact?: boolean
  onPaymentClick?: (subloan: SubLoanWithClientInfo) => void
}

interface TimelineNodeProps {
  subloan: SubLoanWithClientInfo
  index: number
  isLast: boolean
  getUrgencyLevel: (dueDate: string) => 'overdue' | 'today' | 'soon' | 'future'
  compact?: boolean
  onPaymentClick?: (subloan: SubLoanWithClientInfo) => void
}

const TimelineNode: React.FC<TimelineNodeProps> = ({ 
  subloan, 
  index, 
  isLast, 
  getUrgencyLevel,
  compact = false,
  onPaymentClick
}) => {
  const urgency = getUrgencyLevel(subloan.dueDate)
  const isPaid = subloan.status === 'PAID'
  const isPartial = subloan.status === 'PARTIAL'

  // Get colors based on status
  const getNodeColors = () => {
    if (isPaid) {
      return {
        primary: '#4caf50',
        bg: '#e8f5e8',
        icon: CheckCircle,
        border: '#4caf50'
      }
    }

    if (isPartial) {
      return {
        primary: '#2196f3',
        bg: '#e3f2fd',
        icon: CheckCircle,
        border: '#2196f3'
      }
    }

    switch (urgency) {
      case 'overdue':
        return {
          primary: '#f44336',
          bg: '#ffebee',
          icon: Error,
          border: '#f44336'
        }
      case 'today':
        return {
          primary: '#ff9800',
          bg: '#fff3e0',
          icon: Warning,
          border: '#ff9800'
        }
      case 'soon':
        return {
          primary: '#ffc107',
          bg: '#fff8e1',
          icon: Warning,
          border: '#ffc107'
        }
      default:
        return {
          primary: '#9e9e9e',
          bg: '#f5f5f5',
          icon: RadioButtonUnchecked,
          border: '#e0e0e0'
        }
    }
  }

  const colors = getNodeColors()
  const IconComponent = colors.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysInfo = () => {
    if (isPaid) return 'Pagada'
    if (isPartial) {
      const paidAmount = subloan.paidAmount || 0
      const totalAmount = subloan.totalAmount
      const pending = totalAmount - paidAmount
      return `Pagado parcial: $${paidAmount.toLocaleString()} (Resta: $${pending.toLocaleString()})`
    }
    
    // Use only date part to avoid timezone issues
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dueDate = new Date(subloan.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    if (diffDays < 0) return `${Math.abs(Math.round(diffDays))} día${Math.abs(Math.round(diffDays)) === 1 ? '' : 's'} vencida`
    if (diffDays === 0) return 'Vence hoy'
    if (diffDays === 1) return 'Vence mañana'
    return `En ${Math.round(diffDays)} día${Math.round(diffDays) === 1 ? '' : 's'}`
  }

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="body2" fontWeight="bold">
            Cuota #{subloan.paymentNumber}
          </Typography>
          <Typography variant="caption" display="block">
            Monto: ${subloan.totalAmount.toLocaleString()}
          </Typography>
          <Typography variant="caption" display="block">
            Vencimiento: {formatDate(subloan.dueDate)}
          </Typography>
          <Typography variant="caption" display="block" color={colors.primary}>
            {getDaysInfo()}
          </Typography>
          {subloan.paidAmount > 0 && (
            <Typography variant="caption" display="block" color="success.main">
              Pagado: ${subloan.paidAmount.toLocaleString()}
            </Typography>
          )}
        </Box>
      }
      arrow
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          minWidth: compact ? 60 : 80,
          cursor: !isPaid && onPaymentClick ? 'pointer' : 'default',
          '&:hover': {
            transform: !isPaid && onPaymentClick ? 'scale(1.05)' : 'none',
          },
          transition: 'transform 0.2s ease',
          ...((!isPaid && onPaymentClick) && {
            '&:hover': {
              transform: 'scale(1.05)',
              '& .payment-hint': {
                opacity: 1
              }
            },
          })
        }}
        onClick={() => {
          if (!isPaid && onPaymentClick) {
            onPaymentClick(subloan)
          }
        }}
      >
        {/* Connection Line */}
        {!isLast && (
          <Box
            sx={{
              position: 'absolute',
              top: compact ? 16 : 20,
              left: '50%',
              right: compact ? -30 : -40,
              height: 2,
              bgcolor: isPaid ? '#4caf50' : '#e0e0e0',
              zIndex: 0
            }}
          />
        )}

        {/* Node Icon */}
        <Box
          sx={{
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            borderRadius: '50%',
            bgcolor: colors.bg,
            border: `3px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            mb: 1,
            boxShadow: isPaid ? '0 2px 8px rgba(76, 175, 80, 0.3)' : undefined
          }}
        >
          <IconComponent 
            sx={{ 
              fontSize: compact ? 18 : 24, 
              color: colors.primary 
            }} 
          />
        </Box>

        {/* Cuota Number */}
        <Typography 
          variant={compact ? 'caption' : 'body2'} 
          fontWeight="bold" 
          color={colors.primary}
          sx={{ mb: 0.5 }}
        >
          #{subloan.paymentNumber}
        </Typography>

        {/* Date and Amount */}
        {!compact && (
          <>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              {formatDate(subloan.dueDate)}
            </Typography>
            <Typography 
              variant="caption" 
              fontWeight="bold"
              color={colors.primary}
            >
              ${subloan.totalAmount.toLocaleString()}
            </Typography>
          </>
        )}

        {/* Status Indicator */}
        <Chip
          label={getDaysInfo()}
          size="small"
          sx={{
            bgcolor: colors.primary,
            color: 'white',
            fontSize: '10px',
            height: 16,
            mt: 0.5,
            '& .MuiChip-label': {
              px: 1
            }
          }}
        />
        
        {/* Payment Clickable Hint */}
        {!isPaid && onPaymentClick && (
          <Typography
            className="payment-hint"
            variant="caption"
            sx={{
              fontSize: '9px',
              color: colors.primary,
              opacity: 0,
              transition: 'opacity 0.2s ease',
              mt: 0.5,
              fontWeight: 'bold'
            }}
          >
            Click para pagar
          </Typography>
        )}
      </Box>
    </Tooltip>
  )
}

export const LoanTimeline: React.FC<LoanTimelineProps> = ({ 
  clientName, 
  subLoans, 
  compact = false,
  onPaymentClick
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Helper function to determine urgency based on due date
  const getUrgencyLevel = (dueDate: string): 'overdue' | 'today' | 'soon' | 'future' => {
    // Use only date part to avoid timezone issues
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    
    const diffTime = due.getTime() - today.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    
    if (diffDays < 0) return 'overdue'
    if (diffDays === 0) return 'today'
    if (diffDays <= 2) return 'soon'
    return 'future'
  }

  // Calculate progress stats
  const totalCuotas = subLoans.length
  const paidCuotas = subLoans.filter(s => s.status === 'PAID').length
  const pendingCuotas = totalCuotas - paidCuotas
  const progressPercentage = totalCuotas > 0 ? (paidCuotas / totalCuotas) * 100 : 0

  // Calculate financial summary
  const totalAmount = subLoans.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
  const paidAmount = subLoans.reduce((sum, s) => {
    if (s.status === 'PAID') {
      return sum + (s.totalAmount || 0)
    }
    if (s.status === 'PARTIAL') {
      return sum + (s.paidAmount || 0)
    }
    return sum
  }, 0)
  const remainingAmount = totalAmount - paidAmount

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Determine remaining amount color
  const getRemainingAmountColor = () => {
    const percentageRemaining = (remainingAmount / totalAmount) * 100
    if (percentageRemaining < 25) return 'success.main'
    if (percentageRemaining < 50) return 'warning.main'
    return 'error.main'
  }

  // Sort subloans by payment number
  const sortedSubLoans = [...subLoans].sort((a, b) => a.paymentNumber - b.paymentNumber)

  const isCompactMode = compact || isMobile

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {clientName} - Timeline de Cuotas
        </Typography>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 2
        }}>
          <Chip
            label={`Progreso: ${paidCuotas}/${totalCuotas} cuotas (${Math.round(progressPercentage)}%)`}
            size="small"
            variant="outlined"
            color="primary"
          />
          <Chip
            label={`Resta pagar: ${formatCurrency(remainingAmount)} en ${pendingCuotas} cuota${pendingCuotas !== 1 ? 's' : ''}`}
            size="small"
            variant="filled"
            color={remainingAmount <= 0 ? 'success' : undefined}
            sx={{
              backgroundColor: remainingAmount <= 0 ? undefined : getRemainingAmountColor(),
              color: 'white'
            }}
          />
        </Box>

        {/* Progress Bar */}
        <Box sx={{ 
          width: '100%',
          height: 8,
          bgcolor: '#e0e0e0',
          borderRadius: 4,
          overflow: 'hidden',
          mb: 2
        }}>
          <Box sx={{
            width: `${progressPercentage}%`,
            height: '100%',
            bgcolor: '#4caf50',
            transition: 'width 0.5s ease'
          }} />
        </Box>
      </Box>

      {/* Timeline */}
      <Box
        sx={{
          display: 'flex',
          overflowX: 'auto',
          pb: 2,
          '&::-webkit-scrollbar': {
            height: 6
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: '#f1f1f1',
            borderRadius: 3
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#c1c1c1',
            borderRadius: 3,
            '&:hover': {
              bgcolor: '#a8a8a8'
            }
          }
        }}
      >
        {sortedSubLoans.map((subloan, index) => (
          <TimelineNode
            key={subloan.id}
            subloan={subloan}
            index={index}
            isLast={index === sortedSubLoans.length - 1}
            getUrgencyLevel={getUrgencyLevel}
            compact={isCompactMode}
            onPaymentClick={onPaymentClick}
          />
        ))}
      </Box>

      {/* Legend */}
      {!compact && (
        <Box sx={{ 
          mt: 3,
          p: 2,
          bgcolor: '#f9f9f9',
          borderRadius: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle sx={{ color: '#4caf50', fontSize: 16 }} />
            <Typography variant="caption">Pagada</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Error sx={{ color: '#f44336', fontSize: 16 }} />
            <Typography variant="caption">Vencida</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Warning sx={{ color: '#ff9800', fontSize: 16 }} />
            <Typography variant="caption">Vence hoy</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Warning sx={{ color: '#ffc107', fontSize: 16 }} />
            <Typography variant="caption">Vence pronto</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <RadioButtonUnchecked sx={{ color: '#9e9e9e', fontSize: 16 }} />
            <Typography variant="caption">Pendiente</Typography>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default LoanTimeline