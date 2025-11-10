'use client'

import { Box } from '@mui/material'
import CollectorReportView from '@/components/reports/CollectorReportView'

export default function ReportesPage() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <CollectorReportView />
    </Box>
  )
}
