import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Home, Files, MessageSquare, Bell, Code2, CheckSquare,
  StickyNote, Users, Bookmark, FolderKanban, CalendarDays, User,
  Settings, X, ShieldCheck, Search, Sparkles, Wrench,
  ChevronUp, ChevronDown,
  // TEMP-SCROLL-TEST: iconos solo para probar el scroll — eliminar junto con TEMP_TEST_ITEMS
  Star, Heart, Camera, Music, Map, Cloud, Zap, Gift, Globe, Rocket,
} from "lucide-react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import type { PanelId, NavItem } from "../types"
import NavIcon from "./NavIcon"
import { useNotificationsStore } from "../store/notificationsStore"
import { useSettingsStore } from "../store/settingsStore"

const ALL_NAV_META: Partial<Record<PanelId, NavItem>> = {
  home:      { id: "home",      icon: Home,          label: "Home"      },
  search:    { id: "search",    icon: Search,        label: "Buscar"    },
  files:     { id: "files",     icon: Files,         label: "Files"     },
  chat:      { id: "chat",      icon: MessageSquare, label: "Chat"      },
  alerts:    { id: "alerts",    icon: Bell,          label: "Alerts"    },
  snippets:  { id: "snippets",  icon: Code2,         label: "Snippets"  },
  tasks:     { id: "tasks",     icon: CheckSquare,   label: "Tasks"     },
  notes:     { id: "notes",     icon: StickyNote,    label: "Notes"     },
  contacts:  { id: "contacts",  icon: Users,         label: "Contacts"  },
  bookmarks: { id: "bookmarks", icon: Bookmark,      label: "Bookmarks" },
  projects:  { id: "projects",  icon: FolderKanban,  label: "Projects"  },
  calendar:  { id: "calendar",  icon: CalendarDays,  label: "Calendar"  },
  vault:     { id: "vault",     icon: ShieldCheck,   label: "Vault"     },
  tools:     { id: "tools",     icon: Wrench,        label: "Tools"     },
  services:  { id: "services",  icon: Sparkles,      label: "Servicios" },
  profile:   { id: "profile",   icon: User,          label: "Profile"   },
}

const settingsItem: NavItem = { id: "settings", icon: Settings, label: "Settings" }

// TEMP-SCROLL-TEST: 10 iconos de relleno para probar el scroll con overflow real.
// No son paneles (click no hace nada). ELIMINAR este bloque y su render tras la prueba.
const TEMP_TEST_ITEMS = [
  { icon: Star,   label: "Test 1"  },
  { icon: Heart,  label: "Test 2"  },
  { icon: Camera, label: "Test 3"  },
  { icon: Music,  label: "Test 4"  },
  { icon: Map,    label: "Test 5"  },
  { icon: Cloud,  label: "Test 6"  },
  { icon: Zap,    label: "Test 7"  },
  { icon: Gift,   label: "Test 8"  },
  { icon: Globe,  label: "Test 9"  },
  { icon: Rocket, label: "Test 10" },
].map((t, i) => ({ ...t, id: `temp-test-${i}` as PanelId } satisfies NavItem))

interface IconStripProps {
  activePanel: PanelId | null;
  onPanelChange: (panel: PanelId) => void;
}

export default function IconStrip({ activePanel, onPanelChange }: IconStripProps) {
  const unreadCount   = useNotificationsStore((s) => s.unreadCount)
  const sidebarOrder  = useSettingsStore((s) => s.sidebarOrder)
  const hiddenPanels  = useSettingsStore((s) => s.hiddenPanels)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp]     = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const orderedNavItems = useMemo(
    () =>
      sidebarOrder
        .filter((id) => !hiddenPanels.includes(id))
        .map((id) => ALL_NAV_META[id])
        .filter((item): item is NavItem => item !== undefined),
    [sidebarOrder, hiddenPanels],
  )

  const updateScrollIndicators = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollUp(el.scrollTop > 0)
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollIndicators()
    el.addEventListener("scroll", updateScrollIndicators, { passive: true })
    const observer = new ResizeObserver(updateScrollIndicators)
    observer.observe(el)
    for (const child of Array.from(el.children)) observer.observe(child)
    return () => {
      el.removeEventListener("scroll", updateScrollIndicators)
      observer.disconnect()
    }
  }, [updateScrollIndicators, orderedNavItems.length])

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ top: direction * el.clientHeight, behavior: "smooth" })
  }

  return (
    <div className="flex h-full w-[60px] flex-col items-center bg-[#1e1e2e] py-4">
      <div className="relative min-h-0 w-full flex-1">
        <div
          ref={scrollRef}
          className="scrollbar-hide flex h-full flex-col items-center gap-1 overflow-y-auto"
        >
          {orderedNavItems.map((item) => {
            if (item.id === "alerts") {
              return (
                <div key="alerts" className="relative shrink-0">
                  <NavIcon
                    item={item}
                    isActive={activePanel === item.id}
                    onClick={() => onPanelChange(item.id)}
                  />
                  {unreadCount > 0 && (
                    <span className="pointer-events-none absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
              )
            }
            return (
              <div key={item.id} className="shrink-0">
                <NavIcon
                  item={item}
                  isActive={activePanel === item.id}
                  onClick={() => onPanelChange(item.id)}
                />
              </div>
            )
          })}
          {/* TEMP-SCROLL-TEST: eliminar tras la prueba */}
          {TEMP_TEST_ITEMS.map((item) => (
            <div key={item.id} className="shrink-0">
              <NavIcon item={item} isActive={false} onClick={() => {}} />
            </div>
          ))}
        </div>
        {canScrollUp && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-4 items-start justify-center bg-gradient-to-b from-[#1e1e2e] to-transparent">
            <button
              onClick={() => scrollByPage(-1)}
              aria-label="Desplazar iconos hacia arriba"
              className="pointer-events-auto text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ChevronUp size={14} />
            </button>
          </div>
        )}
        {canScrollDown && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-4 items-end justify-center bg-gradient-to-t from-[#1e1e2e] to-transparent">
            <button
              onClick={() => scrollByPage(1)}
              aria-label="Desplazar iconos hacia abajo"
              className="pointer-events-auto text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="mt-1 flex flex-col items-center gap-1">
        <NavIcon
          item={settingsItem}
          isActive={activePanel === "settings"}
          onClick={() => onPanelChange("settings")}
        />
        <button
          onClick={() => getCurrentWindow().close()}
          title="Cerrar aplicación"
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
