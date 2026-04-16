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
} from '@mui/material'
import {
  Payment,
  AttachMoney,
  PictureAsPdf,
  Info,
  TuneRounded,
  CalendarToday,
  EditCalendar,
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

const fmtDate = (iso: string) =>
  DateTime.fromISO(iso, { zone: 'utc' }).setLocale('es').toFormat("cccc d 'de' MMMM")

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
}: PaymentFormProps) {
  const canRegister = currentSubloan && paymentAmount && parseFloat(paymentAmount) > 0

  // "Próximo pago" state — only relevant when paymentPreview.isPartial
  const suggestedNextDate = calcNextDueDate(currentSubloan?.dueDate, paymentFrequency)
  const [nextDueDate, setNextDueDate] = useState(suggestedNextDate)

  const isPartial = paymentPreview?.isPartial ?? false

  return (
    <>
      {/* ── Scrollable body ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 3 } }}>
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
            <Box
              sx={{
                p: { xs: 2, sm: 2.5 },
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'primary.main',
                mb: 3,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                Cuota #{currentSubloan.paymentNumber ?? '?'}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2 } }}>
                <StatBox label="Monto Total"     value={formatCurrencyDisplay(currentSubloan.totalAmount ?? 0)} />
                <StatBox label="Monto Pagado"    value={formatCurrencyDisplay(currentSubloan.paidAmount || 0)} color="success.main" />
                <StatBox label="Saldo Pendiente" value={formatCurrencyDisplay((currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0))} color="error.main" />
                {currentSubloan.outstandingBalance !== undefined && (
                  <StatBox label="Saldo a finalizar" value={formatCurrencyDisplay(currentSubloan.outstandingBalance ?? 0)} color="warning.main" borderColor="warning.main" />
                )}
              </Box>
            </Box>

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
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <CalendarToday sx={{ fontSize: 18, color: iosColors.orange }} />
                  <Typography variant="body2" fontWeight={700} color="warning.main">
                    Próximo pago
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Monto restante
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="warning.main">
                      {formatCurrencyDisplay(paymentPreview?.remainingAfterPayment ?? 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Fecha sugerida
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {nextDueDate ? fmtDate(nextDueDate) : '—'}
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  label="Cambiar fecha"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><EditCalendar sx={{ fontSize: 18 }} /></InputAdornment>,
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                />

                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                  Esta fecha se enviará al servidor como próximo vencimiento de la cuota.
                </Typography>
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
        <Button
          onClick={onRegister}
          variant="contained"
          disabled={!canRegister || isRegistering}
          startIcon={isRegistering ? <CircularProgress size={20} color="inherit" /> : <Payment />}
          fullWidth
          sx={{
            borderRadius: 2,
            py: { xs: 1.25, sm: 1.5 },
            order: { xs: 1, sm: 2 },
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4292 100%)' },
          }}
        >
          {isRegistering ? 'Registrando...' : 'Registrar Pago'}
        </Button>
      </Box>
    </>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  color,
  borderColor,
}: {
  label: string
  value: string
  color?: string
  borderColor?: string
}) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        p: { xs: 1.5, sm: 2 },
        bgcolor: 'white',
        borderRadius: 2,
        ...(borderColor && { border: '1px solid', borderColor }),
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight="bold" color={color} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
        {value}
      </Typography>
    </Box>
  )
}
