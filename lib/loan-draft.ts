/**
 * Borrador del préstamo que se está cargando. Si el teléfono cierra la app en
 * segundo plano (ej. el cobrador va a WhatsApp a mirar un dato) y la recarga,
 * lo cargado no se pierde. Vive 12 h, por usuario; se borra al crear el
 * préstamo, al cerrar el formulario a propósito y al cerrar sesión.
 */
export const LOAN_DRAFT_PREFIX = 'loan-draft:'
const MAX_AGE_MS = 12 * 60 * 60 * 1000

export interface LoanDraft<F, C> {
  savedAt: number
  formData: F
  selectedClient: C | null
  searchInput: string
}

const key = (userId: string) => `${LOAN_DRAFT_PREFIX}${userId}`

export function saveLoanDraft<F, C>(userId: string | null | undefined, draft: Omit<LoanDraft<F, C>, 'savedAt'>) {
  if (!userId || typeof window === 'undefined') return
  try {
    localStorage.setItem(key(userId), JSON.stringify({ ...draft, savedAt: Date.now() }))
  } catch {
    // storage lleno o bloqueado
  }
}

export function loadLoanDraft<F, C>(userId: string | null | undefined): LoanDraft<F, C> | null {
  if (!userId || typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key(userId))
    if (!raw) return null
    const draft = JSON.parse(raw) as LoanDraft<F, C>
    if (!draft?.savedAt || Date.now() - draft.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(key(userId))
      return null
    }
    return draft
  } catch {
    return null
  }
}

export function clearLoanDraft(userId: string | null | undefined) {
  if (!userId || typeof window === 'undefined') return
  try {
    localStorage.removeItem(key(userId))
  } catch {
    // ignore
  }
}

export function clearAllLoanDrafts() {
  if (typeof window === 'undefined') return
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(LOAN_DRAFT_PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}
