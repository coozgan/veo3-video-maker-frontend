import { useEffect, useState } from "react";
import { AlertCircle, Download, Loader2, Sparkles } from "lucide-react";
import { StatusResult } from "../api";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

interface Props {
  operationName: string | null;
  result: StatusResult | null;
  error: string | null;
}

function WanBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
      <Sparkles size={11} />
      via Wan 2.7
    </span>
  );
}

export function JobStatus({ operationName, result, error }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!operationName || result?.state === "done" || result?.state === "failed") return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [operationName, result?.state]);

  if (!operationName) return null;

  if (error) {
    return (
      <Card className="flex items-start gap-3 border-danger/40 bg-danger-soft p-4">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" />
        <div className="text-sm text-danger">
          <p className="font-medium">Polling error</p>
          <p className="opacity-80">{error}</p>
        </div>
      </Card>
    );
  }

  if (result?.state === "failed") {
    return (
      <Card className="flex items-start gap-3 border-danger/40 bg-danger-soft p-4">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" />
        <div className="text-sm text-danger">
          <p className="font-medium">Generation failed</p>
          <p className="opacity-80">{result.error ?? "Unknown error"}</p>
        </div>
      </Card>
    );
  }

  if (!result || result.state === "running") {
    const onWan = result?.provider === "wan";
    return (
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin text-accent" />
          <span className="font-medium text-fg">Generating…</span>
          <span className="text-fg-muted">{elapsed}s elapsed</span>
          {onWan && <WanBadge />}
        </div>
        <div className="bar-indeterminate h-1.5 w-full rounded-full" />
        <p className="text-xs text-fg-subtle">
          {onWan
            ? "Veo blocked the content — retrying with Wan 2.7. This may take a moment."
            : "Veo typically takes 30 seconds to a few minutes per clip. You can leave this tab open."}
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-xl p-0">
      <video
        src={result.videoUrl}
        controls
        autoPlay
        loop
        className="block w-full bg-black"
      />
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-fg-muted">Your video is ready.</span>
          {result.provider === "wan" && <WanBadge />}
        </div>
        <a href={result.videoUrl} download>
          <Button variant="outline" size="sm" type="button">
            <Download size={14} />
            Download
          </Button>
        </a>
      </div>
    </Card>
  );
}
