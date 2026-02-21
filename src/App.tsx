import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar";
import type { PanelId } from "./types";

const ICON_WIDTH = 60;
const DEFAULT_PANEL_WIDTH = 320;

function App() {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);

  useEffect(() => {
    invoke("register_appbar", { width: ICON_WIDTH }).catch(console.error);
    return () => {
      invoke("unregister_appbar").catch(console.error);
    };
  }, []);

  const handlePanelChange = async (panel: PanelId) => {
    const newPanel = activePanel === panel ? null : panel;
    const newWidth = newPanel ? ICON_WIDTH + panelWidth : ICON_WIDTH;
    setActivePanel(newPanel);
    await invoke("resize_appbar", { width: newWidth }).catch(console.error);
  };

  const handlePanelWidthChange = async (newWidth: number) => {
    setPanelWidth(newWidth);
    if (activePanel) {
      await invoke("resize_appbar", { width: ICON_WIDTH + newWidth }).catch(console.error);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        activePanel={activePanel}
        onPanelChange={handlePanelChange}
        panelWidth={panelWidth}
        onPanelWidthChange={handlePanelWidthChange}
      />
    </div>
  );
}

export default App;
