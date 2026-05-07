import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { generate, GenerateParams, HistoryItem, listHistory } from "./api";
import { JobStatus } from "./components/JobStatus";
import { PromptForm } from "./components/PromptForm";
import { Topbar } from "./components/Topbar";
import { Button } from "./components/ui/Button";
import { Card } from "./components/ui/Card";
import { usePolling } from "./hooks/usePolling";
import { cn } from "./lib/cn";

const PAGE_SIZE = 10;

function VideoCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-xl p-0 animate-pulse">
      <div className="aspect-video w-full bg-border" />
      <div className="border-t border-border px-3 py-3">
        <div className="h-3 w-32 rounded bg-border" />
      </div>
    </Card>
  );
}

export default function App() {
  const [operationName, setOperationName] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
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
    } catch {
      // silently ignore history errors — generation still works
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listHistory(PAGE_SIZE, offset);
      setHistory((prev) => [...prev, ...page.items]);
      setHistoryTotal(page.total);
      setHasMore(page.hasMore);
      setOffset((prev) => prev + PAGE_SIZE);
    } catch {
      // silently ignore
    } finally {
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

  async function handleSubmit(params: GenerateParams) {
    setSubmitError(null);
    setOperationName(null);
    try {
      const { operationName: op } = await generate(params);
      setOperationName(op);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    }
  }

  const showHistory = initialLoading || history.length > 0;

  return (
    <div className="min-h-screen bg-canvas text-fg">
      <Topbar />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Generate cinematic video
          </h1>
          <p className="mt-2 text-sm text-fg-muted sm:text-base">
            Type a prompt, drop an image, or define start and end frames.
          </p>
        </div>

        <Card className="p-5 sm:p-7">
          <PromptForm onSubmit={handleSubmit} disabled={isRunning} />
        </Card>

        {submitError && (
          <div className="mt-4 rounded-lg border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger">
            {submitError}
          </div>
        )}

        {operationName && (
          <div className="mt-6">
            <JobStatus operationName={operationName} result={result} error={error} />
          </div>
        )}

        {showHistory && (
          <section className="mt-14">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-fg">Recent videos</h2>
                {!initialLoading && (
                  <p className="mt-0.5 text-xs text-fg-subtle">
                    Last 7 days · {historyTotal} {historyTotal === 1 ? "clip" : "clips"}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {initialLoading
                ? Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)
                : history.map((item) => (
                    <Card key={item.name} className="group overflow-hidden rounded-xl p-0 transition-shadow hover:shadow-md">
                      <div className="relative aspect-video w-full overflow-hidden bg-black">
                        <video
                          src={item.signedUrl}
                          controls
                          preload="metadata"
                          className="block h-full w-full object-contain"
                        />
                        {item.name.endsWith("/kling.mp4") && (
                          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent-soft/95 px-2 py-0.5 text-[11px] font-medium text-accent backdrop-blur">
                            <Sparkles size={10} />
                            Kling 3.0
                          </span>
                        )}
                        {item.name.endsWith("/wan.mp4") && (
                          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-fg/10 px-2 py-0.5 text-[11px] font-medium text-fg-muted backdrop-blur">
                            Wan 2.7
                          </span>
                        )}
                      </div>
                      <div className="border-t border-border px-3 py-3 text-xs text-fg-muted">
                        {new Date(item.created).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </Card>
                  ))}
            </div>

            {/* Load more row */}
            {!initialLoading && (hasMore || loadingMore) && (
              <div className="mt-6 flex flex-col items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className={cn("min-w-36", loadingMore && "cursor-not-allowed")}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Loading…
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
                <p className="text-xs text-fg-subtle">
                  Showing {history.length} of {historyTotal}
                </p>
              </div>
            )}

            {/* Skeleton row appended while loading more */}
            {loadingMore && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <VideoCardSkeleton key={`more-${i}`} />
                ))}
              </div>
            )}

            {/* Empty state — no videos in last 7 days */}
            {!initialLoading && history.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
                <p className="text-sm font-medium text-fg-muted">No videos yet</p>
                <p className="text-xs text-fg-subtle">Generate your first clip above.</p>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-fg-subtle">
        Veo Studio · Powered by Vertex AI
      </footer>
    </div>
  );
}
