'use client'

/**
 * PaymentForm — presentational component.
 * Contains all form logic, inputs, calculations, and previews.
 * Rendered by PaymentModal inside either Dialog (desktop) or SwipeableDrawer (mobile).
 */

import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Alert,
  Chip,
  CircularProgress,
  Button,
  Divider,
  Paper,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Payment,
  AttachMoney,
  PictureAsPdf,
  Info,
  TuneRounded,
  CalendarToday,
  Autorenew,
} from '@mui/icons-material'
import { DateTime } from 'luxon'
import { formatAmount, unformatAmount, formatCurrencyDisplay, numberToFormattedAmount } from '@/lib/formatters'
import { iosColors } from '@/lib/theme'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

// Days to add per payment frequency
const FREQUENCY_DAYS: Record<string, number> = {
  DAILY:     1,
  WEEKLY:    7,
  BIWEEKLY:  14,
  MONTHLY:   30,
}

/** Calculates next due date in UTC to avoid timezone day-shift. */
function calcNextDueDate(dueDate: string | undefined, frequency: string | undefined): string {
  const days = FREQUENCY_DAYS[frequency ?? ''] ?? 7
  const base = dueDate
    ? DateTime.fromISO(dueDate, { zone: 'utc' })
    : DateTime.utc()
  return base.plus({ days }).toISODate() ?? ''
}

export type RenewPaymentDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | ''
export type RenewFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'

export interface PaymentFormProps {
  // Data
  clientName: string
  mode: 'single' | 'selector'
  currentSubloan: SubLoanWithClientInfo | null | undefined
  pendingSubloans: SubLoanWithClientInfo[]
  selectedSubloanId: string
  paymentFrequency?: string          // e.g. 'WEEKLY'
  // Form state
  paymentAmount: string
  notes: string
  generatePDF: boolean
  adjustEnabled: boolean
  adjustedAmount: string
  effectiveTotalAmount: number
  paymentPreview: { remainingAfterPayment: number; status: 'PARTIAL' | 'PAID'; isPartial: boolean } | null
  isRegistering: boolean
  // Handlers
  onSubloanChange: (id: string) => void
  onAmountChange: (raw: string) => void
  onNotesChange: (notes: string) => void
  onGeneratePDFChange: (checked: boolean) => void
  onAdjustEnabledChange: (checked: boolean) => void
  onAdjustedAmountChange: (raw: string) => void
  onRegister: () => void
  onCancel: () => void
  onNextDueDateChange?: (date: string) => void
  // Renewal mode (optional — if omitted, renewal UI is hidden)
  renewMode?: boolean
  onRenewModeChange?: (v: boolean) => void
  loanLoading?: boolean
  renewAmount?: string
  renewInterestPct?: string
  renewPenaltyPct?: string
  renewFrequency?: RenewFrequency
  renewPaymentDay?: RenewPaymentDay
  renewTotalPayments?: string
  renewFirstDueDate?: string
  onRenewAmountChange?: (v: string) => void
  onRenewInterestPctChange?: (v: string) => void
  onRenewPenaltyPctChange?: (v: string) => void
  onRenewFrequencyChange?: (v: RenewFrequency) => void
  onRenewPaymentDayChange?: (v: RenewPaymentDay) => void
  onRenewTotalPaymentsChange?: (v: string) => void
  onRenewFirstDueDateChange?: (v: string) => void
  canRenew?: boolean
  renewLoading?: boolean
  onRenew?: () => void
}

const fmtDateShort = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('es-AR')
}

