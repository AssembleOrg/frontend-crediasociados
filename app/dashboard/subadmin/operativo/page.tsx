'use client'

import React, { useState, useMemo, useEffect } from 'react'
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
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material'
import { TrendingDown, TrendingUp, Visibility, Edit, Delete, AccountBalanceWallet, Warning, History } from '@mui/icons-material'
import PageHeader from '@/components/ui/PageHeader'
import { useWallet } from '@/hooks/useWallet'
import { useUsers } from '@/hooks/useUsers'
import { DepositModal } from '@/components/wallets/DepositModal'
import { TransferToCobrador } from '@/components/wallets/TransferToCobrador'
import { WithdrawFromCobrador } from '@/components/wallets/WithdrawFromCobrador'
import { WithdrawFromCollectorModal } from '@/components/wallets/WithdrawFromCollectorModal'
import { DailySummaryModal } from '@/components/wallets/DailySummaryModal'
import { UserFormModal } from '@/components/users/UserFormModal'
import { formatAmount } from '@/lib/formatters'
import { collectorWalletService } from '@/services/collector-wallet.service'
import type { User } from '@/types/auth'
import dynamic from 'next/dynamic'

// Dynamic import for WalletHistoryModal
const WalletHistoryModal = dynamic(
  () => import('@/components/wallets/WalletHistoryModal'),
  { ssr: false }
)

interface ToastState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'info' | 'warning'
}

