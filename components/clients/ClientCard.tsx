'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button
} from '@mui/material'
import {
  Edit,
  Delete,
  Person,
  Email,
  Phone,
  Badge
} from '@mui/icons-material'
import type { Client } from '@/types/auth'

interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const getStatusChip = () => {
    // Assuming client has an active status based on business logic
    const isActive = client.id && !('deletedAt' in client && client.deletedAt) // Simple active logic

    return (
      <Chip
        label={isActive ? "Activo" : "Inactivo"}
        color={isActive ? "success" : "default"}
        size="small"
        variant="outlined"
      />
    )
  }

  return (
    <Card
      sx={{
        mb: 2,
        '&:hover': {
          transform: 'scale(1.01)',
          boxShadow: 3,
        },
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <CardContent>
        {/* Header: Nombre + Estado */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person color="primary" fontSize="small" />
            <Typography variant="h6" component="h3" fontWeight="bold">
              {client.fullName || 'Sin nombre'}
            </Typography>
          </Box>
          {getStatusChip()}
        </Box>

        {/* Cliente Info Grid */}
        <Box sx={{ display: 'grid', gap: 1.5, mb: 3 }}>
          {client.dni && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                <strong>DNI:</strong> {client.dni}
              </Typography>
            </Box>
          )}

          {client.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                <strong>Email:</strong> {client.email}
              </Typography>
            </Box>
          )}

          {client.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                <strong>Teléfono:</strong> {client.phone}
              </Typography>
            </Box>
          )}

          {client.cuit && (
            <Typography variant="body2" color="text.secondary">
              <strong>CUIT:</strong> {client.cuit}
            </Typography>
          )}
        </Box>

        {/* Actions: Touch-friendly buttons */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          pt: 1,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<Edit />}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(client)
            }}
            sx={{
              flex: 1,
              minHeight: 44, // Touch target minimum
              borderRadius: 2
            }}
          >
            Editar
          </Button>

          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<Delete />}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(client)
            }}
            sx={{
              flex: 1,
              minHeight: 44, // Touch target minimum
              borderRadius: 2
            }}
          >
            Eliminar
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}