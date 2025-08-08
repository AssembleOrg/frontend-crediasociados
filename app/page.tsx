'use client';

import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Image from 'next/image';
import {
  CheckCircle,
  TrendingUp,
  Security,
  Smartphone,
  Assessment,
  Group,
} from '@mui/icons-material';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { useNavigation } from '@/hooks/useNavigation';

export default function Home() {
  const { navigateToRoute } = useNavigation();

  const features = [
    {
      icon: <TrendingUp color='primary' />,
      title: 'Calculadora Inteligente',
      description:
        'Calcula intereses y cuotas automáticamente. Evita errores y ahorra tiempo en cada operación.',
    },
    {
      icon: <Assessment color='primary' />,
      title: 'Control Total de tu Cartera',
      description:
        'Visualiza todos tus clientes y préstamos en un solo lugar. Identifica rápidamente los pagos vencidos.',
    },
    {
      icon: <Smartphone color='primary' />,
      title: 'Disponible 24/7',
      description:
        'Consulta y gestiona tu negocio desde el celular o computadora, donde estés y cuando lo necesites.',
    },
    {
      icon: <Security color='primary' />,
      title: 'Datos 100% Protegidos',
      description:
        'Tu información y la de tus clientes está segura con encriptación bancaria y backups automáticos.',
    },
  ];

  const benefits = [
    'Controla todos tus préstamos activos en tiempo real',
    'Recibe alertas automáticas de cuotas vencidas',
    'Genera comprobantes y recibos profesionales',
    'Mantén historial completo de cada cliente',
    'Panel personalizado para prestamistas y clientes',
    'Actualización automática del valor del dólar',
  ];

  return (
    <>
      <Navbar />

      <Container maxWidth='lg'>
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 6, md: 10 },
            mb: 8,
          }}
        >
          <Typography
            variant='h1'
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              mb: 3,
              color: 'primary.main',
            }}
          >
            Automatiza tu Negocio
            <br />
            <span style={{ color: '#666' }}>de Préstamos</span>
          </Typography>

          <Typography
            variant='h5'
            sx={{
              mb: 4,
              color: 'text.secondary',
              maxWidth: 650,
              mx: 'auto',
              fontWeight: 300,
            }}
          >
            Software profesional que organiza tu cartera de clientes y optimiza
            tus cobros diarios. Aumenta tu productividad y reduce el riesgo de
            impagos.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant='contained'
              size='large'
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
              onClick={() => navigateToRoute('/login')}
            >
              Comenzar Ahora
            </Button>
            <Button
              variant='outlined'
              size='large'
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              Ver Demo
            </Button>
          </Box>

          <Box
            sx={{
              mt: 4,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Chip
              label='Para Prestamistas Profesionales'
              color='primary'
              variant='outlined'
            />
            <Chip
              label='Acceso desde Cualquier Lugar'
              color='primary'
              variant='outlined'
            />
            <Chip
              label='Prueba Gratis 30 Días'
              color='primary'
              variant='outlined'
            />
          </Box>

          {/* Hero Image - People shaking hands */}
          <Box
            sx={{
              mt: 6,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: { xs: '100%', md: '800px' },
                height: { xs: '280px', md: '450px' },
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 4,
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.3s ease',
                  boxShadow: 6
                }
              }}
            >
              <Image
                src='/handshake.jpg'
                alt='Prestamistas profesionales cerrando acuerdos exitosos'
                fill
                style={{
                  objectFit: 'cover'
                }}
                priority
                sizes='(max-width: 768px) 100vw, 800px'
              />
            </Box>
          </Box>
        </Box>

        {/* Features Section */}
        <Box
          sx={{
            mb: 10,
            bgcolor: 'primary.main',
            py: 8,
            px: 4,
            borderRadius: 3,
            color: 'white',
          }}
        >
          <Typography
            variant='h2'
            textAlign='center'
            sx={{
              mb: 6,
              fontWeight: 600,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: 'white',
            }}
          >
            Todo lo que Necesitas para Crecer
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 4,
            }}
          >
            {features.map((feature, index) => (
              <Card
                sx={{
                  height: '100%',
                  p: 2,
                  bgcolor: 'white',
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
                }}
                key={index}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {feature.icon}
                    <Typography
                      variant='h6'
                      sx={{ ml: 2, fontWeight: 600, color: 'text.primary' }}
                    >
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant='body1'
                    sx={{ color: 'text.secondary' }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Benefits Section */}
        <Box sx={{ mb: 10 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 6,
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography
                variant='h3'
                sx={{ mb: 3, fontWeight: 600 }}
              >
                Multiplica tus Ganancias, Reduce tus Riesgos
              </Typography>
              <Typography
                variant='body1'
                sx={{ mb: 4, fontSize: '1.1rem', color: 'text.secondary' }}
              >
                Con Prestamito automatizas tu operación completa: desde el
                primer contacto con el cliente hasta el último pago. Más
                control, menos tiempo invertido, mejores resultados.
              </Typography>

              <List>
                {benefits.map((benefit, index) => (
                  <ListItem
                    key={index}
                    sx={{ pl: 0 }}
                  >
                    <ListItemIcon>
                      <CheckCircle color='primary' />
                    </ListItemIcon>
                    <ListItemText primary={benefit} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box>
              {/* Team success image */}
              <Box
                sx={{
                  width: '100%',
                  height: { xs: '300px', md: '400px' },
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  mb: 3,
                }}
              >
                <Image
                  src='/group.jpg'
                  alt='Equipo de prestamistas exitosos usando Prestamito'
                  fill
                  style={{
                    objectFit: 'cover',
                    borderRadius: '12px',
                  }}
                />
              </Box>

              {/* User profiles info */}
              <Card
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                }}
              >
                <Group
                  color='primary'
                  sx={{ fontSize: 50, mb: 2 }}
                />
                <Typography
                  variant='h5'
                  sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}
                >
                  Portal para Ti y tus Clientes
                </Typography>
                <Typography
                  variant='body1'
                  sx={{ mb: 3, color: 'text.secondary' }}
                >
                  Dos interfaces diseñadas específicamente para optimizar la
                  relación prestamista-cliente
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    flexWrap: 'wrap',
                    gap: 3,
                  }}
                >
                  <Box sx={{ minWidth: '140px', textAlign: 'center' }}>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}
                    >
                      Panel Prestamista
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                    >
                      Gestiona toda tu operación: clientes, préstamos, cobros y
                      reportes
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: '140px', textAlign: 'center' }}>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}
                    >
                      Portal Cliente
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                    >
                      Tus clientes consultan su estado de cuenta, historial y
                      próximas cuotas
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Box>
          </Box>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
            bgcolor: 'primary.main',
            borderRadius: 3,
            mb: 6,
            boxShadow: 3,
          }}
        >
          <Typography
            variant='h3'
            sx={{
              mb: 2,
              fontWeight: 600,
              color: 'white',
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            ¿Listo para Transformar tu Negocio?
          </Typography>
          <Typography
            variant='h6'
            sx={{
              mb: 4,
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: { xs: '1.1rem', md: '1.25rem' },
            }}
          >
            Únete a cientos de prestamistas que ya aumentaron sus ganancias con
            Prestamito
          </Typography>
          <Button
            variant='contained'
            size='large'
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              bgcolor: 'white',
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
            }}
            onClick={() => navigateToRoute('/login')}
          >
            Contactar
          </Button>
        </Box>
      </Container>

      <Footer />
    </>
  );
}
