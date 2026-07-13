import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar";
import { useWakeReload } from "./hooks/useWakeReload";
import { useNotificationsPoller } from "./features/notifications/useNotificationsPoller";
import { useNavigationStore } from "./store/navigationStore";
import { useSettingsStore } from "./store/settingsStore";
import type { PanelId } from "./types";

const ICON_WIDTH = 60;

function App() {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);

  // Reload the WebView after resume-from-suspend (blank/frozen recovery).
  useWakeReload();

  const storePanelWidth    = useSettingsStore((s) => s.panelWidth);
  const setStorePanelWidth = useSettingsStore((s) => s.setPanelWidth);
  const [panelWidth, setPanelWidth] = useState(storePanelWidth);

  // Ref keeps activePanel readable inside the storePanelWidth effect without stale closure
  const activePanelRef = useRef<PanelId | null>(null);
  useEffect(() => { activePanelRef.current = activePanel; }, [activePanel]);

  // When Settings slider changes the stored width → resize the window live
  useEffect(() => {
    setPanelWidth(storePanelWidth);
    if (activePanelRef.current) {
      invoke("resize_appbar", { width: ICON_WIDTH + storePanelWidth }).catch(console.error);
    }
  }, [storePanelWidth]);

  useNotificationsPoller(activePanel);

  const pendingPanel = useNavigationStore((s) => s.pendingPanel);
  const clearPending = useNavigationStore((s) => s.clearPending);
  useEffect(() => {
    if (pendingPanel) { handlePanelChange(pendingPanel); clearPending(); }
  }, [pendingPanel]);

  // No cleanup on purpose: with StrictMode's double-mount the three async
  // invokes (register #1 → unregister #1 → register #2) have no ordering
  // guarantee — if the unregister lands last the appbar ends up unregistered
  // (no reserved work-area, resize_appbar becomes a no-op → sliver panel).
  // Real teardown is handled natively by the Destroyed handler in lib.rs.
  useEffect(() => {
    invoke("register_appbar", { width: ICON_WIDTH }).catch(console.error);
  }, []);

  const handlePanelChange = async (panel: PanelId) => {
    const newPanel = activePanel === panel ? null : panel;
    const newWidth = newPanel ? ICON_WIDTH + panelWidth : ICON_WIDTH;
    setActivePanel(newPanel);
    await invoke("resize_appbar", { width: newWidth }).catch(console.error);
  };

  const handlePanelWidthChange = async (newWidth: number) => {
    setPanelWidth(newWidth);
    setStorePanelWidth(newWidth);
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
