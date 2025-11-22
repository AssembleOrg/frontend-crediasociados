'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  alpha,
  useTheme,
  useMediaQuery,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Autocomplete,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
  Stack,
  DialogActions,
  DialogContentText,
  Tooltip
} from '@mui/material'
import { 
  Close, 
  AccountBalance, 
  Add, 
  Remove, 
  Receipt, 
  History,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  AccountBalanceWallet,
  Edit,
  Delete,
  Cancel,
  Save
} from '@mui/icons-material'
import { safeService, type SafeTransaction, type SafeExpense, type SafeTransactionType } from '@/services/safe.service'
import { useUsers } from '@/hooks/useUsers'
import { DateTime } from 'luxon'
import { unformatAmount } from '@/lib/formatters'

interface SafeModalProps {
  open: boolean
  onClose: () => void
  managerId: string | null
  managerName?: string
  onBalanceUpdate?: () => void
  onCloseCallback?: () => void
  onCollectorWalletUpdate?: () => void
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`safe-tabpanel-${index}`}
      aria-labelledby={`safe-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

const formatCurrency = (amount: number) => {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatDate = (dateString: string) => {
  const date = DateTime.fromISO(dateString)
  return date.setLocale('es-AR').toFormat('dd/MM/yyyy HH:mm')
}

export default function SafeModal({ 
  open, 
  onClose, 
  managerId,
  managerName = 'Cobrador',
  onBalanceUpdate,
  onCloseCallback,
  onCollectorWalletUpdate
}: SafeModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { users } = useUsers()
  
  const [currentTab, setCurrentTab] = useState(0)
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Deposit state
  const [depositAmount, setDepositAmount] = useState('')
  const [depositDescription, setDepositDescription] = useState('')
  const [depositing, setDepositing] = useState(false)
  
  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawDescription, setWithdrawDescription] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  
  // Expense Categories state (CRUD - solo nombre)
  const [expenseCategories, setExpenseCategories] = useState<SafeExpense[]>([])
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [editingCategory, setEditingCategory] = useState<SafeExpense | null>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [updatingCategory, setUpdatingCategory] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [deleteCategoryConfirmOpen, setDeleteCategoryConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<SafeExpense | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  // Register Expense state (registrar gasto con monto)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [registeringExpense, setRegisteringExpense] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('') // Para crear categoría al vuelo
  
  // Transfer state
  const [transferAmount, setTransferAmount] = useState('')
  const [transferDescription, setTransferDescription] = useState('')
  const [transferTargetManager, setTransferTargetManager] = useState<string | null>(null)
  const [transferring, setTransferring] = useState(false)
  
  // History state
  const [transactions, setTransactions] = useState<SafeTransaction[]>([])
  const [historyPage, setHistoryPage] = useState(0)
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilterType, setHistoryFilterType] = useState<SafeTransactionType | 'ALL'>('ALL')
  const [historyStartDate, setHistoryStartDate] = useState('')
  const [historyEndDate, setHistoryEndDate] = useState('')

  // Filter managers (prestamistas)
  const managers = useMemo(() => {
    return users.filter(user => user.role === 'prestamista' && user.id !== managerId)
  }, [users, managerId])

  // Helper para obtener el nombre del usuario relacionado en transferencias
  const getRelatedUserName = (transaction: SafeTransaction): string | null => {
    if (!transaction.relatedUserId) return null
    const relatedUser = users.find(u => u.id === transaction.relatedUserId)
    return relatedUser ? relatedUser.fullName : null
  }

  useEffect(() => {
    if (open && managerId) {
      loadBalance()
      loadExpenses()
      if (currentTab === 4) {
        loadHistory()
      }
    } else {
      setBalance(null)
      setError(null)
      setSuccess(null)
      // Reset forms
      setDepositAmount('')
      setDepositDescription('')
      setWithdrawAmount('')
      setWithdrawDescription('')
      // Reset category form
      setCategoryName('')
      setCategoryDescription('')
      setEditingCategory(null)
      setShowCategoryForm(false)
      setCategoryToDelete(null)
      setDeleteCategoryConfirmOpen(false)
      // Reset expense registration form
      setSelectedCategoryId('')
      setExpenseAmount('')
      setExpenseDescription('')
      setNewCategoryName('')
      // Reset transfer form
      setTransferAmount('')
      setTransferDescription('')
      setTransferTargetManager(null)
    }
  }, [open, managerId, currentTab])

  const loadBalance = async () => {
    if (!managerId) return
    setLoading(true)
    setError(null)
    try {
      const data = await safeService.getBalance(managerId)
      setBalance(data.balance)
    } catch (err: any) {
      // Error loading safe balance
      setError(err.response?.data?.message || 'Error al cargar el balance de la caja fuerte')
      setBalance(0)
    } finally {
      setLoading(false)
    }
  }

  const loadExpenses = async () => {
    if (!managerId) return
    try {
      const data = await safeService.getExpenses(managerId)
      setExpenseCategories(data)
    } catch (err) {
      // Error loading expense categories
    }
  }

  const loadHistory = async () => {
    if (!managerId) return
    setHistoryLoading(true)
    try {
      const params: any = {
        page: historyPage + 1,
        limit: historyRowsPerPage
      }
      if (historyFilterType !== 'ALL') {
        params.type = historyFilterType
      }
      if (historyStartDate) {
        params.startDate = historyStartDate
      }
      if (historyEndDate) {
        params.endDate = historyEndDate
      }
      
      const data = await safeService.getHistory(params, managerId)
      setTransactions(data.transactions || [])
      setHistoryTotal(data.meta?.total || 0)
      if (data.currentBalance !== undefined) {
        setBalance(data.currentBalance)
      }
    } catch (err: any) {
      // Error loading history
      setError(err.response?.data?.message || 'Error al cargar el historial')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!managerId) return
    const amount = parseFloat(unformatAmount(depositAmount))
    if (!amount || amount <= 0 || isNaN(amount)) {
      setError('Ingresa un monto válido')
      return
    }
    if (!depositDescription.trim()) {
      setError('Ingresa una descripción')
      return
    }

    setDepositing(true)
    setError(null)
    try {
      const result = await safeService.deposit(amount, depositDescription, managerId)
      // Actualizar balance inmediatamente desde la respuesta
      if (result.balanceAfter !== undefined) {
        setBalance(result.balanceAfter)
      }
      setSuccess('Depósito realizado exitosamente')
      setDepositAmount('')
      setDepositDescription('')
      onBalanceUpdate?.()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al realizar el depósito')
    } finally {
      setDepositing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!managerId) return
    const amount = parseFloat(unformatAmount(withdrawAmount))
    if (!amount || amount <= 0 || isNaN(amount)) {
      setError('Ingresa un monto válido')
      return
    }
    if (!withdrawDescription.trim()) {
      setError('Ingresa una descripción')
      return
    }

    setWithdrawing(true)
    setError(null)
    try {
      const result = await safeService.withdraw(amount, withdrawDescription, managerId)
      // Actualizar balance inmediatamente desde la respuesta
      if (result.balanceAfter !== undefined) {
        setBalance(result.balanceAfter)
      }
      setSuccess('Retiro realizado exitosamente')
      setWithdrawAmount('')
      setWithdrawDescription('')
      onBalanceUpdate?.()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al realizar el retiro')
    } finally {
      setWithdrawing(false)
    }
  }

  // CRUD de Categorías (solo nombre, sin precio)
  const handleCreateCategory = async () => {
    if (!managerId) return
    if (!categoryName.trim()) {
      setError('Ingresa un nombre para la categoría')
      return
    }

    setCreatingCategory(true)
    setError(null)
    try {
      // Crear categoría sin monto (solo nombre y descripción)
      await safeService.createExpenseCategory(categoryName, categoryDescription || undefined, managerId)
      
      setSuccess('Categoría creada exitosamente')
      setCategoryName('')
      setCategoryDescription('')
      setShowCategoryForm(false)
      await loadExpenses()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la categoría')
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleEditCategory = (category: SafeExpense) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryDescription(category.description || '')
    setShowCategoryForm(true)
  }

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null)
    setCategoryName('')
    setCategoryDescription('')
    setShowCategoryForm(false)
  }

  const handleUpdateCategory = async () => {
    if (!managerId || !editingCategory) return
    
    if (!categoryName.trim()) {
      setError('Ingresa un nombre para la categoría')
      return
    }

    setUpdatingCategory(true)
    setError(null)
    try {
      // Solo actualizamos nombre y descripción, NO enviamos amount
      const updates: {
        name?: string
        description?: string
      } = {}
      if (categoryName !== editingCategory.name) updates.name = categoryName
      if (categoryDescription !== (editingCategory.description || '')) {
        updates.description = categoryDescription || undefined
      }

      await safeService.updateExpense(editingCategory.id, updates, managerId)
      setSuccess('Categoría actualizada exitosamente')
      await loadExpenses()
      handleCancelCategoryEdit()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar la categoría')
    } finally {
      setUpdatingCategory(false)
    }
  }

  const handleDeleteCategoryClick = (category: SafeExpense) => {
    setCategoryToDelete(category)
    setDeleteCategoryConfirmOpen(true)
  }

  const handleDeleteCategoryConfirm = async () => {
    if (!managerId || !categoryToDelete) return

    setDeletingCategoryId(categoryToDelete.id)
    setError(null)
    try {
      await safeService.deleteExpense(categoryToDelete.id, managerId)
      setSuccess('Categoría eliminada exitosamente')
      await loadExpenses()
      setDeleteCategoryConfirmOpen(false)
      setCategoryToDelete(null)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar la categoría')
    } finally {
      setDeletingCategoryId(null)
    }
  }

  // Registrar Gasto (con monto, genera transacción)
  const handleRegisterExpense = async () => {
    if (!managerId) return
    
    const amount = parseFloat(unformatAmount(expenseAmount))
    const categoryNameToUse = selectedCategoryId 
      ? expenseCategories.find(c => c.id === selectedCategoryId)?.name || ''
      : newCategoryName.trim()

    if (!categoryNameToUse) {
      setError('Selecciona una categoría o ingresa un nombre para crear una nueva')
      return
    }
    if (!amount || amount <= 0 || isNaN(amount)) {
      setError('Ingresa un monto válido')
      return
    }
    // Solo validar descripción si NO hay categoría seleccionada (creando nueva categoría)
    if (!selectedCategoryId && !expenseDescription.trim()) {
      setError('Ingresa una descripción')
      return
    }

    setRegisteringExpense(true)
    setError(null)
    try {
      // Si hay una categoría seleccionada, usar su nombre y su descripción guardada
      // Si no, crear nueva categoría con el nombre ingresado y la descripción del usuario
      const nameToUse = selectedCategoryId 
        ? expenseCategories.find(c => c.id === selectedCategoryId)!.name
        : newCategoryName.trim()

      // Si hay categoría seleccionada, usar su descripción guardada
      // Si no, usar la descripción ingresada por el usuario
      const descriptionToUse = selectedCategoryId
        ? expenseCategories.find(c => c.id === selectedCategoryId)?.description || undefined
        : expenseDescription.trim() || undefined

      const result = await safeService.createExpense(nameToUse, amount, descriptionToUse, managerId)
      // Actualizar balance inmediatamente desde la respuesta
      if (result.transaction?.balanceAfter !== undefined) {
        setBalance(result.transaction.balanceAfter)
      }
      setSuccess('Gasto registrado exitosamente')
      setSelectedCategoryId('')
      setExpenseAmount('')
      setExpenseDescription('')
      setNewCategoryName('')
      await loadExpenses()
      onBalanceUpdate?.()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar el gasto')
    } finally {
      setRegisteringExpense(false)
    }
  }

  const handleTransferToCollector = async () => {
    if (!managerId) return
    const amount = parseFloat(unformatAmount(transferAmount))
    if (!amount || amount <= 0 || isNaN(amount)) {
      setError('Ingresa un monto válido')
      return
    }
    if (!transferDescription.trim()) {
      setError('Ingresa una descripción')
      return
    }

    setTransferring(true)
    setError(null)
    try {
      const result = await safeService.transferToCollector(amount, transferDescription, managerId)
      // Actualizar balance inmediatamente desde la respuesta
      if (result.balanceAfter !== undefined) {
        setBalance(result.balanceAfter)
      }
      setSuccess('Transferencia realizada exitosamente')
      setTransferAmount('')
      setTransferDescription('')
      onBalanceUpdate?.()
      // Refetch del balance de la wallet de cobros
      onCollectorWalletUpdate?.()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al realizar la transferencia')
    } finally {
      setTransferring(false)
    }
  }

  const handleTransferBetweenSafes = async () => {
    if (!managerId || !transferTargetManager) return
    const amount = parseFloat(unformatAmount(transferAmount))
    if (!amount || amount <= 0 || isNaN(amount)) {
      setError('Ingresa un monto válido')
      return
    }
    if (!transferDescription.trim()) {
      setError('Ingresa una descripción')
      return
    }

    setTransferring(true)
    setError(null)
    try {
      const result = await safeService.transferBetweenSafes(transferTargetManager, amount, transferDescription, managerId)
      // Actualizar balance inmediatamente desde la respuesta (fromTransaction es para la caja fuerte de origen)
      if (result.fromTransaction?.balanceAfter !== undefined) {
        setBalance(result.fromTransaction.balanceAfter)
      }
      setSuccess('Transferencia realizada exitosamente')
      setTransferAmount('')
      setTransferDescription('')
      setTransferTargetManager(null)
      onBalanceUpdate?.()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al realizar la transferencia')
    } finally {
      setTransferring(false)
    }
  }

  const handleHistoryPageChange = (_event: unknown, newPage: number) => {
    setHistoryPage(newPage)
  }

  const handleHistoryRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHistoryRowsPerPage(parseInt(event.target.value, 10))
    setHistoryPage(0)
  }

  // Cargar historial cuando se cambia a la pestaña de historial
  useEffect(() => {
    if (open && managerId && currentTab === 4) {
      loadHistory()
    }
  }, [currentTab, open, managerId])

  // Recargar historial cuando cambian los filtros o paginación
  useEffect(() => {
    if (open && managerId && currentTab === 4) {
      loadHistory()
    }
  }, [historyPage, historyRowsPerPage, historyFilterType, historyStartDate, historyEndDate])

  const getTransactionLabel = (type: SafeTransactionType, transaction?: SafeTransaction): string => {
    switch (type) {
      case 'DEPOSIT':
        return 'Depósito'
      case 'WITHDRAWAL':
        return 'Retiro'
      case 'EXPENSE':
        return 'Gasto'
      case 'TRANSFER_TO_COLLECTOR':
        return 'Transferencia a Wallet'
      case 'TRANSFER_FROM_COLLECTOR':
        return 'Retiro desde Wallet'
      case 'TRANSFER_TO_SAFE':
        if (transaction) {
          const userName = getRelatedUserName(transaction)
          return userName ? `Transferencia a ${userName}` : 'Transferencia a Caja Fuerte'
        }
        return 'Transferencia a Caja Fuerte'
      case 'TRANSFER_FROM_SAFE':
        if (transaction) {
          const userName = getRelatedUserName(transaction)
          return userName ? `Recibido de ${userName}` : 'Transferencia desde Caja Fuerte'
        }
        return 'Transferencia desde Caja Fuerte'
      default:
        return type
    }
  }

  const getTransactionColor = (type: SafeTransactionType): string => {
    switch (type) {
      case 'DEPOSIT':
      case 'TRANSFER_FROM_COLLECTOR':
      case 'TRANSFER_FROM_SAFE':
        return theme.palette.success.main
      case 'WITHDRAWAL':
      case 'EXPENSE':
      case 'TRANSFER_TO_COLLECTOR':
      case 'TRANSFER_TO_SAFE':
        return theme.palette.error.main
      default:
        return theme.palette.text.secondary
    }
  }

  const getTransactionIcon = (type: SafeTransactionType) => {
    switch (type) {
      case 'DEPOSIT':
      case 'TRANSFER_FROM_COLLECTOR':
      case 'TRANSFER_FROM_SAFE':
        return <TrendingUp />
      case 'WITHDRAWAL':
      case 'EXPENSE':
      case 'TRANSFER_TO_COLLECTOR':
      case 'TRANSFER_TO_SAFE':
        return <TrendingDown />
      default:
        return <SwapHoriz />
    }
  }

  const isPositiveTransaction = (type: SafeTransactionType): boolean => {
    return type === 'DEPOSIT' || type === 'TRANSFER_FROM_COLLECTOR' || type === 'TRANSFER_FROM_SAFE'
  }

  const formatAmount = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (!numbers) return ''
    const num = parseInt(numbers, 10)
    return num.toLocaleString('es-AR')
  }

  const handleClose = () => {
    onClose()
    // Llamar callback para refetch del balance después de cerrar
    if (onCloseCallback) {
      onCloseCallback()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100vh' : '90vh',
          m: { xs: 0, sm: 2 },
          mt: { xs: 0, sm: 3 }
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2,
        pt: 3,
        px: 3,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountBalance sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" component="div" fontWeight={600}>
              Caja Fuerte - {managerName}
            </Typography>
            <Typography variant="caption" component="div" sx={{ opacity: 0.9, display: 'block', mt: 0.5 }}>
              Gestión de fondos y gastos
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{ 
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
        {/* Balance Display */}
        {loading && balance === null ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 2,
              textAlign: 'center',
              mt: 2
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
              Saldo Actual
            </Typography>
            <Typography 
              variant="h3" 
              fontWeight={700}
              color={balance !== null && balance < 0 ? 'error.main' : 'primary.main'}
            >
              {balance !== null ? formatCurrency(balance) : '$0'}
            </Typography>
            {balance !== null && balance < 0 && (
              <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
                Saldo negativo permitido
              </Typography>
            )}
          </Paper>
        )}

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: isMobile ? 64 : 48,
                fontSize: isMobile ? '0.875rem' : '0.875rem',
                fontWeight: 600,
                textTransform: 'none',
                px: isMobile ? 2 : 1.5,
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              }
            }}
          >
            <Tab label="Depositar" icon={<Add />} iconPosition="start" />
            <Tab label="Retirar" icon={<Remove />} iconPosition="start" />
            <Tab label="Gastos" icon={<Receipt />} iconPosition="start" />
            <Tab label="Transferir" icon={<SwapHoriz />} iconPosition="start" />
            <Tab label="Historial" icon={<History />} iconPosition="start" />
          </Tabs>
          {/* Indicador de página para mobile */}
          {isMobile && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: 1, 
              mt: 1.5,
              pb: 1
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {currentTab + 1} de 5
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: currentTab === index ? 'primary.main' : alpha(theme.palette.primary.main, 0.3),
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Deposit Tab */}
        <TabPanel value={currentTab} index={0}>
          <Stack spacing={3}>
            <TextField
              label="Monto"
              type="text"
              fullWidth
              value={depositAmount}
              onChange={(e) => setDepositAmount(formatAmount(e.target.value))}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
              placeholder="0"
            />
            <TextField
              label="Descripción"
              fullWidth
              required
              multiline
              rows={3}
              value={depositDescription}
              onChange={(e) => setDepositDescription(e.target.value)}
              placeholder="Descripción del depósito..."
              helperText="Campo obligatorio"
            />
            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              onClick={handleDeposit}
              disabled={depositing || !depositAmount || !depositDescription.trim()}
              startIcon={depositing ? <CircularProgress size={20} /> : <Add />}
            >
              {depositing ? 'Depositando...' : 'Depositar'}
            </Button>
          </Stack>
        </TabPanel>

        {/* Withdraw Tab */}
        <TabPanel value={currentTab} index={1}>
          <Stack spacing={3}>
            <TextField
              label="Monto"
              type="text"
              fullWidth
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(formatAmount(e.target.value))}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
              placeholder="0"
            />
            <TextField
              label="Descripción"
              fullWidth
              required
              multiline
              rows={3}
              value={withdrawDescription}
              onChange={(e) => setWithdrawDescription(e.target.value)}
              placeholder="Descripción del retiro..."
              helperText="Campo obligatorio"
            />
            <Button
              variant="contained"
              color="error"
              fullWidth
              size="large"
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAmount || !withdrawDescription.trim()}
              startIcon={withdrawing ? <CircularProgress size={20} /> : <Remove />}
            >
              {withdrawing ? 'Retirando...' : 'Retirar'}
            </Button>
          </Stack>
        </TabPanel>

        {/* Expense Tab */}
        <TabPanel value={currentTab} index={2}>
          <Stack spacing={4}>
            {/* Sección 1: Registrar Gasto (similar a retiro) */}
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                Registrar Gasto
              </Typography>
              <Paper elevation={1} sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel id="category-select-label" shrink={true}>Categoría</InputLabel>
                    <Select
                      labelId="category-select-label"
                      value={selectedCategoryId || ''}
                      onChange={(e) => {
                        setSelectedCategoryId(e.target.value)
                        setNewCategoryName('')
                        // Limpiar descripción cuando se selecciona una categoría
                        if (e.target.value) {
                          setExpenseDescription('')
                        }
                      }}
                      label="Categoría"
                      displayEmpty
                      notched
                      sx={{
                        '& .MuiSelect-select': {
                          display: 'flex',
                          alignItems: 'center',
                        }
                      }}
                      renderValue={(selected) => {
                        if (!selected || selected === '') {
                          return (
                            <Typography 
                              component="span" 
                              sx={{ 
                                color: 'text.secondary', 
                                fontStyle: 'italic',
                                opacity: 0.7
                              }}
                            >
                              Crear nueva categoría
                            </Typography>
                          )
                        }
                        const category = expenseCategories.find(c => c.id === selected)
                        return category ? category.name : ''
                      }}
                    >
                      <MenuItem value="">
                        <em>Crear nueva categoría</em>
                      </MenuItem>
                      {expenseCategories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {!selectedCategoryId && (
                    <TextField
                      label="Nombre de Nueva Categoría"
                      fullWidth
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ej: Combustible, Viáticos, etc."
                      helperText="Se creará una nueva categoría al registrar el gasto"
                    />
                  )}

                  <TextField
                    label="Monto"
                    type="text"
                    fullWidth
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(formatAmount(e.target.value))}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                    }}
                    placeholder="0"
                    required
                  />
                  {!selectedCategoryId && (
                    <TextField
                      label="Descripción"
                      fullWidth
                      required
                      multiline
                      rows={2}
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      placeholder="Descripción del gasto..."
                      helperText="Campo obligatorio"
                    />
                  )}
                  <Button
                    variant="contained"
                    color="warning"
                    fullWidth
                    size="large"
                    onClick={handleRegisterExpense}
                    disabled={
                      registeringExpense || 
                      !expenseAmount || 
                      (!selectedCategoryId && (!newCategoryName.trim() || !expenseDescription.trim()))
                    }
                    startIcon={registeringExpense ? <CircularProgress size={20} /> : <Receipt />}
                  >
                    {registeringExpense ? 'Registrando...' : 'Registrar Gasto'}
                  </Button>
                </Stack>
              </Paper>
            </Box>

            <Divider />

            {/* Sección 2: CRUD de Categorías */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Categorías de Gastos
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => {
                    handleCancelCategoryEdit()
                    setShowCategoryForm(true)
                  }}
                  disabled={showCategoryForm && !editingCategory}
                >
                  Nueva Categoría
                </Button>
              </Box>

              {/* Create/Edit Category Form */}
              {showCategoryForm && (
                <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <TextField
                      label="Nombre de la Categoría"
                      fullWidth
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="Ej: Combustible, Viáticos, etc."
                      required
                    />
                    <TextField
                      label="Descripción (opcional)"
                      fullWidth
                      multiline
                      rows={2}
                      value={categoryDescription}
                      onChange={(e) => setCategoryDescription(e.target.value)}
                      placeholder="Descripción de la categoría..."
                    />
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                        disabled={
                          (editingCategory ? updatingCategory : creatingCategory) || 
                          !categoryName.trim()
                        }
                        startIcon={
                          (editingCategory ? updatingCategory : creatingCategory) ? (
                            <CircularProgress size={20} />
                          ) : editingCategory ? (
                            <Save />
                          ) : (
                            <Add />
                          )
                        }
                      >
                        {editingCategory 
                          ? (updatingCategory ? 'Actualizando...' : 'Guardar Cambios')
                          : (creatingCategory ? 'Creando...' : 'Crear Categoría')
                        }
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleCancelCategoryEdit}
                        startIcon={<Cancel />}
                      >
                        Cancelar
                      </Button>
                    </Box>
                  </Stack>
                </Paper>
              )}

              {/* Categories Table */}
              {expenseCategories.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Receipt sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No hay categorías guardadas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crea tu primera categoría para organizar tus gastos
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenseCategories.map((category) => (
                        <TableRow key={category.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {category.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {category.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Editar" arrow>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditCategory(category)}
                                  disabled={showCategoryForm && editingCategory?.id !== category.id}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar" arrow>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteCategoryClick(category)}
                                  disabled={deletingCategoryId === category.id}
                                >
                                  {deletingCategoryId === category.id ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <Delete fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Stack>
        </TabPanel>

        {/* Transfer Tab */}
        <TabPanel value={currentTab} index={3}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Transferencia</InputLabel>
              <Select
                value={transferTargetManager === null ? 'collector' : 'safe'}
                onChange={(e) => {
                  if (e.target.value === 'collector') {
                    setTransferTargetManager(null)
                  } else {
                    // Set to empty string to show the manager selector
                    setTransferTargetManager('')
                  }
                  setTransferAmount('')
                  setTransferDescription('')
                }}
                label="Tipo de Transferencia"
              >
                <MenuItem value="collector">A Wallet de Cobros</MenuItem>
                <MenuItem value="safe">A Otra Caja Fuerte</MenuItem>
              </Select>
            </FormControl>
            
            {transferTargetManager !== null && (
              <FormControl fullWidth>
                <InputLabel>Manager Destino</InputLabel>
                <Select
                  value={transferTargetManager || ''}
                  onChange={(e) => setTransferTargetManager(e.target.value)}
                  label="Manager Destino"
                  error={transferTargetManager === ''}
                >
                  {managers.length === 0 ? (
                    <MenuItem disabled>No hay managers disponibles</MenuItem>
                  ) : (
                    managers.map((manager) => (
                      <MenuItem key={manager.id} value={manager.id}>
                        {manager.fullName} ({manager.email})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Monto"
              type="text"
              fullWidth
              value={transferAmount}
              onChange={(e) => setTransferAmount(formatAmount(e.target.value))}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
              placeholder="0"
            />
            <TextField
              label="Descripción"
              fullWidth
              required
              multiline
              rows={3}
              value={transferDescription}
              onChange={(e) => setTransferDescription(e.target.value)}
              placeholder="Descripción de la transferencia..."
              helperText="Campo obligatorio"
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={transferTargetManager === null ? handleTransferToCollector : handleTransferBetweenSafes}
              disabled={
                transferring || 
                !transferAmount || 
                !transferDescription.trim() || 
                (transferTargetManager !== null && (!transferTargetManager || transferTargetManager === ''))
              }
              startIcon={transferring ? <CircularProgress size={20} /> : <SwapHoriz />}
            >
              {transferring ? 'Transferiendo...' : 'Transferir'}
            </Button>
          </Stack>
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={currentTab} index={4}>
          <Stack spacing={3}>
            {/* Filters */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap' }}>
              <FormControl fullWidth size="small" sx={{ minWidth: { xs: '100%', sm: '200px' }, maxWidth: { sm: '300px' } }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={historyFilterType}
                  onChange={(e) => setHistoryFilterType(e.target.value as SafeTransactionType | 'ALL')}
                  label="Tipo"
                >
                  <MenuItem value="ALL">Todos</MenuItem>
                  <MenuItem value="DEPOSIT">Depósito</MenuItem>
                  <MenuItem value="WITHDRAWAL">Retiro</MenuItem>
                  <MenuItem value="EXPENSE">Gasto</MenuItem>
                  <MenuItem value="TRANSFER_TO_COLLECTOR">Transferencia a Wallet</MenuItem>
                  <MenuItem value="TRANSFER_FROM_COLLECTOR">Retiro desde Wallet de Cobros</MenuItem>
                  <MenuItem value="TRANSFER_TO_SAFE">Transferencia a Caja Fuerte</MenuItem>
                  <MenuItem value="TRANSFER_FROM_SAFE">Transferencia desde Caja Fuerte</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Fecha Inicio"
                type="date"
                size="small"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: { xs: '100%', sm: '200px' }, maxWidth: { sm: '300px' } }}
              />
              <TextField
                label="Fecha Fin"
                type="date"
                size="small"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: { xs: '100%', sm: '200px' }, maxWidth: { sm: '300px' } }}
              />
            </Box>

            {/* Transactions Table */}
            {historyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : transactions.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <History sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No hay transacciones registradas
                </Typography>
              </Paper>
            ) : (
              <>
                <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Monto</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Saldo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(transaction.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getTransactionIcon(transaction.type)}
                              label={getTransactionLabel(transaction.type, transaction)}
                              size="small"
                              sx={{
                                bgcolor: alpha(getTransactionColor(transaction.type), 0.1),
                                color: getTransactionColor(transaction.type),
                                fontWeight: 600
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              color={isPositiveTransaction(transaction.type) ? 'success.main' : 'error.main'}
                            >
                              {isPositiveTransaction(transaction.type) ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              {transaction.type === 'EXPENSE' && transaction.expense?.name && (
                                <Typography variant="body2" fontWeight={600} color="primary.main" gutterBottom>
                                  {transaction.expense.name}
                                </Typography>
                              )}
                              {(transaction.type === 'TRANSFER_TO_SAFE' || transaction.type === 'TRANSFER_FROM_SAFE') && (
                                <Typography variant="body2" fontWeight={600} color="info.main" gutterBottom>
                                  {transaction.type === 'TRANSFER_TO_SAFE' 
                                    ? `A: ${getRelatedUserName(transaction) || 'Usuario desconocido'}`
                                    : `De: ${getRelatedUserName(transaction) || 'Usuario desconocido'}`
                                  }
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                {transaction.description}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2"
                              color={transaction.balanceAfter < 0 ? 'error.main' : 'text.primary'}
                              fontWeight={500}
                            >
                              {formatCurrency(transaction.balanceAfter)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={historyTotal}
                  page={historyPage}
                  onPageChange={handleHistoryPageChange}
                  rowsPerPage={historyRowsPerPage}
                  onRowsPerPageChange={handleHistoryRowsPerPageChange}
                  rowsPerPageOptions={[10, 25, 50]}
                  labelRowsPerPage="Filas por página:"
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                  }
                />
              </>
            )}
          </Stack>
        </TabPanel>
      </DialogContent>

      {/* Delete Category Confirmation Dialog */}
      <Dialog
        open={deleteCategoryConfirmOpen}
        onClose={() => {
          setDeleteCategoryConfirmOpen(false)
          setCategoryToDelete(null)
        }}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar la categoría <strong>"{categoryToDelete?.name}"</strong>?
            <br />
            <Typography variant="caption" color="text.secondary" component="span">
              Esta acción solo elimina la categoría. Las transacciones históricas de gastos permanecerán intactas.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteCategoryConfirmOpen(false)
              setCategoryToDelete(null)
            }}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteCategoryConfirm}
            color="error"
            variant="contained"
            disabled={deletingCategoryId !== null}
            startIcon={deletingCategoryId ? <CircularProgress size={16} /> : <Delete />}
          >
            {deletingCategoryId ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

