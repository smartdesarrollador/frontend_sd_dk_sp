import { useMemo } from "react"
import {
  Home, Files, MessageSquare, Bell, Code2, CheckSquare,
  StickyNote, Users, Bookmark, FolderKanban, CalendarDays, User,
  Settings, X, ShieldCheck, Search, Sparkles, Wrench,
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

interface IconStripProps {
  activePanel: PanelId | null;
  onPanelChange: (panel: PanelId) => void;
}

export default function IconStrip({ activePanel, onPanelChange }: IconStripProps) {
  const unreadCount   = useNotificationsStore((s) => s.unreadCount)
  const sidebarOrder  = useSettingsStore((s) => s.sidebarOrder)
  const hiddenPanels  = useSettingsStore((s) => s.hiddenPanels)

  const orderedNavItems = useMemo(
    () =>
      sidebarOrder
        .filter((id) => !hiddenPanels.includes(id))
        .map((id) => ALL_NAV_META[id])
        .filter((item): item is NavItem => item !== undefined),
    [sidebarOrder, hiddenPanels],
  )

  return (
    <div className="flex h-full w-[60px] flex-col items-center justify-between bg-[#1e1e2e] py-4">
      <div className="flex flex-col items-center gap-1">
        {orderedNavItems.map((item) => {
          if (item.id === "alerts") {
            return (
              <div key="alerts" className="relative">
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
            <NavIcon
              key={item.id}
              item={item}
              isActive={activePanel === item.id}
              onClick={() => onPanelChange(item.id)}
            />
          )
        })}
      </div>
      <div className="flex flex-col items-center gap-1">
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
