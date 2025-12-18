'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material'
import { TrendingUp, DateRange } from '@mui/icons-material'
import { collectorWalletService } from '@/services/collector-wallet.service'
import { collectorReportService } from '@/services/collector-report.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface NetoData {
  neto: number
  startDate: string
  endDate: string
  hasWithdrawal: boolean
}

const COOLDOWN_MS = 10000

export function NetoAjusteCajaCard() {
  const currentUser = useCurrentUser()
  const [data, setData] = useState<NetoData | null>(null)
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
      const report = await collectorReportService.getPeriodReport(startDate, endDate)
      const neto = report.neto ?? report.summary?.neto ?? 0

      setData({ neto, startDate, endDate, hasWithdrawal })
    } catch {
      setError('Error al calcular')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.id, isLoading])

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  }

  const isNegative = (data?.neto ?? 0) < 0

  // Colores más naturales
  const getBackground = () => {
    if (!data) return '#546e7a' // gris azulado neutro
    if (isNegative) return '#c62828' // rojo
    return '#1565c0' // azul
  }

  const isDisabled = isLoading || inCooldown

  return (
    <Card
      onClick={handleCalculate}
      sx={{
        borderRadius: 3,
        bgcolor: getBackground(),
        color: 'white',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: inCooldown && !isLoading ? 0.7 : 1,
        transition: 'all 0.2s',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        '&:hover': isDisabled ? {} : {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.9 }}>
            Neto con Ajuste de Caja
          </Typography>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.2)',
          }}>
            {isLoading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              <TrendingUp sx={{ fontSize: 28 }} />
            )}
          </Box>
        </Box>

        {error ? (
          <Typography variant="body2" sx={{ color: '#ffcdd2' }}>{error}</Typography>
        ) : data ? (
          <>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {isNegative && '-'}${Math.abs(data.neto).toLocaleString('es-AR')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DateRange sx={{ fontSize: 16 }} />
              {formatDate(data.startDate)} - {formatDate(data.endDate)}
            </Typography>
          </>
        ) : (
          <Typography variant="h4" sx={{ fontWeight: 700, opacity: 0.6 }}>
            {isLoading ? 'Calculando...' : 'Toca para calcular'}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
