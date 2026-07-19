import { create } from 'zustand'
import type { PanelId } from '../types'

export const DEFAULT_SIDEBAR_ORDER: PanelId[] = [
  "home", "search", "files", "chat", "alerts", "snippets", "tasks",
  "notes", "contacts", "bookmarks", "projects", "calendar", "vault", "tools", "services", "profile",
]

export type SidebarPosition = 'left' | 'right'

// Tope de accesos fijados en la barra de control del panel: con el ancho
// mínimo del panel (200px) no entran más iconos entre las flechas y el pin/✕
export const MAX_PINNED_PANELS = 5

interface SettingsData {
  accentColor: string
  panelBackground: string
  stripBackground: string
  sidebarOrder: PanelId[]
  hiddenPanels: PanelId[]
  pinnedPanels: PanelId[]
  refreshInterval: number
  panelWidth: number
  sidebarPosition: SidebarPosition
}

interface SettingsState extends SettingsData {
  setAccentColor: (color: string) => void
  setPanelBackground: (bg: string) => void
  setStripBackground: (bg: string) => void
  setSidebarOrder: (order: PanelId[]) => void
  toggleHiddenPanel: (panel: PanelId) => void
  togglePinnedPanel: (panel: PanelId) => void
  setRefreshInterval: (seconds: number) => void
  setPanelWidth: (width: number) => void
  setSidebarPosition: (position: SidebarPosition) => void
}

const STORAGE_KEY = 'desktop-settings'

const DEFAULTS: SettingsData = {
  accentColor:     'blue',
  panelBackground: 'default',
  stripBackground: 'default',
  sidebarOrder:    DEFAULT_SIDEBAR_ORDER,
  hiddenPanels:    [],
  pinnedPanels:    [],
  refreshInterval: 60,
  panelWidth:      320,
  sidebarPosition: 'right',
}

function load(): SettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const merged: SettingsData = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SettingsData>) }
      // Insert any panels added to DEFAULT_SIDEBAR_ORDER after the settings were last saved
      const missing = DEFAULT_SIDEBAR_ORDER.filter((p) => !merged.sidebarOrder.includes(p))
      if (missing.length > 0) {
        const profileIdx = merged.sidebarOrder.indexOf('profile')
        merged.sidebarOrder = profileIdx !== -1
          ? [...merged.sidebarOrder.slice(0, profileIdx), ...missing, ...merged.sidebarOrder.slice(profileIdx)]
          : [...merged.sidebarOrder, ...missing]
      }
      return merged
    }
  } catch { /* ignore */ }
  return { ...DEFAULTS }
}

function save(data: SettingsData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

const initial = load()

// Position the appbar was actually registered with at this launch. The store
// value can change from Settings, but the native anchoring only re-reads it on
// the next startup — UI that mirrors the physical side must use this constant.
export const INITIAL_SIDEBAR_POSITION: SidebarPosition = initial.sidebarPosition

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initial,

  setAccentColor: (accentColor) => {
    set({ accentColor })
    save({ ...get(), accentColor })
  },
  setPanelBackground: (panelBackground) => {
    set({ panelBackground })
    save({ ...get(), panelBackground })
  },
  setStripBackground: (stripBackground) => {
    set({ stripBackground })
    save({ ...get(), stripBackground })
  },
  setSidebarOrder: (sidebarOrder) => {
    set({ sidebarOrder })
    save({ ...get(), sidebarOrder })
  },
  toggleHiddenPanel: (panel) => {
    const hiddenPanels = get().hiddenPanels.includes(panel)
      ? get().hiddenPanels.filter((p) => p !== panel)
      : [...get().hiddenPanels, panel]
    set({ hiddenPanels })
    save({ ...get(), hiddenPanels })
  },
  togglePinnedPanel: (panel) => {
    const current = get().pinnedPanels
    let pinnedPanels: PanelId[]
    if (current.includes(panel)) {
      pinnedPanels = current.filter((p) => p !== panel)
    } else {
      if (current.length >= MAX_PINNED_PANELS) return
      pinnedPanels = [...current, panel]
    }
    set({ pinnedPanels })
    save({ ...get(), pinnedPanels })
  },
  setRefreshInterval: (refreshInterval) => {
    set({ refreshInterval })
    save({ ...get(), refreshInterval })
  },
  setPanelWidth: (panelWidth) => {
    set({ panelWidth })
    save({ ...get(), panelWidth })
  },
  setSidebarPosition: (sidebarPosition) => {
    set({ sidebarPosition })
    save({ ...get(), sidebarPosition })
  },
}))
