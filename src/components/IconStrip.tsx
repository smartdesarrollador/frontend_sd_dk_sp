import { Home, Files, MessageSquare, Bell, Code2, CheckSquare, StickyNote, Users, Bookmark, User, Settings } from "lucide-react";
import type { PanelId, NavItem } from "../types";
import NavIcon from "./NavIcon";

const mainNavItems: NavItem[] = [
  { id: "home", icon: Home, label: "Home" },
  { id: "files", icon: Files, label: "Files" },
  { id: "chat", icon: MessageSquare, label: "Chat" },
  { id: "alerts", icon: Bell, label: "Alerts" },
  { id: "snippets", icon: Code2, label: "Snippets" },
  { id: "tasks", icon: CheckSquare, label: "Tasks" },
  { id: "notes", icon: StickyNote, label: "Notes" },
  { id: "contacts",  icon: Users,    label: "Contacts"  },
  { id: "bookmarks", icon: Bookmark, label: "Bookmarks" },
  { id: "profile",   icon: User,     label: "Profile"   },
];

const bottomNavItems: NavItem[] = [
  { id: "settings", icon: Settings, label: "Settings" },
];

interface IconStripProps {
  activePanel: PanelId | null;
  onPanelChange: (panel: PanelId) => void;
}

export default function IconStrip({ activePanel, onPanelChange }: IconStripProps) {
  return (
    <div className="flex h-full w-[60px] flex-col items-center justify-between bg-[#1e1e2e] py-4">
      <div className="flex flex-col items-center gap-1">
        {mainNavItems.map((item) => (
          <NavIcon
            key={item.id}
            item={item}
            isActive={activePanel === item.id}
            onClick={() => onPanelChange(item.id)}
          />
        ))}
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
      </div>
    </div>
  );
}
