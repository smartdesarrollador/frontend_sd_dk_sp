import { create } from 'zustand'
import type { PanelId } from '../types'

export const DEFAULT_SIDEBAR_ORDER: PanelId[] = [
  "home", "files", "chat", "alerts", "snippets", "tasks",
  "notes", "contacts", "bookmarks", "projects", "calendar", "profile",
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
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SettingsData>) }
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
