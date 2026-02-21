import type { PanelId } from "../../types";
import HomePanel from "./HomePanel";
import FilesPanel from "./FilesPanel";
import ChatPanel from "./ChatPanel";
import AlertsPanel from "./AlertsPanel";
import ProfilePanel from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";

const PANEL_MAP: Record<PanelId, React.ComponentType> = {
  home: HomePanel,
  files: FilesPanel,
  chat: ChatPanel,
  alerts: AlertsPanel,
  profile: ProfilePanel,
  settings: SettingsPanel,
};

interface PanelContainerProps {
  activePanel: PanelId | null;
}

export default function PanelContainer({ activePanel }: PanelContainerProps) {
  const ActivePanel = activePanel ? PANEL_MAP[activePanel] : null;
  return (
    <div
      className={`h-full overflow-hidden bg-[#13131f] transition-all duration-200 ${
        activePanel ? "w-[280px]" : "w-0"
      }`}
    >
      <div className="h-full w-[280px]">
        {ActivePanel && <ActivePanel />}
      </div>
    </div>
  );
}
