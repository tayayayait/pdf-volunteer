import { Link } from "@tanstack/react-router";
import { APP_TITLE, ORGANIZATION_NAME } from "@/lib/pledge/labels";

export function AppHeader({ rightSlot }: { rightSlot?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[var(--color-line)] bg-[var(--color-campus-navy)] text-white">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6">
        <Link to="/" className="flex items-baseline gap-3">
          <span className="text-[14px] font-bold tracking-wide opacity-80">
            {ORGANIZATION_NAME}
          </span>
          <span className="h-4 w-px bg-white/20" />
          <span className="text-[16px] font-bold">{APP_TITLE}</span>
        </Link>
        {rightSlot && <div className="flex items-center gap-3">{rightSlot}</div>}
      </div>
    </header>
  );
}
