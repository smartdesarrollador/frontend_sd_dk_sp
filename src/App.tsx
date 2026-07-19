import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar";
import { useWakeReload } from "./hooks/useWakeReload";
import { useNotificationsPoller } from "./features/notifications/useNotificationsPoller";
import { useNavigationStore } from "./store/navigationStore";
import { INITIAL_SIDEBAR_POSITION, useSettingsStore } from "./store/settingsStore";
import { useAuthStore } from "./store/authStore";
import type { PanelId } from "./types";

const ICON_WIDTH = 60;

// Paneles usables sin sesión. Sin autenticar, cualquier otro icono redirige a
// Perfil, que tiene el botón "Iniciar sesión" a la mano.
const AUTH_FREE_PANELS: PanelId[] = ["profile", "settings", "tools"];

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
  const pushHistory  = useNavigationStore((s) => s.push);
  const historyBack     = useNavigationStore((s) => s.back);
  const historyForward  = useNavigationStore((s) => s.forward);
  const canGoBack    = useNavigationStore((s) => s.index > 0);
  const canGoForward = useNavigationStore((s) => s.index < s.history.length - 1);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const resolvePanel = (panel: PanelId): PanelId =>
    isAuthenticated || AUTH_FREE_PANELS.includes(panel) ? panel : "profile";

  useEffect(() => {
    if (pendingPanel) {
      const target = resolvePanel(pendingPanel);
      if (target !== activePanel) openPanel(target, true);
      clearPending();
    }
  }, [pendingPanel]);

  // No cleanup on purpose: with StrictMode's double-mount the three async
  // invokes (register #1 → unregister #1 → register #2) have no ordering
  // guarantee — if the unregister lands last the appbar ends up unregistered
  // (no reserved work-area, resize_appbar becomes a no-op → sliver panel).
  // Real teardown is handled natively by the Destroyed handler in lib.rs.
  useEffect(() => {
    // Edge is the value captured at page load on purpose: Settings applies a
    // change by reloading the WebView, which re-runs this registration with
    // the fresh localStorage value (same recovery path as useWakeReload).
    invoke("register_appbar", { width: ICON_WIDTH, edge: INITIAL_SIDEBAR_POSITION }).catch(console.error);
  }, []);

  const openPanel = async (panel: PanelId, record: boolean) => {
    setActivePanel(panel);
    if (record) pushHistory(panel);
    await invoke("resize_appbar", { width: ICON_WIDTH + panelWidth }).catch(console.error);
  };

  // Colapsa a la tira de iconos sin tocar el historial (reabrir lo conserva)
  const closePanel = async () => {
    setActivePanel(null);
    await invoke("resize_appbar", { width: ICON_WIDTH }).catch(console.error);
  };

  const handlePanelChange = async (panel: PanelId) => {
    const target = resolvePanel(panel);
    // Redirigido a Perfil: sin toggle — clickear otro icono con Perfil ya
    // abierto no debe cerrar el panel
    if (target !== panel) {
      if (activePanel !== target) await openPanel(target, true);
      return;
    }
    if (activePanel === panel) await closePanel();
    else await openPanel(panel, true);
  };

  const handleBack = async () => {
    const target = historyBack();
    if (target) await openPanel(target, false);
  };

  const handleForward = async () => {
    const target = historyForward();
    if (target) await openPanel(target, false);
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
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={handleBack}
        onForward={handleForward}
        onClose={closePanel}
      />
    </div>
  );
}

export default App;
