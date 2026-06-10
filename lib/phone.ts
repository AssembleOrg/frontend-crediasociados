/**
 * Normaliza un teléfono al formato internacional de WhatsApp (+54…).
 *
 * Reglas (Argentina):
 * - Si ya empieza con +54, se deja igual.
 * - Si empieza con 54, se le antepone +.
 * - Si empieza con 0, se reemplaza por +54.
 * - Si empieza con 9, se antepone +54.
 * - En cualquier otro caso se asume número local sin código de país y se antepone +54.
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '')

  if (cleaned.startsWith('+54')) {
    return cleaned
  }
  if (cleaned.startsWith('54')) {
    return '+' + cleaned
  }
  if (cleaned.startsWith('0')) {
    return '+54' + cleaned.substring(1)
  }
  if (cleaned.startsWith('9')) {
    return '+54' + cleaned
  }
  return '+54' + cleaned
}

/** Devuelve la URL de wa.me lista para abrir un chat de WhatsApp con el número. */
export function getWhatsAppUrl(phone: string): string {
  return `https://wa.me/${formatPhoneForWhatsApp(phone)}`
}
