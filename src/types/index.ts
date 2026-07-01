export type PanelId =
  | "home"
  | "search"
  | "files"
  | "chat"
  | "alerts"
  | "snippets"
  | "tasks"
  | "notes"
  | "contacts"
  | "bookmarks"
  | "projects"
  | "calendar"
  | "profile"
  | "settings"
  | "vault"
  | "services";

import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: PanelId;
  icon: LucideIcon;
  label: string;
}
