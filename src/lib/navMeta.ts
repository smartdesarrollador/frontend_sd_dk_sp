import {
  Home, Files, MessageSquare, Bell, Code2, CheckSquare,
  StickyNote, Users, Bookmark, FolderKanban, CalendarDays, User,
  ShieldCheck, Search, Sparkles, Wrench,
} from "lucide-react"
import type { PanelId, NavItem } from "../types"

// Metadatos (icono + label) de cada panel navegable. Compartidos entre la
// tira de iconos (IconStrip) y los accesos fijados de la barra de control
// del panel (PanelHeader).
export const ALL_NAV_META: Partial<Record<PanelId, NavItem>> = {
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
