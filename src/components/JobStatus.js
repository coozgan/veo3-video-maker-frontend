import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
export function JobStatus({ operationName, result, error }) {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (!operationName || result?.state === "done" || result?.state === "failed")
            return;
        setElapsed(0);
        const t = setInterval(() => setElapsed((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, [operationName, result?.state]);
    if (!operationName)
        return null;
    if (error) {
        return (_jsxs(Card, { className: "flex items-start gap-3 border-danger/40 bg-danger-soft p-4", children: [_jsx(AlertCircle, { size: 18, className: "mt-0.5 shrink-0 text-danger" }), _jsxs("div", { className: "text-sm text-danger", children: [_jsx("p", { className: "font-medium", children: "Polling error" }), _jsx("p", { className: "opacity-80", children: error })] })] }));
    }
    if (result?.state === "failed") {
        return (_jsxs(Card, { className: "flex items-start gap-3 border-danger/40 bg-danger-soft p-4", children: [_jsx(AlertCircle, { size: 18, className: "mt-0.5 shrink-0 text-danger" }), _jsxs("div", { className: "text-sm text-danger", children: [_jsx("p", { className: "font-medium", children: "Generation failed" }), _jsx("p", { className: "opacity-80", children: result.error ?? "Unknown error" })] })] }));
    }
    if (!result || result.state === "running") {
        return (_jsxs(Card, { className: "flex flex-col gap-3 p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Loader2, { size: 16, className: "animate-spin text-accent" }), _jsx("span", { className: "font-medium text-fg", children: "Generating\u2026" }), _jsxs("span", { className: "text-fg-muted", children: [elapsed, "s elapsed"] })] }), _jsx("div", { className: "bar-indeterminate h-1.5 w-full rounded-full" }), _jsx("p", { className: "text-xs text-fg-subtle", children: "Veo typically takes 30 seconds to a few minutes per clip. You can leave this tab open." })] }));
    }
    return (_jsxs(Card, { className: "overflow-hidden p-0", children: [_jsx("video", { src: result.videoUrl, controls: true, autoPlay: true, loop: true, className: "block w-full bg-black" }), _jsxs("div", { className: "flex items-center justify-between gap-3 border-t border-border px-4 py-3", children: [_jsx("span", { className: "text-sm text-fg-muted", children: "Your video is ready." }), _jsx("a", { href: result.videoUrl, download: true, children: _jsxs(Button, { variant: "outline", size: "sm", type: "button", children: [_jsx(Download, { size: 14 }), "Download"] }) })] })] }));
}
