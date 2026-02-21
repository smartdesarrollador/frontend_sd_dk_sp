import type { NavItem } from "../types";

interface NavIconProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

export default function NavIcon({ item, isActive, onClick }: NavIconProps) {
  const Icon = item.icon;
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        title={item.label}
        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
        }`}
      >
        <Icon size={20} />
      </button>
      <div className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-gray-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {item.label}
      </div>
    </div>
  );
}
