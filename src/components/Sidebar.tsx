import type { PanelId } from "../types";
import IconStrip from "./IconStrip";
import PanelContainer from "./panels/PanelContainer";

interface SidebarProps {
  activePanel: PanelId | null;
  onPanelChange: (panel: PanelId) => void;
}

export default function Sidebar({ activePanel, onPanelChange }: SidebarProps) {
  return (
    <div className="flex h-full w-full flex-row-reverse">
      <IconStrip activePanel={activePanel} onPanelChange={onPanelChange} />
      <PanelContainer activePanel={activePanel} />
    </div>
  );
}
