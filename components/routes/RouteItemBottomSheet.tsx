'use client';

import { useState, useEffect, useRef } from 'react';
import {
  SwipeableDrawer,
  Box,
  Typography,
  Button,
  Divider,
  Alert,
  Stack,
  Skeleton,
  Collapse,
} from '@mui/material';
import {
  Phone,
  LocationOn,
  OpenInNew,
  Payment,
  EditCalendar,
  Refresh,
  Warning,
  CheckCircle,
  ChevronRight,
  ExpandMore,
  CheckCircleOutline,
  RadioButtonUnchecked,
  ErrorOutline,
  Schedule,
} from '@mui/icons-material';
import { CollectionRouteItem } from '@/services/collection-routes.service';
import { StatusChip } from '@/components/ui/StatusChip';
import { iosColors } from '@/lib/theme';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { subLoansService } from '@/services/sub-loans.service';
import { paymentsService } from '@/services/payments.service';
import { loansService } from '@/services/loans.service';
import { DateTime } from 'luxon';

const fmt = (amount: number) =>
  `$${new Intl.NumberFormat('es', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}`;

const fmtDate = (dateString: string) =>
  DateTime.fromISO(dateString).setLocale('es').toFormat("dd 'de' MMMM, yyyy");

const fmtDateShort = (dateString: string) =>
  DateTime.fromISO(dateString).setLocale('es').toFormat('dd MMM yyyy');

