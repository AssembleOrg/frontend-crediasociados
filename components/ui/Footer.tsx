'use client';

import { Box, Container, Typography, Link, Divider } from '@mui/material';
import { Logo } from './Logo';

export function Footer() {
  const whatsappMessage = encodeURIComponent(
    'Hola Pistech, me comunico a través de la web de Prestamito, estoy interesado en sus servicios digitales'
  );

  return (
    <Box
      component='footer'
      sx={{
        bgcolor: 'background.paper',
        py: 6,
        mt: 8,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth='md'>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Logo
            width={370}
            height={142}
          />
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link
              href='#'
              color='text.secondary'
              underline='hover'
            >
              Términos de Servicio
            </Link>
            <Link
              href='#'
              color='text.secondary'
              underline='hover'
            >
              Privacidad
            </Link>
            <Link
              href='#'
              color='text.secondary'
              underline='hover'
            >
              Soporte
            </Link>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
          }}
        >
          <Typography
            variant='body2'
            color='text.secondary'
          >
            © {new Date().getFullYear()} Prestamito. Todos los derechos
            reservados.
          </Typography>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ textAlign: { xs: 'center', md: 'right' } }}
          >
            Desarrollado para gestión profesional de préstamos por{' '}
            <Link
              href={`https://wa.me/+5491138207230?text=${whatsappMessage}`}
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Contactar a Pistech por WhatsApp'
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'primary.main',
                },
              }}
            >
              <span>PISTECH</span>
              <span
                role='img'
                aria-label='corazón'
                style={{ color: '#e25555' }}
              >
                ❤️
              </span>
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
