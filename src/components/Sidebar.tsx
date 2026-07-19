import type { PanelId } from "../types";
import { INITIAL_SIDEBAR_POSITION } from "../store/settingsStore";
import IconStrip from "./IconStrip";
import PanelContainer from "./panels/PanelContainer";

interface SidebarProps {
  activePanel: PanelId | null;
  onPanelChange: (panel: PanelId) => void;
  panelWidth: number;
  onPanelWidthChange: (width: number) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onClose: () => void;
}

export default function Sidebar({
  activePanel,
  onPanelChange,
  panelWidth,
  onPanelWidthChange,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onClose,
}: SidebarProps) {
  // Docked right: icon strip on the right, panel opens to its left
  // (flex-row-reverse). Docked left: mirrored with plain flex-row.
  const rowDirection =
    INITIAL_SIDEBAR_POSITION === "left" ? "flex-row" : "flex-row-reverse";

  return (
    <div className={`flex h-full w-full ${rowDirection}`}>
      <IconStrip activePanel={activePanel} onPanelChange={onPanelChange} />
      <PanelContainer
        activePanel={activePanel}
        panelWidth={panelWidth}
        onWidthChange={onPanelWidthChange}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={onBack}
        onForward={onForward}
        onClose={onClose}
      />
    </div>
  );
}
