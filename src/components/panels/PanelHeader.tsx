import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface PanelHeaderProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onClose: () => void;
}

const NAV_BTN_BASE =
  "flex h-6 w-6 items-center justify-center rounded transition-colors";

export default function PanelHeader({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onClose,
}: PanelHeaderProps) {
  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/10 px-2">
      <div className="flex items-center gap-1">
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
      <button
        onClick={onClose}
        title="Cerrar panel"
        aria-label="Cerrar panel"
        className={`${NAV_BTN_BASE} text-gray-400 hover:bg-red-500/10 hover:text-red-400`}
      >
        <X size={16} />
      </button>
    </div>
  );
}
