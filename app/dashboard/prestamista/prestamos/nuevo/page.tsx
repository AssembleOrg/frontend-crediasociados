'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert
} from '@mui/material'
import { Add } from '@mui/icons-material'
import { CreateLoanModal } from '@/components/loans/CreateLoanModal'
import { useClients } from '@/hooks/useClients'
import { useRouter } from 'next/navigation'

export default function NuevoPrestamoPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const { clients, isLoading, error } = useClients()
  const router = useRouter()

  // Auto-abrir modal al cargar la página si hay clientes
  useEffect(() => {
    if (!isLoading && clients.length > 0) {
      setModalOpen(true)
    }
  }, [isLoading, clients.length])

  const handleCloseModal = () => {
    setModalOpen(false)
    // Redirigir de vuelta a la lista de préstamos al cerrar
    router.push('/dashboard/prestamista/prestamos')
  }

  // const handleLoanCreated = () => {
  //   // Redirigir a la lista de préstamos después de crear
  //   router.push('/dashboard/prestamista/prestamos')
  // }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Crear Nuevo Préstamo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Genera un nuevo préstamo con simulador de cuotas para tus clientes
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* No clients warning */}
      {!isLoading && clients.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No tienes clientes registrados. Necesitas crear al menos un cliente antes de poder generar préstamos.
        </Alert>
      )}

      {/* Main Content */}
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Simulador de Préstamos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Utiliza el simulador para calcular las cuotas y términos del préstamo antes de confirmarlo.
          Podrás ver todos los pagos calculados y ajustar los parámetros según necesites.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={() => setModalOpen(true)}
          disabled={isLoading || clients.length === 0}
        >
          {isLoading ? 'Cargando...' : 'Abrir Simulador de Préstamos'}
        </Button>

        {clients.length === 0 && !isLoading && (
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
            Primero debes crear clientes en la sección &quot;Clientes&quot;
          </Typography>
        )}
      </Paper>

      {/* Modal */}
      <CreateLoanModal
        open={modalOpen}
        onClose={handleCloseModal}
        title="Simulador de Préstamos"
      />
    </Box>
  )
}