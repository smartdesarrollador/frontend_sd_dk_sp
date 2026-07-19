import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PanelId } from "../../types";
import { ALL_NAV_META } from "../../lib/navMeta";
import { ACCENT_BG } from "../NavIcon";
import ContextMenu from "../shared/ContextMenu";
import { MAX_PINNED_PANELS, useSettingsStore } from "../../store/settingsStore";
import { useNavigationStore } from "../../store/navigationStore";

interface PanelHeaderProps {
  activePanel: PanelId;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onClose: () => void;
}

const NAV_BTN_BASE =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors";

export default function PanelHeader({
  activePanel,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onClose,
}: PanelHeaderProps) {
  const pinnedPanels = useSettingsStore((s) => s.pinnedPanels);
  const togglePinnedPanel = useSettingsStore((s) => s.togglePinnedPanel);
  const accentColor = useSettingsStore((s) => s.accentColor);
  const navigateTo = useNavigationStore((s) => s.navigateTo);

  const accentBg = ACCENT_BG[accentColor] ?? ACCENT_BG.blue;

  // Menú contextual: click derecho en la barra → fijar/desfijar el panel
  // abierto; click derecho en un icono fijado → desfijar ese panel
  const [menu, setMenu] = useState<{ x: number; y: number; panel: PanelId } | null>(null);

  const openMenu = (panel: PanelId) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, panel });
  };

  return (
    <div
      className="flex h-9 shrink-0 items-center border-b border-white/10 px-2"
      onContextMenu={openMenu(activePanel)}
    >
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          title="Panel anterior"
          aria-label="Panel anterior"
          className={`${NAV_BTN_BASE} ${
            canGoBack
              ? "text-gray-400 hover:bg-white/10 hover:text-gray-200"
              : "cursor-default text-white/20"
          }`}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={onForward}
          disabled={!canGoForward}
          title="Panel siguiente"
          aria-label="Panel siguiente"
          className={`${NAV_BTN_BASE} ${
            canGoForward
              ? "text-gray-400 hover:bg-white/10 hover:text-gray-200"
              : "cursor-default text-white/20"
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Accesos rápidos: paneles fijados (click derecho para fijar/desfijar) */}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-hidden px-1">
        {pinnedPanels.map((id) => {
          const item = ALL_NAV_META[id];
          if (!item) return null;
          const Icon = item.icon;
          const isActive = id === activePanel;
          return (
            <button
              key={id}
              onClick={() => navigateTo(id)}
              onContextMenu={openMenu(id)}
              title={item.label}
              aria-label={item.label}
              className={`${NAV_BTN_BASE} ${
                isActive
                  ? `${accentBg} text-white`
                  : "text-gray-400 hover:bg-white/10 hover:text-gray-200"
              }`}
            >
              <Icon size={15} />
            </button>
          );
        })}
      </div>

      <button
        onClick={onClose}
        title="Cerrar panel"
        aria-label="Cerrar panel"
        className={`${NAV_BTN_BASE} text-gray-400 hover:bg-red-500/10 hover:text-red-400`}
      >
        <X size={16} />
      </button>

      {menu && (() => {
        const isPinned = pinnedPanels.includes(menu.panel);
        const pinFull = !isPinned && pinnedPanels.length >= MAX_PINNED_PANELS;
        return (
          <ContextMenu
            x={menu.x}
            y={menu.y}
            onClose={() => setMenu(null)}
            items={[
              {
                label: isPinned
                  ? "Desfijar de la barra de control"
                  : pinFull
                    ? `Fijar (máximo ${MAX_PINNED_PANELS} fijados)`
                    : "Fijar en la barra de control",
                disabled: pinFull,
                onClick: () => togglePinnedPanel(menu.panel),
              },
            ]}
          />
        );
      })()}
    </div>
  );
}
