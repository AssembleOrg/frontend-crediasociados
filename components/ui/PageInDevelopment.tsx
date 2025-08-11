'use client'

import { Box, Container, Typography, Button, Paper } from '@mui/material'
import { Construction, ArrowBack } from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface PageInDevelopmentProps {
  title?: string
  description?: string
  showBackButton?: boolean
}

export default function PageInDevelopment({ 
  title = "Página en Desarrollo",
  description = "Esta funcionalidad estará disponible próximamente.",
  showBackButton = true 
}: PageInDevelopmentProps) {
  const router = useRouter()

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper 
        elevation={0}
        sx={{ 
          textAlign: 'center', 
          py: 8, 
          px: 4,
          border: '2px dashed',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Construction 
          sx={{ 
            fontSize: 80, 
            color: 'primary.main', 
            mb: 3 
          }} 
        />
        
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            color: 'text.primary',
            mb: 2
          }}
        >
          {title}
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
        >
          {description}
        </Typography>

        {showBackButton && (
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{ mt: 2 }}
          >
            Volver
          </Button>
        )}
      </Paper>
    </Container>
  )
}