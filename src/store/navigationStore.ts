import { create } from 'zustand'
import type { PanelId } from '../types'

interface NavigationState {
  pendingPanel: PanelId | null
  navigateTo: (panel: PanelId) => void
  clearPending: () => void
  // Historial estilo navegador: cerrar el panel no lo modifica, y abrir uno
  // nuevo estando "atrás" trunca las entradas hacia adelante.
  history: PanelId[]
  index: number
  push: (panel: PanelId) => void
  back: () => PanelId | null
  forward: () => PanelId | null
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  pendingPanel: null,
  navigateTo: (panel) => set({ pendingPanel: panel }),
  clearPending: () => set({ pendingPanel: null }),

  history: [],
  index: -1,
  push: (panel) => {
    const { history, index } = get()
    if (history[index] === panel) return
    const next = [...history.slice(0, index + 1), panel]
    set({ history: next, index: next.length - 1 })
  },
  back: () => {
    const { history, index } = get()
    if (index <= 0) return null
    set({ index: index - 1 })
    return history[index - 1]
  },
  forward: () => {
    const { history, index } = get()
    if (index >= history.length - 1) return null
    set({ index: index + 1 })
    return history[index + 1]
  },
}))
