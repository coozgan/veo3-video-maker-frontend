import { Sparkles } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-canvas/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-fg">
            <Sparkles size={15} />
          </span>
          <span className="text-base font-semibold tracking-tight text-fg">Veo Studio</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
