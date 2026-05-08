import Icon from "@/components/ui/Icon";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-default bg-surface/95 px-5 py-1.5 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-bold uppercase text-foreground">
          AlignChat private limited
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2   px-3 text-xs uppercase sm:flex">
            <span className="font-bold">CURRENT PLAN :</span>
            <span className="font-semibold text-foreground">NO PLAN</span>
          </div>

          <button className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-strong">
            <Icon
              name="ri:arrow-up-line"
              size={16}
              className="mr-2"
              color="currentColor"
            />
            Buy Now
          </button>

          <button className="hidden h-9 w-9 items-center justify-center  text-foreground  transition hover:bg-surface-strong sm:inline-flex">
            <Icon
              name="ri:notification-3-line"
              size={18}
              color="currentColor"
            />
          </button>

          <button className="hidden h-9 w-9 items-center justify-center  text-foreground  transition hover:bg-surface-strong sm:inline-flex">
            <Icon name="ri:settings-3-line" size={16} color="currentColor" />
          </button>

          <ThemeToggle />

          <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-foreground text-foreground text-sm font-semibold shadow-lg shadow-slate-950/20 sm:inline-flex">
            R
          </div>
        </div>
      </div>
    </header>
  );
}
