'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

/**
 * Widget de reportes de Pistech (pestaña acoplada al borde → reporte al grupo de WhatsApp).
 *
 * Token y proyecto vienen fijos (el token es público: igual viaja en el HTML) y el entorno los pisa:
 *   NEXT_PUBLIC_PISTECH_REPORT_TOKEN     token público del proyecto (panel → Proyectos → General)
 *   NEXT_PUBLIC_PISTECH_REPORT_PROJECT   id del proyecto en el panel
 *   NEXT_PUBLIC_PISTECH_REPORT_ENDPOINT  host del servicio (default: producción)
 *
 * Título, color, tema y «sólo usuarios logueados» se manejan desde el panel sin redeploy.
 * Este componente le avisa al widget si hay sesión, para cuando esa opción está activa.
 */
const TOKEN = process.env.NEXT_PUBLIC_PISTECH_REPORT_TOKEN || 'aMamAIdEMzoF50nnRod1h836p7ezcLxN';
const PROJECT = process.env.NEXT_PUBLIC_PISTECH_REPORT_PROJECT || 'crediasociados';
const ENDPOINT = (process.env.NEXT_PUBLIC_PISTECH_REPORT_ENDPOINT || 'https://whatsapp-pistech-neonize-production.up.railway.app').replace(/\/$/, '');

type PistechWindow = Window & {
  PistechReportConfig?: Record<string, unknown>;
  PistechReport?: { setAuthed?: (v: boolean) => void };
};

export function PistechReport() {
  const authed = useAuthStore((s) => s.isAuthenticated);

  // Carga única del script, con la config ya publicada en window.
  useEffect(() => {
    if (!TOKEN) return;
    const w = window as PistechWindow;
    w.PistechReportConfig = { ...w.PistechReportConfig, endpoint: ENDPOINT, token: TOKEN, project: PROJECT };
    if (document.getElementById('pistech-report-widget')) return;
    const s = document.createElement('script');
    s.id = 'pistech-report-widget';
    s.src = `${ENDPOINT}/static/widget.js`;
    s.async = true;
    document.body.appendChild(s);
  }, []);

  // Estado de sesión: global para si el widget carga después, y directo si ya está.
  useEffect(() => {
    if (!TOKEN) return;
    const w = window as PistechWindow;
    w.PistechReportConfig = { ...w.PistechReportConfig, authed };
    const apply = () => {
      if (!w.PistechReport?.setAuthed) return false;
      w.PistechReport.setAuthed(authed);
      return true;
    };
    if (apply()) return;
    let tries = 0;
    const id = setInterval(() => {
      if (apply() || ++tries > 40) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [authed]);

  return null;
}
