import { useEffect } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const MENU_WIDTH = 180;
const ITEM_HEIGHT = 28;

// Menú contextual mínimo (portal a body, posición fija en el cursor).
// Se cierra con click fuera, Escape o scroll.
export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("mousedown", onClose);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onClose, { capture: true, passive: true });
    return () => {
      window.removeEventListener("mousedown", onClose);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onClose, { capture: true });
    };
  }, [onClose]);

  const left = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
  const top = Math.min(y, window.innerHeight - items.length * ITEM_HEIGHT - 12);

  return createPortal(
    <div
      className="fixed z-50 min-w-[140px] rounded-md border border-white/10 bg-gray-800 py-1 shadow-lg"
      style={{ top, left, maxWidth: MENU_WIDTH }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { if (!item.disabled) { onClose(); item.onClick(); } }}
          disabled={item.disabled}
          className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${
            item.disabled
              ? "cursor-default text-gray-500"
              : "text-gray-200 hover:bg-white/10"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
