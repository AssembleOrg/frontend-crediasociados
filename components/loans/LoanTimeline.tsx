'use client'

import { Box, Typography, Chip, Tooltip, useTheme, useMediaQuery, IconButton, CircularProgress, Button } from '@mui/material'
import { CheckCircle, RadioButtonUnchecked, Warning, Error, Refresh } from '@mui/icons-material'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'
import { DateTime } from 'luxon'

interface LoanTimelineProps {
  clientName: string
  subLoans: SubLoanWithClientInfo[]
  compact?: boolean
  onPaymentClick?: (subloan: SubLoanWithClientInfo) => void
  onResetClick?: (subloan: SubLoanWithClientInfo) => void
  resettingSubloanId?: string | null
}

interface TimelineNodeProps {
  subloan: SubLoanWithClientInfo
  index: number
  isLast: boolean
  getUrgencyLevel: (subloan: SubLoanWithClientInfo) => 'overdue' | 'today' | 'soon' | 'future'
  compact?: boolean
  onPaymentClick?: (subloan: SubLoanWithClientInfo) => void
  onResetClick?: (subloan: SubLoanWithClientInfo) => void
  resettingSubloanId?: string | null
}

const TimelineNode: React.FC<TimelineNodeProps> = ({
  subloan,
  isLast,
  getUrgencyLevel,
  compact = false,
  onPaymentClick,
  onResetClick,
  resettingSubloanId
}) => {
  const urgency = getUrgencyLevel(subloan)
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-AR', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysInfo = () => {
    if (isPaid) return 'Pagada'
    if (isPartial) {
      const paidAmount = subloan.paidAmount || 0
      const totalAmount = subloan.totalAmount ?? 0
      const pending = totalAmount - paidAmount
      return `Pagado parcial: $${paidAmount.toLocaleString()} (Resta: $${pending.toLocaleString()})`
    }

    // Use dueDate
    const dateToCheck = subloan.dueDate
    if (!dateToCheck) return 'Sin fecha vencimiento'

    // Use Luxon for date calculations
    const today = DateTime.now().setZone('America/Argentina/Buenos_Aires').startOf('day')
    const targetDate = DateTime.fromISO(dateToCheck).setZone('America/Argentina/Buenos_Aires').startOf('day')
    const diffDays = Math.round(targetDate.diff(today, 'days').days)

    if (diffDays < 0) return `${Math.abs(diffDays)} día${Math.abs(diffDays) === 1 ? '' : 's'} vencida`
    if (diffDays === 0) return 'Vence hoy'
    if (diffDays === 1) return 'Vence mañana'
    return `En ${diffDays} día${diffDays === 1 ? '' : 's'}`
  }

  // Get payment descriptions for PAID or PARTIAL subloans
  const getPaymentDescriptions = () => {
    if ((isPaid || isPartial) && subloan.payments && Array.isArray(subloan.payments) && subloan.payments.length > 0) {
      const descriptions = subloan.payments
        .filter((p: any) => p && p.description && typeof p.description === 'string' && p.description.trim())
        .map((p: any) => p.description.trim())
      
      return descriptions.length > 0 ? descriptions.join(', ') : null
    }
    return null
  }

  const paymentDescriptions = getPaymentDescriptions()

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="body2" fontWeight="bold">
            Cuota #{subloan.paymentNumber}
          </Typography>
          <Typography variant="caption" display="block">
            Monto: ${(subloan.totalAmount ?? 0).toLocaleString()}
          </Typography>
          <Typography variant="caption" display="block">
            Vencimiento: {subloan.dueDate ? formatDate(subloan.dueDate) : 'N/A'}
          </Typography>
          <Typography variant="caption" display="block" color={colors.primary}>
            {getDaysInfo()}
          </Typography>
          {(subloan.paidAmount ?? 0) > 0 && (
            <Typography variant="caption" display="block" color="success.main">
              Pagado: ${(subloan.paidAmount ?? 0).toLocaleString()}
            </Typography>
          )}
          {paymentDescriptions && (
            <Box
              sx={{
                mt: 1,
                pt: 1,
                borderTop: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  fontWeight: 600,
                  color: 'white',
                  maxWidth: 200,
                  wordBreak: 'break-word',
                  fontSize: '1rem'
                }}
              >
                {paymentDescriptions}
              </Typography>
            </Box>
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
          minWidth: compact ? 70 : 100,
          flex: compact ? '0 0 70px' : '0 0 100px',
          cursor: !isPaid && onPaymentClick ? 'pointer' : 'default',
          '&:hover': {
            transform: !isPaid && onPaymentClick ? 'scale(1.05)' : 'none',
          },
          transition: 'transform 0.2s ease',
          ...(!isPaid && onPaymentClick && {
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
              right: compact ? -35 : -50,
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
              ${(subloan.totalAmount ?? 0).toLocaleString()}
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
            Clic para pagar
          </Typography>
        )}

        {/* Reset Button for Paid SubLoans */}
        {isPaid && onResetClick && (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={resettingSubloanId === subloan.id ? <CircularProgress size={14} /> : <Refresh sx={{ fontSize: 14 }} />}
            onClick={(e) => {
              e.stopPropagation()
              onResetClick(subloan)
            }}
            disabled={resettingSubloanId === subloan.id}
            sx={{
              mt: 1,
              minWidth: 'auto',
              px: 1,
              py: 0.5,
              fontSize: '10px',
              textTransform: 'none',
              borderWidth: 1.5,
              fontWeight: 600,
              '&:hover': {
                borderWidth: 1.5,
                bgcolor: 'warning.light',
                color: 'warning.dark'
              }
            }}
          >
            {resettingSubloanId === subloan.id ? 'Reseteando...' : 'Resetear'}
          </Button>
        )}
      </Box>
    </Tooltip>
  )
}

export const LoanTimeline: React.FC<LoanTimelineProps> = ({ 
  clientName, 
  subLoans, 
  compact = false,
  onPaymentClick,
  onResetClick,
  resettingSubloanId
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Helper function to determine urgency based on due date using Luxon
  const getUrgencyLevel = (subloan: SubLoanWithClientInfo): 'overdue' | 'today' | 'soon' | 'future' => {
    // Use dueDate
    const dateToCheck = subloan.dueDate
    if (!dateToCheck) return 'future'

    // Get today in Buenos Aires timezone using Luxon
    const today = DateTime.now().setZone('America/Argentina/Buenos_Aires').startOf('day')
    
    // Parse the date to check using Luxon
    const targetDate = DateTime.fromISO(dateToCheck).setZone('America/Argentina/Buenos_Aires').startOf('day')

    // Calculate difference in days (only comparing the date part)
    const diffDays = targetDate.diff(today, 'days').days

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
    // Formato genérico sin especificar país o moneda
    return `$${new Intl.NumberFormat('es', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)}`
  }

  // Determine remaining amount color
  const getRemainingAmountColor = () => {
    const percentageRemaining = (remainingAmount / totalAmount) * 100
    if (percentageRemaining < 25) return 'success.main'
    if (percentageRemaining < 50) return 'warning.main'
    return 'error.main'
  }

  // Sort subloans by payment number
  const sortedSubLoans = [...subLoans].sort((a, b) => (a.paymentNumber ?? 0) - (b.paymentNumber ?? 0))

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
          gap: { xs: 1, sm: 2 },
          justifyContent: sortedSubLoans.length <= 10 ? 'space-evenly' : 'flex-start',
          '&::-webkit-scrollbar': {
            height: 8
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
            onResetClick={onResetClick}
            resettingSubloanId={resettingSubloanId}
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