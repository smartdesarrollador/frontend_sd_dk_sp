import { useState, useCallback, useEffect } from "react";
import { useSettingsStore } from "../../store/settingsStore";
import type { PanelId } from "../../types";
import HomePanel from "./HomePanel";
import FilesPanel from "./FilesPanel";
import ChatPanel from "./ChatPanel";
import AlertsPanel from "./AlertsPanel";
import SnippetsPanel from "./SnippetsPanel";
import TasksPanel from "./TasksPanel";
import NotesPanel from "./NotesPanel";
import ContactsPanel from "./ContactsPanel";
import BookmarksPanel from "./BookmarksPanel";
import ProjectsPanel from "./ProjectsPanel";
import CalendarPanel from "./CalendarPanel";
import ProfilePanel from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";
import VaultPanel from "./VaultPanel";
import SearchPanel from "./SearchPanel";
import ServicesPanel from "./ServicesPanel";

const PANEL_MAP: Record<PanelId, React.ComponentType> = {
  home:   HomePanel,
  search: SearchPanel,
  files:  FilesPanel,
  chat: ChatPanel,
  alerts: AlertsPanel,
  snippets: SnippetsPanel,
  tasks: TasksPanel,
  notes: NotesPanel,
  contacts:  ContactsPanel,
  bookmarks: BookmarksPanel,
  projects:  ProjectsPanel,
  calendar:  CalendarPanel,
  profile:   ProfilePanel,
  settings: SettingsPanel,
  vault:    VaultPanel,
  services: ServicesPanel,
};

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;

const BG_CLASSES: Record<string, string> = {
  "default":          "bg-[#13131f]",
  "dark-blue":        "bg-[#0d1117]",
  "darker":           "bg-[#080810]",
  "gradient-purple":  "bg-gradient-to-b from-[#1a0a2e] to-[#13131f]",
  "gradient-blue":    "bg-gradient-to-b from-[#0a1628] to-[#13131f]",
  "gradient-teal":    "bg-gradient-to-b from-[#0a1a1a] to-[#13131f]",
};

interface PanelContainerProps {
  activePanel: PanelId | null;
  panelWidth: number;
  onWidthChange: (width: number) => void;
}

export default function PanelContainer({
  activePanel,
  panelWidth,
  onWidthChange,
}: PanelContainerProps) {
  const [localWidth, setLocalWidth] = useState(panelWidth);
  const [isDragging, setIsDragging] = useState(false);

  // Sync when Settings slider changes the prop (but not during manual drag)
  useEffect(() => {
    if (!isDragging) setLocalWidth(panelWidth);
  }, [panelWidth, isDragging]);

  const panelBackground = useSettingsStore((s) => s.panelBackground);
  const bgClass = BG_CLASSES[panelBackground] ?? BG_CLASSES.default;

  const ActivePanel = activePanel ? PANEL_MAP[activePanel] : null;

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = localWidth;
      setIsDragging(true);

      const handleMouseMove = (ev: MouseEvent) => {
        // Panel is on the right side: dragging left increases width
        const delta = startX - ev.clientX;
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
        setLocalWidth(newWidth);
      };

      const handleMouseUp = (ev: MouseEvent) => {
        const delta = startX - ev.clientX;
        const finalWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
        setLocalWidth(finalWidth);
        setIsDragging(false);
        onWidthChange(finalWidth);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [localWidth, onWidthChange]
  );

  return (
    <div
      className={`relative h-full overflow-hidden ${bgClass} ${
        !isDragging ? "transition-[width] duration-200" : ""
      }`}
      style={{ width: activePanel ? localWidth : 0 }}
    >
      {/* Resize handle — left edge of the panel */}
      {activePanel && (
        <div
          className="absolute left-0 top-0 z-10 h-full w-1 cursor-ew-resize hover:bg-blue-500/50 active:bg-blue-500/70 transition-colors"
          onMouseDown={handleResizeStart}
        />
      )}

      <div style={{ width: localWidth }} className="h-full">
        {ActivePanel && <ActivePanel />}
      </div>
    </div>
  );
}
