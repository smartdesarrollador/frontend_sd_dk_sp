import type { PanelId } from "../types";
import IconStrip from "./IconStrip";
import PanelContainer from "./panels/PanelContainer";

interface SidebarProps {
  activePanel: PanelId | null;
  onPanelChange: (panel: PanelId) => void;
  panelWidth: number;
  onPanelWidthChange: (width: number) => void;
}

export default function Sidebar({
  activePanel,
  onPanelChange,
  panelWidth,
  onPanelWidthChange,
}: SidebarProps) {
  return (
    <div className="flex h-full w-full flex-row-reverse">
      <IconStrip activePanel={activePanel} onPanelChange={onPanelChange} />
      <PanelContainer
        activePanel={activePanel}
        panelWidth={panelWidth}
        onWidthChange={onPanelWidthChange}
      />
    </div>
  );
}