const daysAgo = (dateString: string) => {
  const days = Math.floor(DateTime.now().diff(DateTime.fromISO(dateString), 'days').days);
  return days === 0 ? 'hoy' : days === 1 ? 'hace 1 día' : `hace ${days} días`;
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface OverdueSubLoan {
  id: string;
  paymentNumber: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
}

interface LoanSubLoan {
  id: string;
  paymentNumber: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  amount: number;
}

interface RouteItemBottomSheetProps {
  open: boolean;
  onClose: () => void;
  item: CollectionRouteItem | null;
  isRouteClosed: boolean;
  /** Open PaymentModal for this item */
  onPayment?: (item: CollectionRouteItem) => void;
  /** Open RescheduleDateDialog for this item */
  onReschedule?: (item: CollectionRouteItem) => void;
  /** Reset payments for this item */
  onReset?: (item: CollectionRouteItem) => void;
  resettingSubloanId?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RouteItemBottomSheet({
  open,
  onClose,
  item,
  isRouteClosed,
  onPayment,
  onReschedule,
  onReset,
  resettingSubloanId,
}: RouteItemBottomSheetProps) {
  const { handleOpen, handleClose } = useBottomSheet(open, (v) => {
    if (!v) onClose();
  });

  const [overdueSubLoans, setOverdueSubLoans] = useState<OverdueSubLoan[]>([]);
  const [loadingOverdue, setLoadingOverdue] = useState(false);
  const fetchedLoanId = useRef<string | null>(null);

  // Historial de pagos — lazy, solo se carga al expandir
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialPayments, setHistorialPayments] = useState<Array<{ id: string; amount: number; paymentDate: string; description?: string }>>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const fetchedHistorialId = useRef<string | null>(null);

  // Todas las cuotas del préstamo — lazy, colapsable
  const [allSubLoansOpen, setAllSubLoansOpen] = useState(false);
  const [allSubLoans, setAllSubLoans] = useState<LoanSubLoan[]>([]);
  const [loadingAllSubLoans, setLoadingAllSubLoans] = useState(false);
  const fetchedAllSubLoansLoanId = useRef<string | null>(null);


  // Fetch overdue subloans when sheet opens for a new item
  useEffect(() => {
    if (!open || !item?.subLoan) return;
    const loanId = item.subLoan.loan?.loanTrack; // use loanTrack as cache key

    // Don't refetch if we already have data for this loan
    if (fetchedLoanId.current === loanId) return;

    setLoadingOverdue(true);
    setOverdueSubLoans([]);

    // Try to get overdue subloans via the existing service
    // We look for subloans of the same loan that are OVERDUE and have paymentNumber < current
    const currentPaymentNumber = item.subLoan.paymentNumber;

    subLoansService
      .getSubLoansWithClientInfo({ status: 'OVERDUE' })
      .then((all) => {
        // Filter to only subloans from the same loan (match by loanTrack)
        const sameLoansOverdue = all.filter(
          (sl) =>
            sl.loan?.loanTrack === item.subLoan?.loan?.loanTrack &&
            sl.paymentNumber < currentPaymentNumber
        );
        setOverdueSubLoans(
          sameLoansOverdue.map((sl) => ({
            id:            sl.id,
            paymentNumber: sl.paymentNumber,
            totalAmount:   sl.totalAmount,
            paidAmount:    sl.paidAmount ?? 0,
            dueDate:       sl.dueDate,
            status:        sl.status,
          }))
        );
        fetchedLoanId.current = loanId ?? null;
      })
      .catch(() => {
        /* silent — overdue data is supplemental */
      })
      .finally(() => setLoadingOverdue(false));
  }, [open, item]);

  // Reset fetch cache when item changes
  useEffect(() => {
    if (!open) {
      fetchedLoanId.current = null;
      setOverdueSubLoans([]);
      setHistorialOpen(false);
      setHistorialPayments([]);
      fetchedHistorialId.current = null;
      setAllSubLoansOpen(false);
      setAllSubLoans([]);
      fetchedAllSubLoansLoanId.current = null;
    }
  }, [open]);

  const handleToggleHistorial = () => {
    const subLoanId = item?.subLoan?.id;
    if (!subLoanId) return;

    if (historialOpen) {
      setHistorialOpen(false);
      return;
    }

    setHistorialOpen(true);
    if (fetchedHistorialId.current === subLoanId) return;

    setLoadingHistorial(true);
    paymentsService
      .getPaymentHistory(subLoanId)
      .then((res) => {
        setHistorialPayments(res.payments ?? []);
        fetchedHistorialId.current = subLoanId;
      })
      .catch(() => setHistorialPayments([]))
      .finally(() => setLoadingHistorial(false));
  };

  const handleToggleAllSubLoans = () => {
    const loanId = item?.subLoan?.loan?.id;
    if (!loanId) return;

    if (allSubLoansOpen) {
      setAllSubLoansOpen(false);
      return;
    }

    setAllSubLoansOpen(true);
    if (fetchedAllSubLoansLoanId.current === loanId) return;

    setLoadingAllSubLoans(true);
    loansService
      .getLoanById(loanId)
      .then((loan) => {
        const subs = (loan as unknown as { subLoans?: LoanSubLoan[] }).subLoans ?? [];
        setAllSubLoans(subs);
        fetchedAllSubLoansLoanId.current = loanId;
      })
      .catch(() => setAllSubLoans([]))
      .finally(() => setLoadingAllSubLoans(false));
  };

  if (!item?.subLoan) return null;

  const subLoan       = item.subLoan;
  const pendingAmount = subLoan.totalAmount - subLoan.paidAmount;
  const isPaid        = subLoan.status === 'PAID';
  const isResetting   = resettingSubloanId === item.subLoanId;

  const totalOverdue  = overdueSubLoans.reduce(
    (sum, sl) => sum + (sl.totalAmount - sl.paidAmount),
    0
  );

  const openMaps = () => {
    if (item.clientAddress) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.clientAddress)}`,
        '_blank'
      );
    }
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={handleClose}
      onOpen={handleOpen}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderRadius:    '20px 20px 0 0',
          paddingBottom:   'env(safe-area-inset-bottom)',
          maxHeight:       '92dvh',
          overflow:        'hidden',
          display:         'flex',
          flexDirection:   'column',
          bgcolor:         iosColors.groupedBackground,
        },
      }}
    >
      {/* ── Drag handle ── */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 1, flexShrink: 0 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: iosColors.gray3 }} />
      </Box>

      {/* ── Header ── */}
      <Box
        sx={{
          px: 2.5,
          pb: 1.5,
          display:    'flex',
          alignItems: 'flex-start',
          gap:        1.5,
          flexShrink: 0,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.3, mb: 0.25 }}
          >
            {item.clientName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subLoan.loan.loanTrack}
          </Typography>
        </Box>
        <StatusChip status={subLoan.status} size="medium" sx={{ mt: 0.25 }} />
      </Box>

      <Divider />

      {/* ── Scrollable content ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>

        {/* Contact */}
        <Box
          sx={{
            bgcolor: iosColors.systemBackground,
            borderRadius: 2,
            overflow: 'hidden',
            mb: 2,
            border: `0.5px solid ${iosColors.gray4}`,
          }}
        >
          {item.clientPhone && (
            <Box
              component="a"
              href={`tel:${item.clientPhone}`}
              sx={{
                display:        'flex',
                alignItems:     'center',
                gap:            1.5,
                px:             2,
                py:             1.5,
                textDecoration: 'none',
                color:          iosColors.blue,
                minHeight:      44,
                '&:active':     { bgcolor: iosColors.gray6 },
              }}
            >
              <Phone sx={{ fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'inherit' }}>
                {item.clientPhone}
              </Typography>
            </Box>
          )}
          {item.clientPhone && item.clientAddress && <Divider />}
          {item.clientAddress && (
            <Box
              onClick={openMaps}
              sx={{
                display:    'flex',
                alignItems: 'flex-start',
                gap:        1.5,
                px:         2,
                py:         1.5,
                cursor:     'pointer',
                color:      iosColors.blue,
                minHeight:  44,
                '&:active': { bgcolor: iosColors.gray6 },
              }}
            >
              <LocationOn sx={{ fontSize: 20, mt: 0.1 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'inherit' }}>
                  {item.clientAddress}
                </Typography>
              </Box>
              <OpenInNew sx={{ fontSize: 16, mt: 0.2, flexShrink: 0 }} />
            </Box>
          )}
        </Box>

        {/* Current installment */}
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Cuota actual
        </Typography>
        <Box
          sx={{
            bgcolor:      iosColors.systemBackground,
            borderRadius: 2,
            border:       `0.5px solid ${iosColors.gray4}`,
            p:            2,
            mb:           2,
            display:      'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap:          1.5,
          }}
        >
          <InfoCell label="Cuota #" value={`#${subLoan.paymentNumber}`} />
          <InfoCell label="Vencimiento" value={fmtDate(subLoan.dueDate)} />
          <InfoCell label="Total cuota" value={fmt(subLoan.totalAmount)} />
          <InfoCell label="Ya pagado" value={fmt(subLoan.paidAmount)} color={subLoan.paidAmount > 0 ? iosColors.green : undefined} />
          {!isPaid && (
            <InfoCell label="Pendiente" value={fmt(pendingAmount)} color={iosColors.red} />
          )}
          {subLoan.status === 'PARTIAL' && subLoan.paidAmount > 0 && (
            <InfoCell label="Resta pagar" value={fmt(pendingAmount)} color={iosColors.orange} />
          )}
          {item.amountCollected > 0 && (
            <InfoCell label="Cobrado hoy" value={fmt(item.amountCollected)} color={iosColors.green} />
          )}
        </Box>

        {/* Todas las cuotas del préstamo — lazy expandible */}
        <Box
          sx={{
            bgcolor:      iosColors.systemBackground,
            borderRadius: 2,
            border:       `0.5px solid ${iosColors.gray4}`,
            overflow:     'hidden',
            mb:           2,
          }}
        >
          <Box
            onClick={handleToggleAllSubLoans}
            sx={{
              px: 2, py: 1.5,
              display: 'flex', alignItems: 'center', gap: 1.5,
              cursor: 'pointer', minHeight: 44,
              '&:active': { bgcolor: iosColors.gray6 },
            }}
          >
            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
              Cuotas del préstamo
            </Typography>
            {allSubLoansOpen
              ? <ExpandMore sx={{ fontSize: 20, color: iosColors.gray1 }} />
              : <ChevronRight sx={{ fontSize: 20, color: iosColors.gray1 }} />
            }
          </Box>
          <Collapse in={allSubLoansOpen}>
            <Divider />
            {loadingAllSubLoans ? (
              <Box sx={{ px: 2, py: 1.5 }}>
                {[1, 2, 3].map((i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Skeleton variant="circular" width={20} height={20} />
                    <Skeleton variant="text" width="30%" height={18} />
                    <Box sx={{ flex: 1 }} />
                    <Skeleton variant="text" width="20%" height={18} />
                    <Skeleton variant="text" width="25%" height={14} sx={{ ml: 1 }} />
                  </Box>
                ))}
              </Box>
            ) : allSubLoans.length === 0 ? (
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Sin cuotas disponibles</Typography>
              </Box>
            ) : (
              allSubLoans.map((sl, i) => {
                const isCurrent = sl.id === subLoan.id;
                const isSlPaid = sl.status === 'PAID';
                const isSlOverdue = sl.status === 'OVERDUE';
                const isSlPartial = sl.status === 'PARTIAL';
                const slColor = isSlPaid
                  ? iosColors.green
                  : isSlOverdue
                  ? iosColors.red
                  : isSlPartial
                  ? iosColors.orange
                  : 'text.secondary';
                const SlIcon = isSlPaid
                  ? CheckCircleOutline
                  : isSlOverdue
                  ? ErrorOutline
                  : isSlPartial
                  ? Schedule
                  : RadioButtonUnchecked;

                return (
                  <Box key={sl.id}>
                    <Box
                      sx={{
                        px: 2, py: 1.25,
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        bgcolor: isCurrent ? `${iosColors.blue}10` : 'transparent',
                        borderLeft: isCurrent ? `3px solid ${iosColors.blue}` : '3px solid transparent',
                      }}
                    >
                      <SlIcon sx={{ fontSize: 18, color: slColor, flexShrink: 0 }} />
                      <Typography
                        variant="body2"
                        fontWeight={isCurrent ? 700 : 400}
                        sx={{ minWidth: 70, color: isCurrent ? 'primary.main' : 'text.primary' }}
                      >
                        Cuota #{sl.paymentNumber}
                      </Typography>
                      <Typography variant="body2" fontWeight={isCurrent ? 700 : 400} sx={{ flex: 1, color: slColor }}>
                        {fmt(sl.totalAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {fmtDateShort(sl.dueDate)}
                      </Typography>
                    </Box>
                    {i < allSubLoans.length - 1 && <Divider />}
                  </Box>
                );
              })
            )}
          </Collapse>
        </Box>

        {/* Overdue prior installments */}
        {loadingOverdue && (
          <>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Cuotas anteriores adeudadas
            </Typography>
            <Box
              sx={{
                bgcolor:      iosColors.systemBackground,
                borderRadius: 2,
                border:       `0.5px solid ${iosColors.gray4}`,
                overflow:     'hidden',
                mb:           2,
              }}
            >
              {[1, 2].map((i) => (
                <Box key={i} sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="40%" height={18} />
                    <Skeleton variant="text" width="65%" height={14} sx={{ mt: 0.25 }} />
                  </Box>
                  <Skeleton variant="text" width={60} height={18} />
                </Box>
              ))}
            </Box>
          </>
        )}

        {!loadingOverdue && overdueSubLoans.length > 0 && (
          <>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Cuotas anteriores adeudadas
            </Typography>
            <Alert
              severity="error"
              icon={<Warning />}
              sx={{ mb: 1.5, borderRadius: 2, alignItems: 'flex-start' }}
            >
              <Typography variant="body2" fontWeight={700}>
                {overdueSubLoans.length} cuota{overdueSubLoans.length > 1 ? 's' : ''} vencida{overdueSubLoans.length > 1 ? 's' : ''} — Total {fmt(totalOverdue)}
              </Typography>
            </Alert>
            <Box
              sx={{
                bgcolor:      iosColors.systemBackground,
                borderRadius: 2,
                border:       `0.5px solid ${iosColors.red}`,
                overflow:     'hidden',
                mb:           2,
              }}
            >
              {overdueSubLoans.map((sl, i) => (
                <Box key={sl.id}>
                  <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        Cuota #{sl.paymentNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Venció {fmtDateShort(sl.dueDate)} · {daysAgo(sl.dueDate)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color="error.main">
                      {fmt(sl.totalAmount - sl.paidAmount)}
                    </Typography>
                  </Box>
                  {i < overdueSubLoans.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          </>
        )}

        {/* Historial de pagos — lazy expandible */}
        {subLoan.paidAmount > 0 && (
          <Box
            sx={{
              bgcolor: iosColors.systemBackground,
              borderRadius: 2,
              border: `0.5px solid ${iosColors.gray4}`,
              overflow: 'hidden',
              mb: 2,
            }}
          >
            <Box
              onClick={handleToggleHistorial}
              sx={{
                px: 2, py: 1.5,
                display: 'flex', alignItems: 'center', gap: 1.5,
                cursor: 'pointer', minHeight: 44,
                '&:active': { bgcolor: iosColors.gray6 },
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                Historial de pagos
              </Typography>
              {historialOpen
                ? <ExpandMore sx={{ fontSize: 20, color: iosColors.gray1 }} />
                : <ChevronRight sx={{ fontSize: 20, color: iosColors.gray1 }} />
              }
            </Box>
            <Collapse in={historialOpen}>
              <Divider />
              {loadingHistorial ? (
                <Box sx={{ px: 2, py: 1.5 }}>
                  {[1, 2].map((i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Skeleton variant="text" width="45%" height={18} />
                      <Skeleton variant="text" width="25%" height={18} />
                    </Box>
                  ))}
                </Box>
              ) : historialPayments.length === 0 ? (
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Sin pagos registrados</Typography>
                </Box>
              ) : (
                historialPayments.map((p, i) => (
                  <Box key={p.id}>
                    <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          {fmt(p.amount)}
                        </Typography>
                        {p.description && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {p.description}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {fmtDateShort(p.paymentDate)}
                      </Typography>
                    </Box>
                    {i < historialPayments.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </Collapse>
          </Box>
        )}

        {/* Collected today — confirmation */}
        {item.amountCollected > 0 && isPaid && (
          <Box
            sx={{
              bgcolor:      '#E8F5E9',
              borderRadius: 2,
              border:       `0.5px solid ${iosColors.green}`,
              p:            2,
              mb:           2,
              display:      'flex',
              alignItems:   'center',
              gap:          1.5,
            }}
          >
            <CheckCircle sx={{ color: iosColors.green }} />
            <Box>
              <Typography variant="body2" fontWeight={700} color="success.main">
                Pagado hoy — {fmt(item.amountCollected)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cuota completamente saldada
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Actions — fixed at bottom ── */}
      {!isRouteClosed && (
        <Box
          sx={{
            px:          2.5,
            pt:          1.5,
            pb:          2,
            flexShrink:  0,
            borderTop:   `0.5px solid ${iosColors.gray4}`,
            bgcolor:     iosColors.groupedBackground,
            display:     'flex',
            flexDirection: 'column',
            gap:         1,
          }}
        >
          {isPaid ? (
            <Button
              fullWidth
              variant="outlined"
              color="warning"
              startIcon={<Refresh />}
              disabled={isResetting}
              onClick={() => {
                onReset?.(item);
                handleClose();
              }}
              sx={{ minHeight: 48 }}
            >
              {isResetting ? 'Reseteando...' : 'Resetear pagos'}
            </Button>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<Payment />}
                onClick={() => {
                  onPayment?.(item);
                  handleClose();
                }}
                sx={{
                  flex:       1,
                  minHeight:  48,
                  bgcolor:    iosColors.blue,
                  boxShadow:  'none',
                  '&:hover':  { bgcolor: '#0051A8', boxShadow: 'none' },
                }}
              >
                Registrar Pago
              </Button>
              <Button
                variant="outlined"
                startIcon={<EditCalendar />}
                onClick={() => {
                  onReschedule?.(item);
                  handleClose();
                }}
                sx={{ minHeight: 48, minWidth: 56, px: 1.5 }}
              >
                Reprog.
              </Button>
            </Stack>
          )}
        </Box>
      )}
    </SwipeableDrawer>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function InfoCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={color ? { color } : undefined}>
        {value}
      </Typography>
    </Box>
  );
}
