'use client'

import React, { useState } from 'react'
import { Box, Alert } from '@mui/material'
import { Add } from '@mui/icons-material'
import PageHeader from '@/components/ui/PageHeader'
import TransaccionesTable from '@/components/operativa/TransaccionesTable'
import CreateTransaccionModal, {
  type TransaccionFormData
} from '@/components/operativa/CreateTransaccionModal'
import { useOperativa } from '@/hooks/useOperativa'

export default function OperativoManagerPage() {
  const {
    transacciones,
    isLoading,
    error,
    createIngreso,
    createEgreso,
    deleteTransaccion
  } = useOperativa()

  const [modalOpen, setModalOpen] = useState(false)

  const handleSubmit = async (data: TransaccionFormData): Promise<boolean> => {
    try {
      if (data.tipo === 'ingreso') {
        const result = await createIngreso({
          subTipo: data.subTipo,
          amount: data.amount,
          descripcion: data.descripcion,
          fecha: data.fecha
        } as Parameters<typeof createIngreso>[0])
        if (result) {
          setModalOpen(false)
          return true
        }
        return false
      } else {
        const result = await createEgreso({
          subTipo: data.subTipo,
          amount: data.amount,
          descripcion: data.descripcion,
          fecha: data.fecha,
          receiptUrl: data.receiptUrl
        } as Parameters<typeof createEgreso>[0])
        if (result) {
          setModalOpen(false)
          return true
        }
        return false
      }
    } catch (err) {
      // Error creating transaction
      return false
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta transacción?')) {
      await deleteTransaccion(id)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Operativa"
        subtitle="Registro de ingresos y egresos operativos"
        actions={[
          {
            label: 'Nueva Transacción',
            onClick: () => setModalOpen(true),
            variant: 'contained',
            startIcon: <Add />
          }
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TransaccionesTable
        transacciones={transacciones}
        isLoading={isLoading}
        onDelete={handleDelete}
        showActions={true}
      />

      <CreateTransaccionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </Box>
  )
}
