'use client';

import {
  Card,
  CardActionArea,
  CardContent,
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import {
  DragIndicator,
  Payment,
  Refresh,
  Warning,
} from '@mui/icons-material';
import { CollectionRouteItem } from '@/services/collection-routes.service';
import { StatusChip } from '@/components/ui/StatusChip';
import { iosColors } from '@/lib/theme';
import { DateTime } from 'luxon';

export interface RouteItemCardProps {
  item: CollectionRouteItem;
  index: number;
  onPayment?: (item: CollectionRouteItem) => void;
  onReset?: (item: CollectionRouteItem) => void;
  onReschedule?: (item: CollectionRouteItem) => void;
  onCardClick?: (item: CollectionRouteItem) => void;
  isActive: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
  resettingSubloanId?: string | null;
  /** Number of previous overdue installments for this loan (from parent) */
  overdueCount?: number;
}

const formatCurrency = (amount: number) =>
  `$${new Intl.NumberFormat('es', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}`;

const formatDate = (dateString: string) =>
  DateTime.fromISO(dateString).setLocale('es').toFormat('dd MMM');

/**
 * RouteItemCard v1.5 — iOS-style minimal card
 *
 * Shows only the essential info at a glance:
 *   #N  Client Name  [amount]  [STATUS]  [PAY]
 *       Cuota X · Vence DD MMM · ⚠ N adeudadas
 *
 * Tapping the card body → opens RouteItemBottomSheet (drill-down)
 * Tapping "Pagar" button → opens PaymentModal directly
 */
export function RouteItemCard({
  item,
  index,
  onPayment,
  onReset,
  onReschedule,
  onCardClick,
  isActive,
  isDragging,
  dragHandleProps,
  resettingSubloanId,
  overdueCount = 0,
}: RouteItemCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!item.subLoan) return null;

  const pendingAmount = item.subLoan.totalAmount - item.subLoan.paidAmount;
  const isPaid = item.subLoan.status === 'PAID';
  const isOverdue = item.subLoan.status === 'OVERDUE';
  const isPartial = item.subLoan.status === 'PARTIAL';
  const hasDebt = overdueCount > 0;
  const isResetting = resettingSubloanId === item.subLoanId;

  // Border color: red if has prior debt, green if paid, primary if active
  const borderColor = hasDebt
    ? iosColors.red
    : isPaid
    ? iosColors.green
    : isOverdue
    ? iosColors.orange
    : iosColors.blue;

  return (
    <Card
      elevation={isDragging ? 6 : 0}
      sx={{
        mb: 1,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '16px',
        border: `0.5px solid ${iosColors.gray4}`,
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
        transition: 'all 0.2s ease',
        opacity: isDragging ? 0.85 : 1,
        transform: isDragging ? 'scale(1.02)' : 'none',
        bgcolor: hasDebt ? alpha(iosColors.red, 0.03) : 'background.paper',
        boxShadow: isDragging
          ? '0 8px 32px rgba(0,0,0,0.14)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'visible',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Drag handle — stops card click propagation */}
        {dragHandleProps && (
          <Box
            {...dragHandleProps}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            sx={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              px:             { xs: 1.5, sm: 1 },
              py:             { xs: 1, sm: 0 },
              minWidth:       44,
              cursor:         'grab',
              color:          iosColors.gray3,
              touchAction:    'none',
              '&:active':     { cursor: 'grabbing' },
              flexShrink:     0,
            }}
          >
            <DragIndicator fontSize="small" />
          </Box>
        )}

        {/* Tappable card area — opens BottomSheet */}
        <CardActionArea
          onClick={() => onCardClick?.(item)}
          sx={{
            flex: 1,
            minWidth: 0,
            borderRadius: 0,
            '&:active': { opacity: 0.7 },
          }}
        >
          <CardContent
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: { xs: 1.5, sm: 1.75 },
              '&:last-child': { pb: { xs: 1.5, sm: 1.75 } },
            }}
          >
            {/* ── Row 1a: index + name ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color:      iosColors.gray1,
                  minWidth:   24,
                  flexShrink: 0,
                  fontSize:   '0.75rem',
                }}
              >
                #{index + 1}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight:   700,
                  fontSize:     { xs: '0.9375rem', sm: '1rem' },
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                  color:        'text.primary',
                  flex:         1,
                  minWidth:     0,
                }}
              >
                {item.clientName}
              </Typography>
            </Box>

            {/* ── Row 1b: amount + status ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: '32px', mb: 0.25 }}>
              {!isPaid && (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize:   { xs: '0.875rem', sm: '1rem' },
                    color:      iosColors.red,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatCurrency(pendingAmount)}
                </Typography>
              )}
              <StatusChip status={item.subLoan.status} size="small" sx={{ flexShrink: 0 }} />
            </Box>

            {/* ── Row 2: cuota · vence · debt badge ── */}
            <Box
              sx={{
                display:    'flex',
                alignItems: 'center',
                gap:        0.75,
                mt:         0.25,
                ml:         '32px',
                flexWrap:   'wrap',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Cuota #{item.subLoan.paymentNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary">·</Typography>
              <Typography variant="caption" color="text.secondary">
                Vence {formatDate(item.subLoan.dueDate)}
              </Typography>

              {/* Prior debt indicator */}
              {hasDebt && (
                <>
                  <Typography variant="caption" color="text.secondary">·</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <Warning sx={{ fontSize: 12, color: iosColors.red }} />
                    <Typography
                      variant="caption"
                      sx={{ color: iosColors.red, fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      {overdueCount} adeudada{overdueCount > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </>
              )}

              {/* Partial balance indicator */}
              {isPartial && item.subLoan.paidAmount > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary">·</Typography>
                  <Typography variant="caption" sx={{ color: iosColors.orange, fontWeight: 600 }}>
                    Abonado {formatCurrency(item.subLoan.paidAmount)} · Resta {formatCurrency(pendingAmount)}
                  </Typography>
                </>
              )}

              {/* Collected today indicator */}
              {item.amountCollected > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary">·</Typography>
                  <Typography variant="caption" sx={{ color: iosColors.green, fontWeight: 600 }}>
                    Cobrado {formatCurrency(item.amountCollected)}
                  </Typography>
                </>
              )}
            </Box>
          </CardContent>
        </CardActionArea>

        {/* ── Action button (right side, not part of card tap area) ── */}
        {isActive && (
          <Box
            sx={{
              display:        'flex',
              alignItems:     'center',
              pr:             { xs: 1.5, sm: 2 },
              pl:             0.5,
              flexShrink:     0,
            }}
          >
            {isPaid ? (
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<Refresh sx={{ fontSize: 16 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onReset?.(item);
                }}
                disabled={isResetting}
                sx={{
                  minHeight:  44,
                  minWidth:   { xs: 80, sm: 96 },
                  fontSize:   '0.8125rem',
                  fontWeight: 600,
                  borderWidth: '1.5px',
                  '&:active': { transform: 'scale(0.96)' },
                }}
              >
                {isResetting ? '...' : 'Resetear'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<Payment sx={{ fontSize: 16 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onPayment?.(item);
                }}
                sx={{
                  minHeight:    44,
                  minWidth:     { xs: 72, sm: 88 },
                  fontSize:     '0.8125rem',
                  fontWeight:   700,
                  boxShadow:    'none',
                  borderRadius: 12,
                  bgcolor:      iosColors.blue,
                  '&:hover':    { bgcolor: '#0051A8', boxShadow: 'none' },
                  '&:active':   { transform: 'scale(0.96)' },
                }}
              >
                Pagar
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Card>
  );
}
