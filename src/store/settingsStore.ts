import { create } from 'zustand'
import type { PanelId } from '../types'

export const DEFAULT_SIDEBAR_ORDER: PanelId[] = [
  "home", "search", "files", "chat", "alerts", "snippets", "tasks",
  "notes", "contacts", "bookmarks", "projects", "calendar", "vault", "tools", "services", "profile",
]

interface SettingsData {
  accentColor: string
  panelBackground: string
  sidebarOrder: PanelId[]
  hiddenPanels: PanelId[]
  refreshInterval: number
  panelWidth: number
}

interface SettingsState extends SettingsData {
  setAccentColor: (color: string) => void
  setPanelBackground: (bg: string) => void
  setSidebarOrder: (order: PanelId[]) => void
  toggleHiddenPanel: (panel: PanelId) => void
  setRefreshInterval: (seconds: number) => void
  setPanelWidth: (width: number) => void
}

const STORAGE_KEY = 'desktop-settings'

const DEFAULTS: SettingsData = {
  accentColor:     'blue',
  panelBackground: 'default',
  sidebarOrder:    DEFAULT_SIDEBAR_ORDER,
  hiddenPanels:    [],
  refreshInterval: 60,
  panelWidth:      320,
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
  setRefreshInterval: (refreshInterval) => {
    set({ refreshInterval })
    save({ ...get(), refreshInterval })
  },
  setPanelWidth: (panelWidth) => {
    set({ panelWidth })
    save({ ...get(), panelWidth })
  },
}))
