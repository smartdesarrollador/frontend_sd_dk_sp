import { create } from 'zustand'
import type { PanelId } from '../types'

interface NavigationState {
  pendingPanel: PanelId | null
  navigateTo: (panel: PanelId) => void
  clearPending: () => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  pendingPanel: null,
  navigateTo: (panel) => set({ pendingPanel: panel }),
  clearPending: () => set({ pendingPanel: null }),
}))
