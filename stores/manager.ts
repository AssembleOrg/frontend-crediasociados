'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface ManagerStore {
  pendingModal: string | null
  setPendingModal: (modal: string | null) => void
}

export const useManagerStore = create<ManagerStore>()(
  immer((set) => ({
    pendingModal: null,
    setPendingModal: (modal) => set((state) => { state.pendingModal = modal }),
  }))
)
