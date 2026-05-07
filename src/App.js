import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { generate, listHistory } from "./api";
import { JobStatus } from "./components/JobStatus";
import { PromptForm } from "./components/PromptForm";
import { Topbar } from "./components/Topbar";
import { Button } from "./components/ui/Button";
import { Card } from "./components/ui/Card";
import { usePolling } from "./hooks/usePolling";
import { cn } from "./lib/cn";
const PAGE_SIZE = 10;
function VideoCardSkeleton() {
    return (_jsxs(Card, { className: "overflow-hidden rounded-xl p-0 animate-pulse", children: [_jsx("div", { className: "aspect-video w-full bg-border" }), _jsx("div", { className: "border-t border-border px-3 py-3", children: _jsx("div", { className: "h-3 w-32 rounded bg-border" }) })] }));
}
export default function App() {
    const [operationName, setOperationName] = useState(null);
    const [submitError, setSubmitError] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const { result, error } = usePolling(operationName);
    const isRunning = !!operationName && (!result || result.state === "running");
    const loadInitial = useCallback(async () => {
        setInitialLoading(true);
        try {
            const page = await listHistory(PAGE_SIZE, 0);
            setHistory(page.items);
            setHistoryTotal(page.total);
            setHasMore(page.hasMore);
            setOffset(PAGE_SIZE);
        }
        catch {
            // silently ignore history errors — generation still works
        }
        finally {
            setInitialLoading(false);
        }
    }, []);
    const loadMore = useCallback(async () => {
        if (loadingMore)
            return;
        setLoadingMore(true);
        try {
            const page = await listHistory(PAGE_SIZE, offset);
            setHistory((prev) => [...prev, ...page.items]);
            setHistoryTotal(page.total);
            setHasMore(page.hasMore);
            setOffset((prev) => prev + PAGE_SIZE);
        }
        catch {
            // silently ignore
        }
        finally {
            setLoadingMore(false);
        }
    }, [offset, loadingMore]);
    useEffect(() => {
        loadInitial();
    }, [loadInitial]);
    useEffect(() => {
        if (result?.state === "done") {
            loadInitial();
        }
    }, [result?.state, loadInitial]);
    async function handleSubmit(params) {
        setSubmitError(null);
        setOperationName(null);
        try {
            const { operationName: op } = await generate(params);
            setOperationName(op);
        }
        catch (err) {
            setSubmitError(err instanceof Error ? err.message : String(err));
        }
    }
    const showHistory = initialLoading || history.length > 0;
    return (_jsxs("div", { className: "min-h-screen bg-canvas text-fg", children: [_jsx(Topbar, {}), _jsxs("main", { className: "mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14", children: [_jsxs("div", { className: "mb-8 text-center", children: [_jsx("h1", { className: "text-3xl font-semibold tracking-tight text-fg sm:text-4xl", children: "Generate cinematic video" }), _jsx("p", { className: "mt-2 text-sm text-fg-muted sm:text-base", children: "Type a prompt, drop an image, or define start and end frames." })] }), _jsx(Card, { className: "p-5 sm:p-7", children: _jsx(PromptForm, { onSubmit: handleSubmit, disabled: isRunning }) }), submitError && (_jsx("div", { className: "mt-4 rounded-lg border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger", children: submitError })), operationName && (_jsx("div", { className: "mt-6", children: _jsx(JobStatus, { operationName: operationName, result: result, error: error }) })), showHistory && (_jsxs("section", { className: "mt-14", children: [_jsx("div", { className: "mb-5 flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight text-fg", children: "Recent videos" }), !initialLoading && (_jsxs("p", { className: "mt-0.5 text-xs text-fg-subtle", children: ["Last 7 days \u00B7 ", historyTotal, " ", historyTotal === 1 ? "clip" : "clips"] }))] }) }), _jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: initialLoading
                                    ? Array.from({ length: 6 }).map((_, i) => _jsx(VideoCardSkeleton, {}, i))
                                    : history.map((item) => (_jsxs(Card, { className: "group overflow-hidden rounded-xl p-0 transition-shadow hover:shadow-md", children: [_jsx("div", { className: "aspect-video w-full overflow-hidden bg-black", children: _jsx("video", { src: item.signedUrl, controls: true, preload: "metadata", className: "block h-full w-full object-contain" }) }), _jsx("div", { className: "border-t border-border px-3 py-3 text-xs text-fg-muted", children: new Date(item.created).toLocaleString(undefined, {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                }) })] }, item.name))) }), !initialLoading && (hasMore || loadingMore) && (_jsxs("div", { className: "mt-6 flex flex-col items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "md", onClick: loadMore, disabled: loadingMore, className: cn("min-w-36", loadingMore && "cursor-not-allowed"), children: loadingMore ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 15, className: "animate-spin" }), "Loading\u2026"] })) : ("Load more") }), _jsxs("p", { className: "text-xs text-fg-subtle", children: ["Showing ", history.length, " of ", historyTotal] })] })), loadingMore && (_jsx("div", { className: "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: Array.from({ length: 3 }).map((_, i) => (_jsx(VideoCardSkeleton, {}, `more-${i}`))) })), !initialLoading && history.length === 0 && (_jsxs("div", { className: "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center", children: [_jsx("p", { className: "text-sm font-medium text-fg-muted", children: "No videos yet" }), _jsx("p", { className: "text-xs text-fg-subtle", children: "Generate your first clip above." })] }))] }))] }), _jsx("footer", { className: "border-t border-border py-6 text-center text-xs text-fg-subtle", children: "Veo Studio \u00B7 Powered by Vertex AI" })] }));
}
