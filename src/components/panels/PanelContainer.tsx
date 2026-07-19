import { useState, useCallback, useEffect } from "react";
import { INITIAL_SIDEBAR_POSITION, useSettingsStore } from "../../store/settingsStore";
import type { PanelId } from "../../types";
import PanelErrorBoundary from "../shared/PanelErrorBoundary";
import PanelHeader from "./PanelHeader";
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
import ToolsPanel from "./ToolsPanel";

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
  tools:    ToolsPanel,
  services: ServicesPanel,
};

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;

// Bar docked right → panel's free edge (resize handle) is its left border and
// dragging toward the left increases width. Docked left → all mirrored.
const DOCKED_LEFT = INITIAL_SIDEBAR_POSITION === "left";

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
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onClose: () => void;
}

export default function PanelContainer({
  activePanel,
  panelWidth,
  onWidthChange,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onClose,
}: PanelContainerProps) {
  const [localWidth, setLocalWidth] = useState(panelWidth);
  const [isDragging, setIsDragging] = useState(false);

  // Sync when Settings slider changes the prop (but not during manual drag)
  useEffect(() => {
    if (!isDragging) setLocalWidth(panelWidth);
  }, [panelWidth, isDragging]);

  const panelBackground = useSettingsStore((s) => s.panelBackground);
  const bgClass = BG_CLASSES[panelBackground] ?? BG_CLASSES.default;

  const isNotesActive = activePanel === "notes";
  const isTasksActive = activePanel === "tasks";
  const isSnippetsActive = activePanel === "snippets";
  const OtherActivePanel =
    activePanel &&
    activePanel !== "notes" &&
    activePanel !== "tasks" &&
    activePanel !== "snippets"
      ? PANEL_MAP[activePanel]
      : null;

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = localWidth;
      setIsDragging(true);

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = DOCKED_LEFT ? ev.clientX - startX : startX - ev.clientX;
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
        setLocalWidth(newWidth);
      };

      const handleMouseUp = (ev: MouseEvent) => {
        const delta = DOCKED_LEFT ? ev.clientX - startX : startX - ev.clientX;
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
      {/* Resize handle — free edge of the panel (opposite the icon strip) */}
      {activePanel && (
        <div
          className={`absolute ${DOCKED_LEFT ? "right-0" : "left-0"} top-0 z-10 h-full w-1 cursor-ew-resize hover:bg-blue-500/50 active:bg-blue-500/70 transition-colors`}
          onMouseDown={handleResizeStart}
        />
      )}

      <div style={{ width: localWidth }} className="flex h-full flex-col">
        {activePanel && (
          <PanelHeader
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onBack={onBack}
            onForward={onForward}
            onClose={onClose}
          />
        )}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {/* Notas se mantiene siempre montado para no perder el borrador de
              "Nueva nota" al cambiar de panel y volver */}
          <div className="absolute inset-0" style={{ display: isNotesActive ? "block" : "none" }}>
            <PanelErrorBoundary resetKey="notes">
              <NotesPanel />
            </PanelErrorBoundary>
          </div>
          {/* Tareas se mantiene siempre montado para no perder el borrador de
              "Nueva tarea" al cambiar de panel y volver */}
          <div className="absolute inset-0" style={{ display: isTasksActive ? "block" : "none" }}>
            <PanelErrorBoundary resetKey="tasks">
              <TasksPanel />
            </PanelErrorBoundary>
          </div>
          {/* Snippets se mantiene siempre montado para no perder el borrador de
              "Nuevo snippet" al cambiar de panel y volver */}
          <div className="absolute inset-0" style={{ display: isSnippetsActive ? "block" : "none" }}>
            <PanelErrorBoundary resetKey="snippets">
              <SnippetsPanel />
            </PanelErrorBoundary>
          </div>
          {OtherActivePanel && (
            <div className="absolute inset-0">
              <PanelErrorBoundary resetKey={activePanel ?? undefined}>
                <OtherActivePanel />
              </PanelErrorBoundary>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
