import { useState, useCallback } from "react";
import type { PanelId } from "../../types";
import HomePanel from "./HomePanel";
import FilesPanel from "./FilesPanel";
import ChatPanel from "./ChatPanel";
import AlertsPanel from "./AlertsPanel";
import SnippetsPanel from "./SnippetsPanel";
import ProfilePanel from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";

const PANEL_MAP: Record<PanelId, React.ComponentType> = {
  home: HomePanel,
  files: FilesPanel,
  chat: ChatPanel,
  alerts: AlertsPanel,
  snippets: SnippetsPanel,
  profile: ProfilePanel,
  settings: SettingsPanel,
};

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;

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
      className={`relative h-full overflow-hidden bg-[#13131f] ${
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