export function PaymentForm({
  clientName,
  mode,
  currentSubloan,
  pendingSubloans,
  selectedSubloanId,
  paymentFrequency,
  paymentAmount,
  notes,
  generatePDF,
  adjustEnabled,
  adjustedAmount,
  effectiveTotalAmount,
  paymentPreview,
  isRegistering,
  onSubloanChange,
  onAmountChange,
  onNotesChange,
  onGeneratePDFChange,
  onAdjustEnabledChange,
  onAdjustedAmountChange,
  onRegister,
  onCancel,
  onNextDueDateChange,
  renewMode = false,
  onRenewModeChange,
  loanLoading = false,
  renewAmount = '',
  renewInterestPct = '',
  renewPenaltyPct = '',
  renewFrequency = 'DAILY',
  renewPaymentDay = '',
  renewTotalPayments = '',
  renewFirstDueDate = '',
  onRenewAmountChange,
  onRenewInterestPctChange,
  onRenewPenaltyPctChange,
  onRenewFrequencyChange,
  onRenewPaymentDayChange,
  onRenewTotalPaymentsChange,
  onRenewFirstDueDateChange,
  canRenew = false,
  renewLoading = false,
  onRenew,
}: PaymentFormProps) {
  const theme = useTheme()
  const canRegister = currentSubloan && paymentAmount && parseFloat(paymentAmount) > 0
  const outstandingBalance = currentSubloan
    ? (currentSubloan.outstandingBalance ?? ((currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)))
    : 0
  const canShowRenewToggle = !!onRenewModeChange && outstandingBalance > 0

  // "Próximo pago" state — only relevant when paymentPreview.isPartial
  const suggestedNextDate = calcNextDueDate(currentSubloan?.dueDate, paymentFrequency)
  const [nextDueDate, setNextDueDate] = useState(suggestedNextDate)

  const isPartial = paymentPreview?.isPartial ?? false

  return (
    <>
      {/* ── Scrollable body ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 3 }, bgcolor: '#F2F2F7' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cliente: {clientName}
          </Typography>
        </Box>

        {/* Cuota Selector — only in selector mode */}
        {mode === 'selector' && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Seleccionar Cuota</InputLabel>
            <Select
              value={selectedSubloanId}
              onChange={(e) => onSubloanChange(e.target.value)}
              label="Seleccionar Cuota"
            >
              {pendingSubloans.map((s) => {
                const pending = (s.totalAmount ?? 0) - (s.paidAmount || 0)
                return (
                  <MenuItem key={s.id ?? ''} value={s.id ?? ''}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>Cuota #{s.paymentNumber ?? '?'} - Vence: {fmtDateShort(s.dueDate)}</Typography>
                      <Typography color="primary" fontWeight="bold">{formatCurrencyDisplay(pending)}</Typography>
                    </Box>
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
        )}

        {/* Cuota details */}
        {currentSubloan && (
          <>
            <Paper elevation={0} sx={{ bgcolor: '#FFFFFF', borderLeft: 4, borderLeftColor: 'primary.main', mb: 3, overflow: 'hidden' }}>
              <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Cuota #{currentSubloan.paymentNumber ?? '?'}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1 }}>
                  <StatBox label="Monto Total"     value={formatCurrencyDisplay(currentSubloan.totalAmount ?? 0)} theme={theme} />
                  <StatBox label="Monto Pagado"    value={formatCurrencyDisplay(currentSubloan.paidAmount || 0)} color="success.main" theme={theme} />
                  <StatBox label="Saldo Pendiente" value={formatCurrencyDisplay((currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0))} color="error.main" theme={theme} />
                  {currentSubloan.outstandingBalance !== undefined && (
                    <StatBox label="Saldo a finalizar" value={formatCurrencyDisplay(currentSubloan.outstandingBalance ?? 0)} color="warning.main" theme={theme} />
                  )}
                </Box>
              </Box>
            </Paper>

            {/* Renovar y terminar préstamo — checkbox */}
            {canShowRenewToggle && (
              <Box
                sx={{
                  mb: 2, p: 2,
                  border: '2px dashed',
                  borderColor: renewMode ? 'secondary.main' : 'divider',
                  borderRadius: 2,
                  bgcolor: renewMode ? 'rgba(156,39,176,0.06)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={renewMode}
                      onChange={(e) => onRenewModeChange?.(e.target.checked)}
                      color="secondary"
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Autorenew fontSize="small" color={renewMode ? 'secondary' : 'action'} />
                      <Typography variant="body2" fontWeight={renewMode ? 600 : 400}>
                        Renovar y terminar préstamo
                      </Typography>
                    </Box>
                  }
                />
                {renewMode && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 4, mt: 0.5 }}>
                    Se cancelará el saldo pendiente (ingresa a tu billetera) y se creará un préstamo nuevo con los datos que completes abajo.
                  </Typography>
                )}
              </Box>
            )}

            {!renewMode ? (
              <>
                {/* Adjust installment */}
                <Box
                  sx={{
                    mb: 2, p: 2,
                    border: '1px solid',
                    borderColor: adjustEnabled ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: adjustEnabled ? 'primary.lighter' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={adjustEnabled}
                        onChange={(e) => onAdjustEnabledChange(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TuneRounded fontSize="small" color={adjustEnabled ? 'primary' : 'action'} />
                        <Typography variant="body2" fontWeight={adjustEnabled ? 600 : 400}>
                          Ajustar monto de esta cuota
                        </Typography>
                      </Box>
                    }
                  />
                  {adjustEnabled && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Monto original: {formatCurrencyDisplay(currentSubloan.totalAmount ?? 0)}
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        label="Nuevo monto de la cuota"
                        type="text"
                        inputMode="numeric"
                        value={formatAmount(adjustedAmount)}
                        onChange={(e) => onAdjustedAmountChange(unformatAmount(e.target.value))}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        sx={{ mb: 1 }}
                      />
                      {effectiveTotalAmount !== (currentSubloan.totalAmount ?? 0) && effectiveTotalAmount > 0 && (
                        <Alert severity={effectiveTotalAmount < (currentSubloan.totalAmount ?? 0) ? 'success' : 'warning'} sx={{ py: 0.5 }}>
                          <Typography variant="caption">
                            {effectiveTotalAmount < (currentSubloan.totalAmount ?? 0)
                              ? `Cuota reducida a ${formatCurrencyDisplay(effectiveTotalAmount)} (descuento de ${formatCurrencyDisplay((currentSubloan.totalAmount ?? 0) - effectiveTotalAmount)})`
                              : `Cuota aumentada a ${formatCurrencyDisplay(effectiveTotalAmount)} (recargo de ${formatCurrencyDisplay(effectiveTotalAmount - (currentSubloan.totalAmount ?? 0))})`
                            }
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Payment amount */}
                <TextField
                  label="Monto a Registrar"
                  type="text"
                  value={formatAmount(paymentAmount)}
                  onChange={(e) => onAmountChange(unformatAmount(e.target.value))}
                  inputMode="numeric"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AttachMoney /></InputAdornment>,
                    sx: { borderRadius: 2 },
                  }}
                  helperText={`Pendiente: ${formatCurrencyDisplay(effectiveTotalAmount - (currentSubloan.paidAmount || 0))} — Puedes pagar parcialmente`}
                  fullWidth
                  sx={{ mb: 3 }}
                />

                {/* Payment preview */}
                {paymentPreview && (
                  <Alert icon={<Info />} severity={paymentPreview.isPartial ? 'warning' : 'success'} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 1, justifyContent: 'space-between' }}>
                      <Typography variant="body2">
                        {paymentPreview.isPartial ? 'Este será un pago PARCIAL' : 'Este completará el pago (PAGADO)'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={paymentPreview.status}
                          color={paymentPreview.status === 'PAID' ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                        {paymentPreview.remainingAfterPayment > 0 && (
                          <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600, alignSelf: 'center' }}>
                            Restará: {formatCurrencyDisplay(paymentPreview.remainingAfterPayment)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Alert>
                )}

                {/* ── Próximo pago (solo si es pago parcial) ── */}
                {isPartial && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${iosColors.orange}`,
                      bgcolor: 'rgba(255,149,0,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <CalendarToday sx={{ fontSize: 18, color: iosColors.orange, flexShrink: 0 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="warning.main">
                        Pago parcial — queda pendiente
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="warning.main">
                        {formatCurrencyDisplay(paymentPreview?.remainingAfterPayment ?? 0)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <TextField
                  label="Notas (opcional)"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  placeholder="Agregar observaciones sobre el pago..."
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={generatePDF}
                      onChange={(e) => onGeneratePDFChange(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PictureAsPdf fontSize="small" />
                      <Typography variant="body2">Generar comprobante de pago (recomendado)</Typography>
                    </Box>
                  }
                />
              </>
            ) : (
              <>
                {/* Renewal Form */}
                {loanLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Los valores vienen precargados del préstamo actual. Todos son editables.
                      </Typography>
                    </Alert>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <TextField
                        label="Capital del nuevo préstamo"
                        type="text"
                        value={formatAmount(renewAmount)}
                        onChange={(e) => onRenewAmountChange?.(unformatAmount(e.target.value))}
                        inputMode="numeric"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><AttachMoney /></InputAdornment>,
                        }}
                        helperText="Default: mismo capital del préstamo original"
                        fullWidth
                      />
                      <TextField
                        label="Cantidad de cuotas"
                        type="number"
                        value={renewTotalPayments}
                        onChange={(e) => onRenewTotalPaymentsChange?.(e.target.value)}
                        inputProps={{ min: 1 }}
                        fullWidth
                      />
                      <TextField
                        label="Tasa de interés (%)"
                        type="number"
                        value={renewInterestPct}
                        onChange={(e) => onRenewInterestPctChange?.(e.target.value)}
                        inputProps={{ min: 0, step: '0.01' }}
                        helperText="Ej: 50 para 50%"
                        fullWidth
                      />
                      <TextField
                        label="Tasa de mora (%)"
                        type="number"
                        value={renewPenaltyPct}
                        onChange={(e) => onRenewPenaltyPctChange?.(e.target.value)}
                        inputProps={{ min: 0, step: '0.01' }}
                        helperText="Ej: 5 para 5%"
                        fullWidth
                      />
                      <FormControl fullWidth>
                        <InputLabel>Frecuencia</InputLabel>
                        <Select
                          value={renewFrequency}
                          label="Frecuencia"
                          onChange={(e) => {
                            const v = e.target.value as RenewFrequency
                            onRenewFrequencyChange?.(v)
                            if (v === 'DAILY' || v === 'MONTHLY') onRenewPaymentDayChange?.('')
                          }}
                        >
                          <MenuItem value="DAILY">Diaria</MenuItem>
                          <MenuItem value="WEEKLY">Semanal</MenuItem>
                          <MenuItem value="BIWEEKLY">Quincenal</MenuItem>
                          <MenuItem value="MONTHLY">Mensual</MenuItem>
                        </Select>
                      </FormControl>
                      {(renewFrequency === 'WEEKLY' || renewFrequency === 'BIWEEKLY') && (
                        <FormControl fullWidth>
                          <InputLabel>Día de pago</InputLabel>
                          <Select
                            value={renewPaymentDay}
                            label="Día de pago"
                            onChange={(e) => onRenewPaymentDayChange?.(e.target.value as RenewPaymentDay)}
                          >
                            <MenuItem value="MONDAY">Lunes</MenuItem>
                            <MenuItem value="TUESDAY">Martes</MenuItem>
                            <MenuItem value="WEDNESDAY">Miércoles</MenuItem>
                            <MenuItem value="THURSDAY">Jueves</MenuItem>
                            <MenuItem value="FRIDAY">Viernes</MenuItem>
                            <MenuItem value="SATURDAY">Sábado</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                      <TextField
                        label="Fecha del primer pago"
                        type="date"
                        value={renewFirstDueDate}
                        onChange={(e) => onRenewFirstDueDateChange?.(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        required
                      />
                    </Box>

                    <Alert severity="success" sx={{ mb: 2 }} icon={<Info />}>
                      <Typography variant="body2">
                        Se cancelará <strong>{formatCurrencyDisplay(outstandingBalance)}</strong> (ingresa a tu billetera) y se desembolsará <strong>{formatCurrencyDisplay(parseFloat(unformatAmount(renewAmount)) || 0)}</strong> (egresa de tu billetera).
                      </Typography>
                    </Alert>

                    <TextField
                      label="Notas (opcional)"
                      multiline
                      rows={2}
                      value={notes}
                      onChange={(e) => onNotesChange(e.target.value)}
                      fullWidth
                      placeholder="Observaciones sobre la renovación..."
                    />
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Box>

      {/* ── Actions ── */}
      <Divider />
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          display: 'flex',
          gap: { xs: 1.5, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
          paddingBottom: { xs: 'max(env(safe-area-inset-bottom), 16px)', sm: 3 },
          flexShrink: 0,
        }}
      >
        <Button
          onClick={onCancel}
          variant="outlined"
          fullWidth
          sx={{ borderRadius: 2, py: { xs: 1.25, sm: 1.5 }, order: { xs: 2, sm: 1 } }}
        >
          Cancelar
        </Button>
        {renewMode ? (
          <Button
            onClick={onRenew}
            variant="contained"
            color="secondary"
            disabled={!canRenew || renewLoading || loanLoading}
            startIcon={renewLoading ? <CircularProgress size={20} color="inherit" /> : <Autorenew />}
            fullWidth
            sx={{
              borderRadius: 2,
              py: { xs: 1.25, sm: 1.5 },
              order: { xs: 1, sm: 2 },
              background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #7b1fa2 0%, #512da8 100%)' },
            }}
          >
            {renewLoading ? 'Renovando...' : 'Renovar y registrar'}
          </Button>
        ) : (
          <Button
            onClick={onRegister}
            variant="contained"
            color="primary"
            disabled={!canRegister || isRegistering}
            startIcon={isRegistering ? <CircularProgress size={20} color="inherit" /> : <Payment />}
            fullWidth
            sx={{
              borderRadius: 2,
              py: { xs: 1.25, sm: 1.5 },
              order: { xs: 1, sm: 2 },
            }}
          >
            {isRegistering ? 'Registrando...' : 'Registrar Pago'}
          </Button>
        )}
      </Box>
    </>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  color,
  theme,
}: {
  label: string
  value: string
  color?: string
  theme: ReturnType<typeof useTheme>
}) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        p: { xs: 1, sm: 2 },
        bgcolor: alpha(theme.palette.grey[500], 0.06),
        borderRadius: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight="bold" color={color} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Box>
  )
}
