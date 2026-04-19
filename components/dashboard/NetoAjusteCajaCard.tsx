'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Paper, Typography, Box, CircularProgress } from '@mui/material'
import { TrendingUp, DateRange } from '@mui/icons-material'
import { collectorWalletService } from '@/services/collector-wallet.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface WalletData {
  balance: number
  startDate: string
  endDate: string
  hasWithdrawal: boolean
}

const COOLDOWN_MS = 10000

export function NetoAjusteCajaCard() {
  const currentUser = useCurrentUser()
  const [data, setData] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inCooldown, setInCooldown] = useState(false)
  const lastCalculateRef = useRef<number>(0)
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    }
  }, [])

  const handleCalculate = useCallback(async () => {
    const now = Date.now()
    if (now - lastCalculateRef.current < COOLDOWN_MS || isLoading) return

    if (!currentUser?.id) {
      setError('No autenticado')
      return
    }

    lastCalculateRef.current = now
    setIsLoading(true)
    setError(null)

    // Activar cooldown visual
    setInCooldown(true)
    cooldownTimerRef.current = setTimeout(() => setInCooldown(false), COOLDOWN_MS)

    try {
      // Obtener el saldo de la wallet de cobro del cobrador logueado
      console.log('Getting wallet balance')
      // const walletData = await collectorWalletService.getBalanceForUser(currentUser.id)
      // console.log('Wallet data:', walletData)
      const walletBalance = await collectorWalletService.getMyBalance()
      console.log('Wallet balance:', walletBalance)
      const balance = walletBalance.balance ?? 0

      // Obtener el último retiro para calcular el rango de fechas
      const lastWithdrawal = await collectorWalletService.getLastWithdrawal(currentUser.id)

      let startDate: string
      let hasWithdrawal = false

      if (lastWithdrawal?.createdAt) {
        const d = new Date(lastWithdrawal.createdAt)
        if (!isNaN(d.getTime())) {
          startDate = d.toISOString().split('T')[0]
          hasWithdrawal = true
        }
      }

      if (!hasWithdrawal) {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        startDate = d.toISOString().split('T')[0]
      }

      const endDate = new Date().toISOString().split('T')[0]

      setData({ balance, startDate: startDate!, endDate, hasWithdrawal })
    } catch {
      setError('Error al obtener saldo')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.id, isLoading])

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  }

  const isNegative = (data?.balance ?? 0) < 0
  const valueColor = !data ? 'text.secondary' : isNegative ? 'error.main' : 'success.main'
  const isDisabled = isLoading || inCooldown

  return (
    <Paper
      onClick={handleCalculate}
      sx={{
        bgcolor: '#FFFFFF',
        overflow: 'hidden',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: inCooldown && !isLoading ? 0.6 : 1,
        transition: 'all 0.2s',
        '&:hover': isDisabled ? {} : { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ py: 1.5, px: 2, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ color: valueColor, display: 'flex', mr: 1.5 }}>
          {isLoading
            ? <CircularProgress size={20} color="inherit" />
            : <TrendingUp sx={{ fontSize: 20 }} />
          }
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">Neto con Ajuste de Caja</Typography>
          {data && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DateRange sx={{ fontSize: 13 }} />
              {formatDate(data.startDate)} - {formatDate(data.endDate)}
            </Typography>
          )}
        </Box>
        {error ? (
          <Typography variant="caption" color="error.main">{error}</Typography>
        ) : (
          <Typography variant="body1" fontWeight={700} color={valueColor}>
            {isLoading
              ? '...'
              : data
                ? `${isNegative ? '-' : ''}$${Math.abs(data.balance).toLocaleString('es-AR')}`
                : 'Calcular'
            }
          </Typography>
        )}
      </Box>
    </Paper>
  )
}
