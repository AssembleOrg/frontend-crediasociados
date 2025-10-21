'use client'

import React, { useState, useMemo } from 'react'
import {
  Box,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Grid,
  useMediaQuery,
  useTheme,
  Snackbar,
  Chip
} from '@mui/material'
import { Add, TrendingDown, TrendingUp } from '@mui/icons-material'
import PageHeader from '@/components/ui/PageHeader'
import { useWallet } from '@/hooks/useWallet'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/hooks/useAuth'
import { DepositModal } from '@/components/wallets/DepositModal'
import { TransferToCobrador } from '@/components/wallets/TransferToCobrador'
import { WithdrawFromCobrador } from '@/components/wallets/WithdrawFromCobrador'
import type { User } from '@/types/auth'

interface ToastState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'info' | 'warning'
}

export default function OperativoSubadminPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const { wallet, isLoading: walletLoading, refetchWallet, deposit } = useWallet()
  const { users, fetchUsers } = useUsers()

  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Filter cobradores (prestamistas) created by current subadmin
  const cobradores = useMemo(() => {
    return users.filter(user => user.role === 'prestamista')
  }, [users])

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ open: true, message, severity })
  }

  const closeToast = () => {
    setToast(prev => ({ ...prev, open: false }))
  }

  if (walletLoading && !wallet) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Cargando datos de operativa...
          </Typography>
        </Box>
      </Box>
    )
  }

  const handleDeposit = async (data: { amount: number; currency: string; description: string }) => {
    const success = await deposit(data.amount, data.description, data.currency)
    if (success) {
      setDepositModalOpen(false)
      await refetchWallet()
      showToast(`✅ Depósito de $${data.amount.toLocaleString('es-AR')} realizado exitosamente`, 'success')
    } else {
      showToast('Error al realizar el depósito', 'error')
    }
  }

  const handleTransferSuccess = async () => {
    setTransferModalOpen(false)
    await refetchWallet()
    await fetchUsers()
    showToast('✅ Transferencia realizada exitosamente', 'success')
  }

  const handleWithdrawSuccess = async () => {
    setWithdrawModalOpen(false)
    await refetchWallet()
    await fetchUsers()
    showToast('✅ Retiro realizado exitosamente', 'success')
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Operativa"
        subtitle="Gestión de dinero y cobradores"
      />

      {/* Wallet Balance Card */}
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.dark' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Tu Saldo Disponible
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ${wallet?.balance ?? 0}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
              <Button
                variant="contained"
                startIcon={<TrendingUp />}
                onClick={() => setDepositModalOpen(true)}
                sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
              >
                Hacer Depósito
              </Button>
              <Button
                variant="contained"
                startIcon={<TrendingDown />}
                onClick={() => setTransferModalOpen(true)}
                disabled={!wallet || wallet.balance <= 0}
              >
                Transferir
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      {!isMobile && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Cobrador</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Cuota de Clientes</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Clientes Actuales</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Balance Actual</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cobradores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        No hay cobradores registrados aún
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  cobradores.map((cobrador) => (
                    <TableRow key={cobrador.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {cobrador.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cobrador.email}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {cobrador.usedClientQuota ?? 0}/{cobrador.clientQuota ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {cobrador.usedClientQuota ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                          ${cobrador.wallet?.balance ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button 
                          size="small" 
                          variant="outlined" 
                          sx={{ mr: 1 }}
                          onClick={() => setTransferModalOpen(true)}
                        >
                          Transferir
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          onClick={() => setWithdrawModalOpen(true)}
                        >
                          Retirar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Mobile Card View */}
      {isMobile && (
        <Box>
          {cobradores.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No hay cobradores registrados aún
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {cobradores.map((cobrador) => (
                <Grid size={{ xs: 12 }} key={cobrador.id}>
                  <Card sx={{ bgcolor: 'background.paper' }}>
                    <CardContent>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {cobrador.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cobrador.email}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`$${cobrador.wallet?.balance ?? 0}`}
                          color="success"
                          size="small"
                        />
                      </Box>

                      {/* Metrics Grid */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Cuota de Clientes
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {cobrador.usedClientQuota ?? 0}/{cobrador.clientQuota ?? 0}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Dinero Prestado
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                            $0
                          </Typography>
                        </Grid>
                      </Grid>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          fullWidth
                          onClick={() => setTransferModalOpen(true)}
                        >
                          Transferir
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          fullWidth
                          onClick={() => setWithdrawModalOpen(true)}
                        >
                          Retirar
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Modals */}
      <DepositModal
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSubmit={handleDeposit}
        onSuccess={(msg: string) => showToast(msg, 'success')}
      />

      <TransferToCobrador
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onSuccess={handleTransferSuccess}
        currentBalance={wallet?.balance ?? 0}
      />

      <WithdrawFromCobrador
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onSuccess={handleWithdrawSuccess}
      />

      {/* Toast Snackbar */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