export default function OperativoSubadminPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const { wallet, isLoading: walletLoading, refetchWallet, deposit } = useWallet()
  const { users, fetchUsers, deleteUser, updateUser } = useUsers()

  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawCollectorModalOpen, setWithdrawCollectorModalOpen] = useState(false)
  const [dailySummaryModalOpen, setDailySummaryModalOpen] = useState(false)
  const [editUserModalOpen, setEditUserModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [selectedCobrador, setSelectedCobrador] = useState<User | null>(null)
  const [collectorBalances, setCollectorBalances] = useState<Record<string, number>>({})
  const [loadingCollectorBalances, setLoadingCollectorBalances] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [walletHistoryModalOpen, setWalletHistoryModalOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Filter cobradores (prestamistas) created by current subadmin
  const cobradores = useMemo(() => {
    return users.filter(user => user.role === 'prestamista')
  }, [users])

  // Fetch collector wallet balances for all cobradores
  const fetchCollectorBalances = async () => {
    if (cobradores.length === 0) return
    
    setLoadingCollectorBalances(true)
    try {
      const balances: Record<string, number> = {}
      
      // Fetch balances for each cobrador
      await Promise.all(
        cobradores.map(async (cobrador) => {
          try {
            const balance = await collectorWalletService.getBalanceForUser(cobrador.id)
            balances[cobrador.id] = balance.balance || 0
          } catch (error) {
            console.warn(`Error fetching collector balance for ${cobrador.fullName}:`, error)
            balances[cobrador.id] = 0
          }
        })
      )
      
      setCollectorBalances(balances)
    } catch (error) {
      console.error('Error fetching collector balances:', error)
    } finally {
      setLoadingCollectorBalances(false)
    }
  }

  // Fetch collector balances when cobradores change
  useEffect(() => {
    fetchCollectorBalances()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cobradores.length])

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
    const success = await deposit(data.amount, data.currency, data.description)
    if (success) {
      setDepositModalOpen(false)
      await refetchWallet()
      showToast(`✅ Depósito de $${formatAmount(data.amount.toString())} realizado exitosamente`, 'success')
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

  const handleWithdrawFromCollector = async (userId: string, amount: number, description: string) => {
    setWithdrawing(true)
    setWithdrawError(null)
    
    try {
      await collectorWalletService.withdrawForUser(userId, {
        amount,
        description
      })
      
      // Refresh collector balances
      await fetchCollectorBalances()
      
      showToast(`✅ Retiro de $${formatAmount(amount.toString())} realizado exitosamente`, 'success')
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Error al realizar el retiro'
      setWithdrawError(errorMsg)
      throw error
    } finally {
      setWithdrawing(false)
    }
  }

  const handleWithdrawCollectorSuccess = () => {
    setWithdrawCollectorModalOpen(false)
    setSelectedCobrador(null)
    setWithdrawError(null)
  }

  const handleEditUser = (cobrador: User) => {
    setSelectedCobrador(cobrador)
    setEditUserModalOpen(true)
  }

  const handleEditUserSuccess = async () => {
    setEditUserModalOpen(false)
    setSelectedCobrador(null)
    await fetchUsers()
    await fetchCollectorBalances()
    showToast('✅ Usuario actualizado exitosamente', 'success')
  }

  const handleDeleteUser = (cobrador: User) => {
    setSelectedCobrador(cobrador)
    setDeleteConfirmText('')
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedCobrador || deleteConfirmText.toLowerCase() !== 'eliminar') return

    try {
      const success = await deleteUser(selectedCobrador.id)
      if (success) {
        setDeleteConfirmOpen(false)
        setSelectedCobrador(null)
        setDeleteConfirmText('')
        await fetchUsers()
        await fetchCollectorBalances()
        showToast('✅ Usuario eliminado exitosamente', 'success')
      } else {
        showToast('Error al eliminar el usuario', 'error')
      }
    } catch (error) {
      showToast('Error al eliminar el usuario', 'error')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Operativa"
        subtitle="Gestión de dinero y cobradores"
      />

      {/* Wallet Balance Card */}
      <Card sx={{ mb: 4, bgcolor: 'primary.light', border: `1px solid ${theme.palette.primary.main}` }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 3, alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                Tu Saldo Disponible
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#fff' : '#000' }}>
                ${wallet?.balance?.toLocaleString('es-AR') ?? 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
              <Button
                variant="contained"
                startIcon={<TrendingUp />}
                onClick={() => setDepositModalOpen(true)}
                sx={{ backgroundColor: 'success.main', '&:hover': { backgroundColor: 'success.dark' } }}
              >
                Depositar
              </Button>
              <Button
                variant="outlined"
                startIcon={<TrendingDown />}
                onClick={() => setTransferModalOpen(true)}
                disabled={!wallet || wallet.balance <= 0}
              >
                Transferir
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Collector Wallets Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              💰 Wallets de Cobros
            </Typography>
            <Chip 
              label={`${cobradores.length} cobrador${cobradores.length !== 1 ? 'es' : ''}`}
              size="small" 
              color="primary" 
            />
          </Box>
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={() => setWalletHistoryModalOpen(true)}
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: 'primary.light',
                color: 'primary.dark',
              },
            }}
          >
            Ver Historial Completo
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Gestiona las wallets de cobros de tus cobradores. Los retiros NO se agregan a tu wallet principal.
        </Typography>

        {loadingCollectorBalances && cobradores.length > 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <Paper elevation={1}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'success.lighter' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Cobrador</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Cuota de Clientes</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Wallet de Cobros</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cobradores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          No hay cobradores registrados aún
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cobradores.map((cobrador) => {
                      const collectorBalance = collectorBalances[cobrador.id] || 0
                      return (
                        <TableRow key={`collector-${cobrador.id}`} hover>
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
                          <TableCell align="right">
                            <Chip
                              label={`$${collectorBalance.toLocaleString('es')}`}
                              color={collectorBalance > 0 ? 'success' : 'default'}
                              size="small"
                              sx={{ fontWeight: 600, minWidth: 100 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Editar cobrador" arrow>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditUser(cobrador)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Ver diario" arrow>
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => {
                                    setSelectedCobrador(cobrador)
                                    setDailySummaryModalOpen(true)
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Retirar de wallet" arrow>
                                <span>
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    disabled={collectorBalance <= 0}
                                    onClick={() => {
                                      setSelectedCobrador(cobrador)
                                      setWithdrawCollectorModalOpen(true)
                                    }}
                                  >
                                    <AccountBalanceWallet fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              
                              <Tooltip title="Eliminar cobrador" arrow>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteUser(cobrador)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      {/* Desktop Table View */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        💼 Wallets Principales (Transferencias)
      </Typography>
      {!isMobile && (
        <Paper sx={{ mb: 4 }}>
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
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: cobrador.wallet?.balance !== undefined 
                              ? cobrador.wallet.balance < 0 
                                ? 'error.main' 
                                : cobrador.wallet.balance > 0 
                                  ? 'success.main' 
                                  : 'text.secondary'
                              : 'text.secondary'
                          }}
                        >
                          {cobrador.wallet?.balance !== undefined ? `$${cobrador.wallet.balance.toLocaleString('es-AR')}` : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button 
                          size="small" 
                          variant="outlined" 
                          sx={{ mr: 1 }}
                          onClick={() => {
                            setSelectedCobrador(cobrador)
                            setTransferModalOpen(true)
                          }}
                        >
                          Transferir
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          onClick={() => {
                            setSelectedCobrador(cobrador)
                            setWithdrawModalOpen(true)
                          }}
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
                          label={cobrador.wallet?.balance !== undefined ? `$${cobrador.wallet.balance.toLocaleString('es-AR')}` : 'N/A'}
                          color={
                            cobrador.wallet?.balance !== undefined
                              ? cobrador.wallet.balance < 0
                                ? 'error'
                                : cobrador.wallet.balance > 0
                                  ? 'success'
                                  : 'default'
                              : 'default'
                          }
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
                          onClick={() => {
                            setSelectedCobrador(cobrador)
                            setTransferModalOpen(true)
                          }}
                        >
                          Transferir
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          fullWidth
                          onClick={() => {
                            setSelectedCobrador(cobrador)
                            setWithdrawModalOpen(true)
                          }}
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
        onClose={() => {
          setTransferModalOpen(false)
          setSelectedCobrador(null)
        }}
        selectedCobrador={selectedCobrador}
        currentBalance={wallet?.balance ?? 0}
        onSuccess={handleTransferSuccess}
      />

      <WithdrawFromCobrador
        open={withdrawModalOpen}
        onClose={() => {
          setWithdrawModalOpen(false)
          setSelectedCobrador(null)
        }}
        selectedCobrador={selectedCobrador}
        onSuccess={handleWithdrawSuccess}
      />

      <WithdrawFromCollectorModal
        open={withdrawCollectorModalOpen}
        onClose={() => {
          setWithdrawCollectorModalOpen(false)
          setSelectedCobrador(null)
          setWithdrawError(null)
        }}
        cobrador={selectedCobrador}
        collectorBalance={selectedCobrador ? (collectorBalances[selectedCobrador.id] || 0) : 0}
        onSuccess={handleWithdrawCollectorSuccess}
        onWithdraw={handleWithdrawFromCollector}
        isLoading={withdrawing}
        error={withdrawError}
      />

      <DailySummaryModal
        open={dailySummaryModalOpen}
        onClose={() => {
          setDailySummaryModalOpen(false)
          setSelectedCobrador(null)
        }}
        managerId={selectedCobrador?.id || ''}
        managerName={selectedCobrador?.fullName || ''}
      />

      <UserFormModal
        open={editUserModalOpen}
        onClose={() => {
          setEditUserModalOpen(false)
          setSelectedCobrador(null)
        }}
        mode="edit"
        user={selectedCobrador}
        onSuccess={handleEditUserSuccess}
        targetRole="prestamista"
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setSelectedCobrador(null)
          setDeleteConfirmText('')
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(to bottom, #fff, #fff)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f44336 0%, #c62828 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
              }}
            >
              <Warning sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="error.main">
                Eliminar Cobrador
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Esta acción es irreversible
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              ⚠️ Advertencia: Acción Permanente
            </Typography>
            <Typography variant="body2">
              Estás a punto de eliminar al cobrador <strong>{selectedCobrador?.fullName}</strong>. 
              Esta acción eliminará todos los datos asociados y no podrá deshacerse.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Información del cobrador:</strong>
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
              📧 Email: <strong>{selectedCobrador?.email}</strong>
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
              📱 Teléfono: <strong>{selectedCobrador?.phone || 'No especificado'}</strong>
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
              👥 Clientes asignados: <strong>{selectedCobrador?.usedClientQuota || 0}</strong>
            </Typography>
          </Box>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
            Para confirmar, escribe <Chip label="eliminar" size="small" color="error" /> en el campo de abajo:
          </Typography>

          <TextField
            fullWidth
            placeholder='Escribe "eliminar" para confirmar'
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            variant="outlined"
            autoFocus
            error={deleteConfirmText.length > 0 && deleteConfirmText.toLowerCase() !== 'eliminar'}
            helperText={
              deleteConfirmText.length > 0 && deleteConfirmText.toLowerCase() !== 'eliminar'
                ? 'Debes escribir exactamente "eliminar"'
                : ''
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: deleteConfirmText.toLowerCase() === 'eliminar' ? 'success.main' : 'error.main',
                  borderWidth: 2,
                },
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false)
              setSelectedCobrador(null)
              setDeleteConfirmText('')
            }}
            variant="outlined"
            size="large"
            sx={{ borderRadius: 2, minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deleteConfirmText.toLowerCase() !== 'eliminar'}
            variant="contained"
            color="error"
            size="large"
            startIcon={<Delete />}
            sx={{
              borderRadius: 2,
              minWidth: 150,
              background: deleteConfirmText.toLowerCase() === 'eliminar'
                ? 'linear-gradient(135deg, #f44336 0%, #c62828 100%)'
                : undefined,
              '&:hover': {
                background: deleteConfirmText.toLowerCase() === 'eliminar'
                  ? 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)'
                  : undefined,
              },
            }}
          >
            Eliminar Cobrador
          </Button>
        </DialogActions>
      </Dialog>

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

        {/* Wallet History Modal */}
        <WalletHistoryModal
          open={walletHistoryModalOpen}
          onClose={() => setWalletHistoryModalOpen(false)}
        />
      </Box>
    )
  }
