'use client';

import { Box, Typography, CircularProgress, Chip } from '@mui/material';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Wifi,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useDolarBlue } from '@/hooks/useDolarBlue';

interface DolarBlueTickerProps {
  showRefreshButton?: boolean;
  className?: string;
}

export default function DolarBlueTicker({
  showRefreshButton = false,
  className,
}: DolarBlueTickerProps) {
  const { displayData, isLoading, error, refresh, isCacheValid } =
    useDolarBlue();

  // Estado de loading con skeleton inmediato
  if (isLoading && !displayData) {
    return (
      <Box
        sx={{
          background: 'linear-gradient(90deg, #0d1421 0%, #1a1a1a 100%)',
          color: '#e0e0e0',
          py: 1.5,
          px: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          position: 'relative',
          width: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          borderBottom: '2px solid rgba(76, 175, 80, 0.3)',
        }}
        className={className}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 4,
            whiteSpace: 'nowrap',
            animation: 'seamless-marquee 15s linear infinite',
            '@keyframes seamless-marquee': {
              '0%': { transform: 'translateX(100%)' },
              '100%': { transform: 'translateX(-100%)' },
            },
          }}
        >
          <TrendingUp
            size={20}
            style={{
              color: '#4caf50',
              animation: 'pulse 2s infinite',
            }}
          />
          <Typography
            variant='body2'
            sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#e0e0e0' }}
          >
            DÓLAR BLUE
          </Typography>

          <Chip
            icon={<DollarSign size={14} />}
            label="COMPRA $--"
            size='small'
            sx={{
              backgroundColor: 'rgba(76, 175, 80, 0.15)',
              color: '#4caf50',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              fontWeight: 600,
              '& .MuiChip-icon': { color: '#4caf50' },
              animation: 'shimmer 1.5s infinite',
              '@keyframes shimmer': {
                '0%': { opacity: 0.4 },
                '50%': { opacity: 0.8 },
                '100%': { opacity: 0.4 },
              },
            }}
          />

          <Chip
            icon={<DollarSign size={14} />}
            label="VENTA $--"
            size='small'
            sx={{
              backgroundColor: 'rgba(76, 175, 80, 0.15)',
              color: '#4caf50',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              fontWeight: 600,
              '& .MuiChip-icon': { color: '#4caf50' },
              animation: 'shimmer 1.5s infinite 0.3s',
              '@keyframes shimmer': {
                '0%': { opacity: 0.4 },
                '50%': { opacity: 0.8 },
                '100%': { opacity: 0.4 },
              },
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Clock
              size={16}
              style={{ color: '#9e9e9e' }}
            />
            <Typography
              variant='caption'
              sx={{ fontWeight: 500, color: '#9e9e9e', fontSize: '0.75rem' }}
            >
              Conectando con mercado financiero...
            </Typography>
          </Box>

          <CircularProgress
            size={16}
            sx={{ 
              color: '#4caf50',
              marginLeft: '8px'
            }}
          />
        </Box>
      </Box>
    );
  }

  if (error && !displayData) {
    return (
      <Box
        sx={{
          background: 'linear-gradient(90deg, #0d1421 0%, #1a1a1a 100%)',
          color: '#e0e0e0',
          py: 1.5,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(244, 67, 54, 0.5)',
          cursor: showRefreshButton ? 'pointer' : 'default',
          '&:hover': showRefreshButton
            ? {
                borderBottom: '1px solid rgba(244, 67, 54, 0.8)',
              }
            : undefined,
        }}
        className={className}
        onClick={showRefreshButton ? refresh : undefined}
      >
        <AlertCircle
          size={18}
          style={{ color: '#f44336' }}
        />
        <Typography
          variant='body2'
          sx={{ fontWeight: 500, color: '#e0e0e0' }}
        >
          Error en conexión financiera{' '}
          {showRefreshButton && '• Click para reintentar'}
        </Typography>
      </Box>
    );
  }

  if (!displayData) {
    return null;
  }

  const isDataFresh = isCacheValid;
  const borderColor = isDataFresh
    ? 'rgba(76, 175, 80, 0.6)'
    : 'rgba(255, 152, 0, 0.6)';

  // Crear contenido reutilizable
  const tickerContent = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 'max-content' }}>
      <TrendingUp
        size={20}
        style={{
          color: isDataFresh ? '#4caf50' : '#ff9800',
          animation: isDataFresh ? 'pulse 2s infinite' : 'none',
        }}
      />
      <Typography
        variant='body2'
        sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#e0e0e0' }}
      >
        DÓLAR BLUE
      </Typography>

      <Chip
        icon={<DollarSign size={14} />}
        label={`COMPRA $${displayData.compra.toFixed(0)}`}
        size='small'
        sx={{
          backgroundColor: 'rgba(76, 175, 80, 0.15)',
          color: '#4caf50',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          fontWeight: 600,
          '& .MuiChip-icon': { color: '#4caf50' },
        }}
      />

      <Chip
        icon={<DollarSign size={14} />}
        label={`VENTA $${displayData.venta.toFixed(0)}`}
        size='small'
        sx={{
          backgroundColor: 'rgba(76, 175, 80, 0.15)',
          color: '#4caf50',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          fontWeight: 600,
          '& .MuiChip-icon': { color: '#4caf50' },
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Clock
          size={16}
          style={{ color: '#9e9e9e' }}
        />
        <Typography
          variant='caption'
          sx={{ fontWeight: 500, color: '#9e9e9e', fontSize: '0.75rem' }}
        >
          Actualizado: {displayData.cotizadoHace}
        </Typography>
      </Box>

      {showRefreshButton && (
        <RefreshCw
          size={16}
          style={{
            color: '#4caf50',
            marginLeft: '8px',
            animation: isLoading ? 'spin 1s linear infinite' : 'none',
          }}
        />
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        background: 'linear-gradient(90deg, #0d1421 0%, #1a1a1a 100%)',
        color: '#e0e0e0',
        py: 1.5,
        px: 0,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        cursor: showRefreshButton ? 'pointer' : 'default',
        position: 'relative',
        width: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        borderBottom: `2px solid ${borderColor}`,
        transition: 'all 0.3s ease-in-out',
        '@keyframes pulse': {
          '0%': { opacity: 1 },
          '50%': { opacity: 0.6 },
          '100%': { opacity: 1 },
        },
        // Pause marquee animation on hover for better UX
        '&:hover .ticker-marquee': {
          animationPlayState: 'paused',
        },
        '&:hover': showRefreshButton
          ? {
              borderBottom: `2px solid ${isDataFresh ? '#4caf50' : '#ff9800'}`,
              boxShadow: `0 4px 12px rgba(0,0,0,0.4), 0 0 8px ${isDataFresh ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`,
            }
          : undefined,
      }}
      className={className}
      onClick={showRefreshButton ? refresh : undefined}
    >
      <Box
        className="ticker-marquee"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 60, // Espacio amplio entre las dos instancias
          px: 4,
          whiteSpace: 'nowrap',
          animation: 'seamless-marquee 15s linear infinite',
          '@keyframes seamless-marquee': {
            '0%': { transform: 'translateX(100%)' },
            '100%': { transform: 'translateX(-100%)' },
          },
        }}
      >
        {/* Primera instancia */}
        {tickerContent}
        
        {/* Segunda instancia para seamless loop */}
        {tickerContent}
      </Box>
    </Box>
  );
}
