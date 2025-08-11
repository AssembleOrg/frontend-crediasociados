'use client';

import Image from 'next/image';
import { Box } from '@mui/material';

interface LogoProps {
  width?: number;
  height?: number;
  mobileWidth?: number;
  mobileHeight?: number;
  priority?: boolean;
  className?: string;
}

export function Logo({
  width = 120,
  height = 40,
  mobileWidth,
  priority = false,
  className,
}: LogoProps) {
  const finalMobileWidth = mobileWidth || Math.round(width * 0.7);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        '& img': {
          objectFit: 'contain',
        },
      }}
      className={className}
    >
      <Image
        src='/crediasociados-logo.webp'
        alt='Prestamito - Sistema de Gestión de Préstamos'
        width={width}
        height={height}
        priority={priority}
        style={{
          width: 'auto',
          height: '100%',
          maxWidth: width,
          maxHeight: height,
        }}
        sizes={`(max-width: 768px) ${finalMobileWidth}px, ${width}px`}
      />
    </Box>
  );
}
