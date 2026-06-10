'use client'
import { createTheme, alpha } from '@mui/material/styles'

// ─── iOS Design Tokens ────────────────────────────────────────────────────────

export const iosColors = {
  // iOS System Colors
  blue:    '#007AFF',
  green:   '#34C759',
  red:     '#FF3B30',
  orange:  '#FF9500',
  yellow:  '#FFCC00',
  purple:  '#AF52DE',
  teal:    '#5AC8FA',

  // iOS Grays
  gray1:   '#8E8E93',
  gray2:   '#AEAEB2',
  gray3:   '#C7C7CC',
  gray4:   '#D1D1D6',
  gray5:   '#E5E5EA',
  gray6:   '#F2F2F7',

  // iOS Backgrounds
  systemBackground:        '#FFFFFF',
  secondaryBackground:     '#F2F2F7',
  tertiaryBackground:      '#FFFFFF',
  groupedBackground:       '#F2F2F7',
  secondaryGrouped:        '#FFFFFF',

  // Semantic
  label:           '#000000',
  secondaryLabel:  '#3C3C43',
  tertiaryLabel:   '#3C3C4399',
  separator:       '#3C3C434A',
}

// ─── MUI Theme ───────────────────────────────────────────────────────────────

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 1280,
      lg: 1900,
      xl: 2560,
    },
  },

  palette: {
    mode: 'light',
    primary: {
      main:          iosColors.blue,
      light:         '#5AC8FA',
      dark:          '#0051A8',
      contrastText:  '#FFFFFF',
    },
    secondary: {
      main:          iosColors.gray1,
      light:         iosColors.gray3,
      dark:          '#636366',
      contrastText:  '#FFFFFF',
    },
    success: {
      main:          iosColors.green,
      light:         '#86EFAC',
      dark:          '#166534',
      contrastText:  '#FFFFFF',
    },
    error: {
      main:          iosColors.red,
      light:         '#FCA5A5',
      dark:          '#991B1B',
      contrastText:  '#FFFFFF',
    },
    warning: {
      main:          iosColors.orange,
      light:         '#FCD34D',
      dark:          '#B45309',
      contrastText:  '#FFFFFF',
    },
    background: {
      default: iosColors.groupedBackground,
      paper:   iosColors.systemBackground,
    },
    text: {
      primary:   iosColors.label,
      secondary: iosColors.secondaryLabel,
      disabled:  iosColors.tertiaryLabel,
    },
    divider: iosColors.separator,
    grey: {
      50:  iosColors.gray6,
      100: iosColors.gray5,
      200: iosColors.gray4,
      300: iosColors.gray3,
      400: iosColors.gray2,
      500: iosColors.gray1,
    },
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    // System font stack (iOS SF Pro equivalent)
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", var(--font-geist-sans), "Segoe UI", Roboto, sans-serif',

    // iOS type scale
    h1: { fontWeight: 700, fontSize: '2.125rem',  letterSpacing: '-0.02em', lineHeight: 1.2 }, // 34px
    h2: { fontWeight: 700, fontSize: '1.75rem',   letterSpacing: '-0.02em', lineHeight: 1.25 }, // 28px
    h3: { fontWeight: 600, fontSize: '1.375rem',  letterSpacing: '-0.01em', lineHeight: 1.3  }, // 22px
    h4: { fontWeight: 600, fontSize: '1.0625rem', letterSpacing: '-0.01em', lineHeight: 1.35 }, // 17px
    h5: { fontWeight: 600, fontSize: '0.9375rem', letterSpacing: 0,         lineHeight: 1.4  }, // 15px
    h6: { fontWeight: 600, fontSize: '0.8125rem', letterSpacing: 0,         lineHeight: 1.4  }, // 13px

    body1:    { fontSize: '1.0625rem', lineHeight: 1.47, letterSpacing: '-0.01em' }, // 17px body
    body2:    { fontSize: '0.9375rem', lineHeight: 1.53, letterSpacing: '-0.005em' }, // 15px callout
    subtitle1:{ fontSize: '1.0625rem', fontWeight: 600,  letterSpacing: '-0.01em' },
    subtitle2:{ fontSize: '0.9375rem', fontWeight: 600,  letterSpacing: '-0.005em' },
    caption:  { fontSize: '0.75rem',   lineHeight: 1.33, letterSpacing: 0 }, // 12px
    overline: { fontSize: '0.6875rem', fontWeight: 600,  letterSpacing: '0.06em', textTransform: 'uppercase' }, // 11px

    button: {
      textTransform: 'none',
      fontWeight:    600,
      letterSpacing: '-0.005em',
      fontSize:      '1.0625rem', // 17px (iOS default button)
    },
  },

  components: {
    // ── Buttons ──────────────────────────────────────────────────────────────
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform:  'none',
          borderRadius:   12,
          fontWeight:     600,
          // Minimum 44px touch target (iOS HIG)
          minHeight:      44,
          padding:        '10px 20px',
          letterSpacing:  '-0.005em',
          fontSize:       '1.0625rem',
        },
        sizeSmall: {
          minHeight:  36,
          padding:    '6px 14px',
          fontSize:   '0.9375rem',
          borderRadius: 10,
        },
        sizeLarge: {
          minHeight:  54,
          padding:    '14px 28px',
          fontSize:   '1.0625rem',
          borderRadius: 14,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
          '&:active': { boxShadow: 'none', transform: 'scale(0.98)' },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
      },
    },

    // ── IconButton — minimum 44×44px ─────────────────────────────────────────
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth:  44,
          minHeight: 44,
          borderRadius: 12,
          '&:active': { transform: 'scale(0.9)' },
        },
        sizeSmall: {
          minWidth:  36,
          minHeight: 36,
          borderRadius: 10,
        },
      },
    },

    // ── Cards ─────────────────────────────────────────────────────────────────
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius:  16,
          boxShadow:     '0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.06)',
          border:        '0.5px solid rgba(0,0,0,0.08)',
          backgroundClip: 'padding-box',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px',
          '&:last-child': { paddingBottom: '16px' },
        },
      },
    },

    // ── Paper ─────────────────────────────────────────────────────────────────
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius:  16,
          backgroundClip: 'padding-box',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.06)',
        },
        elevation4: {
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.06)',
        },
      },
    },

    // ── AppBar ────────────────────────────────────────────────────────────────
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter:  'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color:     iosColors.blue,
          boxShadow: `0 0.5px 0 ${iosColors.separator}`,
          borderBottom: 'none',
        },
      },
    },

    // ── TextField ─────────────────────────────────────────────────────────────
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: iosColors.secondaryBackground,
            '& fieldset': {
              borderColor: iosColors.gray4,
              borderWidth: '1px',
            },
            '&:hover fieldset': { borderColor: iosColors.gray2 },
            '&.Mui-focused fieldset': {
              borderColor: iosColors.blue,
              borderWidth: '2px',
            },
          },
          // Min height for touch
          '& .MuiInputBase-root': { minHeight: 44 },
        },
      },
    },

    // ── Chip ──────────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius:  20,  // pill
          fontWeight:    600,
          fontSize:      '0.8125rem',
          height:        32,
          minWidth:      44, // touch target via padding
        },
        sizeSmall: {
          height:   26,
          fontSize: '0.75rem',
        },
      },
    },

    // ── List Items ────────────────────────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius:  12,
          minHeight:     44,
          marginBottom:  4,
          '&.Mui-selected': {
            backgroundColor: alpha(iosColors.blue, 0.12),
            color:           iosColors.blue,
            '&:hover': { backgroundColor: alpha(iosColors.blue, 0.18) },
          },
        },
      },
    },

    // ── Drawer (BottomSheets) ─────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius:   '20px 20px 0 0',
          paddingBottom:  'env(safe-area-inset-bottom)',
          maxHeight:      '92dvh',
          overflowY:      'auto',
        },
      },
    },

    // ── Dialog ────────────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow:    '0 16px 48px rgba(0,0,0,0.16)',
        },
      },
    },

    // ── Tabs ─────────────────────────────────────────────────────────────────
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
        },
      },
    },

    // ── Switch ────────────────────────────────────────────────────────────────
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 6,
        },
        thumb: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        },
        track: {
          borderRadius: 20,
          opacity: 1,
          backgroundColor: iosColors.gray4,
        },
        switchBase: {
          '&.Mui-checked': {
            '& + .MuiSwitch-track': {
              opacity: 1,
              backgroundColor: iosColors.green,
            },
          },
        },
      },
    },

    // ── Tooltip ───────────────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius:    8,
          fontSize:        '0.8125rem',
          backgroundColor: 'rgba(50,50,50,0.9)',
          backdropFilter:  'blur(8px)',
        },
      },
    },

    // ── Skeleton ──────────────────────────────────────────────────────────────
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },

    // ── Alert ─────────────────────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
})
