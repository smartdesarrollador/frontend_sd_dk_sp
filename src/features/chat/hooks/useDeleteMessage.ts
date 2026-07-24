import { useState, useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'

/**
 * Elimina (soft-delete) un mensaje propio. Borra su adjunto y libera la cuota de almacenamiento.
 * Devuelve true si el borrado fue exitoso.
 */
export function useDeleteMessage() {
  const [deleting, setDeleting] = useState(false)

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/v1/app/chat/messages/${messageId}/`, { method: 'DELETE' })
      return res.ok
    } catch {
      return false
    } finally {
      setDeleting(false)
    }
  }, [])

  return { deleteMessage, deleting }
}
