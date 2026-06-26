import { Home, Files, MessageSquare, Bell, Code2, CheckSquare, StickyNote, Users, Bookmark, FolderKanban, CalendarDays, User, Settings, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { PanelId, NavItem } from "../types";
import NavIcon from "./NavIcon";
import { useNotificationsStore } from "../store/notificationsStore";

const mainNavItems: NavItem[] = [
  { id: "home", icon: Home, label: "Home" },
  { id: "files", icon: Files, label: "Files" },
  { id: "chat", icon: MessageSquare, label: "Chat" },
  { id: "alerts", icon: Bell, label: "Alerts" },
  { id: "snippets", icon: Code2, label: "Snippets" },
  { id: "tasks", icon: CheckSquare, label: "Tasks" },
  { id: "notes", icon: StickyNote, label: "Notes" },
  { id: "contacts",  icon: Users,    label: "Contacts"  },
  { id: "bookmarks", icon: Bookmark,     label: "Bookmarks" },
  { id: "projects",  icon: FolderKanban, label: "Projects"  },
  { id: "calendar",  icon: CalendarDays, label: "Calendar"  },
  { id: "profile",   icon: User,         label: "Profile"   },
];

const bottomNavItems: NavItem[] = [
  { id: "settings", icon: Settings, label: "Settings" },
];

interface IconStripProps {
  activePanel: PanelId | null;
  onPanelChange: (panel: PanelId) => void;
}

export default function IconStrip({ activePanel, onPanelChange }: IconStripProps) {
  const unreadCount = useNotificationsStore((s) => s.unreadCount)

  return (
    <div className="flex h-full w-[60px] flex-col items-center justify-between bg-[#1e1e2e] py-4">
      <div className="flex flex-col items-center gap-1">
        {mainNavItems.map((item) => {
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
        {bottomNavItems.map((item) => (
          <NavIcon
            key={item.id}
            item={item}
            isActive={activePanel === item.id}
            onClick={() => onPanelChange(item.id)}
          />
        ))}
        <button
          onClick={() => getCurrentWindow().close()}
          title="Cerrar aplicación"
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
