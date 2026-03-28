export type PanelId =
  | "home"
  | "files"
  | "chat"
  | "alerts"
  | "snippets"
  | "tasks"
  | "notes"
  | "profile"
  | "settings";

export interface NavItem {
  id: PanelId;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}
