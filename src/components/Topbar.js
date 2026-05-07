import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
export function Topbar() {
    return (_jsx("header", { className: "sticky top-0 z-20 border-b border-border bg-canvas/70 backdrop-blur-md", children: _jsxs("div", { className: "mx-auto flex h-14 max-w-5xl items-center justify-between px-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-fg", children: _jsx(Sparkles, { size: 15 }) }), _jsx("span", { className: "text-base font-semibold tracking-tight text-fg", children: "Veo Studio" })] }), _jsx(ThemeToggle, {})] }) }));
}
