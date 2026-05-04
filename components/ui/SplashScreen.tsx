'use client'

import { useState, useEffect } from 'react'
import { Box, keyframes } from '@mui/material'
import Image from 'next/image'

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
`

const fadeOut = keyframes`
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(1.05); }
`

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

interface SplashScreenProps {
  visible: boolean
}

export function SplashScreen({ visible }: SplashScreenProps) {
  const [shouldRender, setShouldRender] = useState(visible)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (visible) {
      setShouldRender(true)
      setIsExiting(false)
    } else {
      // Start exit animation
      setIsExiting(true)
      const timer = setTimeout(() => setShouldRender(false), 500)
      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!shouldRender) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'white',
        animation: `${isExiting ? fadeOut : fadeIn} ${isExiting ? '0.5s' : '0.4s'} ease-${isExiting ? 'in' : 'out'} forwards`,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          animation: !isExiting ? `${fadeIn} 0.6s ease-out` : undefined,
          mb: 3,
        }}
      >
        <Image
          src="/crediasociados-logo.webp"
          alt="Crediasociados"
          width={220}
          height={140}
          priority
          style={{ objectFit: 'contain' }}
        />
      </Box>

      {/* Loading bar */}
      <Box
        sx={{
          width: 180,
          height: 3,
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'grey.200',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent 0%, #0d1f3c 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: `${shimmer} 1.5s ease-in-out infinite`,
          }}
        />
      </Box>
    </Box>
  )
}
