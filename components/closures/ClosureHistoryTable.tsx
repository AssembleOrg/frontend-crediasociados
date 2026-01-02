'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material'
import { Visibility } from '@mui/icons-material'
import { formatAmount, formatCurrencyDisplay } from '@/lib/formatters'
import { dailyClosuresService } from '@/services/daily-closures.service'
import type { DailyClosure } from '@/types/daily-closures'

interface ClosureHistoryTableProps {
  refreshTrigger?: number
  onViewDetail?: (closure: DailyClosure) => void
}

export const ClosureHistoryTable: React.FC<ClosureHistoryTableProps> = ({
  refreshTrigger = 0,
  onViewDetail
}) => {
  const [closures, setClosures] = useState<DailyClosure[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const fetchClosures = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await dailyClosuresService.getMyClosure({
        page: page + 1,
        limit: rowsPerPage
      })
      setClosures(response?.data || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar cierres'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClosures()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, page, rowsPerPage])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (isLoading && closures.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (closures.length === 0) {
    return (
      <Alert severity="info">
        No hay cierres del día registrados aún
      </Alert>
    )
  }

  return (
    <Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell align="right"><strong>Cobrado</strong></TableCell>
              <TableCell align="right"><strong>Gastos</strong></TableCell>
              <TableCell align="right"><strong>Neto</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {closures.map((closure) => {
              const totalExpenses = closure.expenses.reduce((sum, e) => sum + e.amount, 0)
              const netAmount = closure.totalCollected - totalExpenses

              return (
                <TableRow key={closure.id} hover>
                  <TableCell>
                    {new Date(closure.closureDate).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {formatCurrencyDisplay(closure.totalCollected)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                    -{formatCurrencyDisplay(totalExpenses)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: netAmount >= 0 ? 'primary.main' : 'error.main', fontWeight: 600 }}>
                    {formatCurrencyDisplay(netAmount)}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => onViewDetail?.(closure)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={closures.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Registros por página:"
        sx={{ mt: 2 }}
      />
    </Box>
  )
}

export default ClosureHistoryTable
