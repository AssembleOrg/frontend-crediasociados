import { useState, useCallback } from 'react'

export interface UseModalResult<T = any> {
  isOpen: boolean
  open: (data?: T) => void
  close: () => void
  data: T | null
  setData: (data: T | null) => void
}

export function useModal<T = any>(initialData?: T): UseModalResult<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<T | null>(initialData || null)

  const open = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData)
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    open,
    close,
    data,
    setData
  }
}

export interface UseModalStateResult {
  createModal: UseModalResult
  editModal: UseModalResult<any>
  deleteModal: UseModalResult<any>
  openCreateModal: () => void
  openEditModal: (item: any) => void
  openDeleteModal: (item: any) => void
  closeAllModals: () => void
}

export function useModalState(): UseModalStateResult {
  const createModal = useModal()
  const editModal = useModal()
  const deleteModal = useModal()

  const openCreateModal = useCallback(() => {
    createModal.open()
  }, [createModal])

  const openEditModal = useCallback((item: any) => {
    editModal.open(item)
  }, [editModal])

  const openDeleteModal = useCallback((item: any) => {
    deleteModal.open(item)
  }, [deleteModal])

  const closeAllModals = useCallback(() => {
    createModal.close()
    editModal.close()
    deleteModal.close()
  }, [createModal, editModal, deleteModal])

  return {
    createModal,
    editModal,
    deleteModal,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    closeAllModals
  }
}