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
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: width,
        height: height,
        minWidth: { xs: finalMobileWidth, md: width },
        minHeight: height,
      }}
      className={className}
    >
      <Image
        src='/crediasociados-logo.webp'
        alt='Prestamito - Sistema de Gestión de Préstamos'
        fill
        priority={priority}
        style={{
          objectFit: 'contain',
        }}
        sizes={`(max-width: 768px) ${finalMobileWidth}px, ${width}px`}
      />
    </Box>
  );
}
