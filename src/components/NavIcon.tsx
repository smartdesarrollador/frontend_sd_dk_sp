import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { INITIAL_SIDEBAR_POSITION, useSettingsStore } from "../store/settingsStore"
import type { NavItem } from "../types";

const ACCENT_BG: Record<string, string> = {
  blue:   "bg-blue-600",
  purple: "bg-purple-600",
  green:  "bg-green-600",
  orange: "bg-orange-500",
  pink:   "bg-pink-600",
  red:    "bg-red-600",
}

// Bar docked right → tooltip opens toward the left of the strip (positioned
// via `right`). Docked left → toward the right (positioned via `left`).
interface TooltipPos {
  top: number;
  right?: number;
  left?: number;
}

interface NavIconProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

export default function NavIcon({ item, isActive, onClick }: NavIconProps) {
  const Icon = item.icon;
  const accentColor = useSettingsStore((s) => s.accentColor)
  const activeBg = ACCENT_BG[accentColor] ?? ACCENT_BG.blue
  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null)

  const showTooltip = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const top = rect.top + rect.height / 2
    setTooltipPos(
      INITIAL_SIDEBAR_POSITION === "left"
        ? { top, left: rect.right + 8 }
        : { top, right: window.innerWidth - rect.left + 8 },
    )
  }

  const hideTooltip = () => setTooltipPos(null)

  // The position is captured once on mouseenter; if the icon strip scrolls
  // underneath the cursor the tooltip would stay stranded — hide it instead.
  useEffect(() => {
    if (!tooltipPos) return
    const hide = () => setTooltipPos(null)
    window.addEventListener("scroll", hide, { capture: true, passive: true })
    return () => window.removeEventListener("scroll", hide, { capture: true })
  }, [tooltipPos])

  return (
    <>
      <button
        onClick={() => { hideTooltip(); onClick(); }}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        aria-label={item.label}
        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
          isActive
            ? `${activeBg} text-white`
            : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
        }`}
      >
        <Icon size={20} />
      </button>
      {tooltipPos &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-gray-200 shadow-lg"
            style={{ top: tooltipPos.top, right: tooltipPos.right, left: tooltipPos.left }}
          >
            {item.label}
          </div>,
          document.body,
        )}
    </>
  );
}
