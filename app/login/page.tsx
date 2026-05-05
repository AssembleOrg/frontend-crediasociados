'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgress } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/components/ui/SplashScreen';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

const glass: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: 24,
};

export default function LoginPage() {
  const { login, isLoading, error, navigateToDashboard, clearError } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const submitLock = useRef(false);

  const isBusy = isLoading || isRedirecting;

  const scrollIntoView = useCallback((el: HTMLInputElement | null) => {
    if (!el) return;
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    clearError();

    if (!formData.email || !formData.password) {
      submitLock.current = false;
      return;
    }

    const success = await login(formData);
    if (success) {
      setIsRedirecting(true);
      navigateToDashboard();
    } else {
      submitLock.current = false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <>
      <SplashScreen visible={isRedirecting} />

      <style>{`
        .login-wrapper {
          justify-content: flex-end;
        }
        @media (min-width: 768px) {
          .login-wrapper {
            justify-content: center;
            padding-top: 12vh;
          }
          .login-content {
            padding-bottom: 0;
          }
        }
      `}</style>

      <div
        className="login-wrapper"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(160deg, #0a1628 0%, #0d1f3c 60%, #0a1628 100%)',
          position: 'relative',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >

        {/* Gradiente radial decorativo */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <style>{`
          .login-logo {
            position: absolute;
            top: 24px;
            left: 24px;
            width: 110px;
          }
          @media (min-width: 768px) {
            .login-logo {
              left: 50%;
              transform: translateX(-50%);
              width: 160px;
              top: 32px;
            }
          }
        `}</style>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/crediasociados-logo.webp"
          alt="Crediasociados"
          className="login-logo"
          style={{ height: 'auto', zIndex: 10 }}
        />

        {/* Contenedor principal */}
        <div
          className="login-content"
          style={{
            width: '100%',
            maxWidth: 520,
            margin: '0 auto',
            padding: '0 24px 40px',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >

          {/* Hero text */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              style={{
                margin: 0,
                fontSize: 'clamp(2rem, 6vw, 2.75rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              Todo bajo<br />control.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{
                margin: '10px 0 0',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              Gestioná tus préstamos con claridad.
            </motion.p>
          </div>

          {/* Pill / Form */}
          <AnimatePresence mode="wait">
            {!showForm ? (
              <motion.button
                key="pill"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16, transition: { duration: 0.15 } }}
                transition={spring}
                onClick={() => setShowForm(true)}
                style={{
                  ...glass,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 24px',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M5 3l14 9-14 9V3z" fill="rgba(255,255,255,0.9)" />
                  </svg>
                </div>
                <span style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '1rem',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                }}>
                  Iniciar gestión
                </span>
              </motion.button>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={spring}
                style={{ ...glass, padding: '28px 24px 24px' }}
              >
                {error && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    marginBottom: 20,
                    color: 'rgba(252, 165, 165, 0.9)',
                    fontSize: '0.875rem',
                  }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Email */}
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <input
                      name="email"
                      type="email"
                      inputMode="email"
                      placeholder="Correo electrónico"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={(e) => scrollIntoView(e.currentTarget)}
                      disabled={isBusy}
                      required
                      autoComplete="email"
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 14,
                        padding: '14px 14px 14px 42px',
                        color: '#ffffff',
                        fontSize: '0.9375rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Contraseña"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={(e) => scrollIntoView(e.currentTarget)}
                      disabled={isBusy}
                      required
                      autoComplete="current-password"
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 14,
                        padding: '14px 44px 14px 42px',
                        color: '#ffffff',
                        fontSize: '0.9375rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      disabled={isBusy}
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.4)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isBusy}
                    style={{
                      marginTop: 6,
                      width: '100%',
                      padding: '15px',
                      background: isBusy ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 14,
                      color: '#ffffff',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      cursor: isBusy ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      letterSpacing: '-0.01em',
                      transition: 'background 0.2s',
                    }}
                  >
                    {isBusy ? (
                      <>
                        <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.7)' }} />
                        <span>{isRedirecting ? 'Redirigiendo...' : 'Iniciando sesión...'}</span>
                      </>
                    ) : (
                      'Ingresar →'
                    )}
                  </button>
                </form>

                {/* Volver */}
                <button
                  type="button"
                  onClick={() => { setShowForm(false); clearError(); }}
                  disabled={isBusy}
                  className="login-back-btn"
                  style={{
                    marginTop: 20,
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 400,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    padding: '6px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    opacity: isBusy ? 0.3 : 0.7,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Cancelar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
