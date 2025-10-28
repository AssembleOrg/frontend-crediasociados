'use client'

import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material'
import { Search } from '@mui/icons-material'
import { validateQueryForm } from '@/lib/consulta/validators'
import { formatDNI, unformatDNI } from '@/lib/formatters'

interface QueryFormProps {
  onSubmit: (dni: string, loanTrack: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export default function QueryForm({ onSubmit, isLoading, error }: QueryFormProps) {
  const [dni, setDni] = useState('')
  const [loanTrack, setLoanTrack] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const validation = validateQueryForm(unformatDNI(dni), loanTrack)
    if (!validation.isValid) {
      setValidationError(validation.error || 'Datos inválidos')
      return
    }

    await onSubmit(unformatDNI(dni), loanTrack)
  }

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDNI(e.target.value)
    setDni(formatted)
    if (validationError) setValidationError(null)
  }

  const handleLoanTrackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoanTrack(e.target.value.toUpperCase())
    if (validationError) setValidationError(null)
  }

  const displayError = validationError || error

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'grid', gap: 3 }}>
        <TextField
          label="DNI"
          placeholder="Ej: 12.345.678"
          value={dni}
          onChange={handleDniChange}
          fullWidth
          required
          helperText="Formato: XX.XXX.XXX"
          disabled={isLoading}
          inputProps={{ maxLength: 10 }}
        />

        <TextField
          label="Código de Seguimiento"
          placeholder="Ej: CREDITO-2025-00009"
          value={loanTrack}
          onChange={handleLoanTrackChange}
          fullWidth
          required
          helperText="Código proporcionado al momento del préstamo"
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={isLoading ? <CircularProgress size={20} /> : <Search />}
          disabled={isLoading}
          fullWidth
        >
          {isLoading ? 'Consultando...' : 'Consultar Préstamo'}
        </Button>

        {displayError && (
          <Alert severity="error">
            {displayError}
          </Alert>
        )}
      </Box>
    </form>
  )
}