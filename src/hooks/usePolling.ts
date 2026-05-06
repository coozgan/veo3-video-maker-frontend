import { useCallback, useEffect, useRef, useState } from "react";
import { pollStatus, StatusResult } from "../api";

export function usePolling(operationName: string | null) {
  const [result, setResult] = useState<StatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef<number | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!operationName) return;
    startedAt.current = Date.now();
    setResult(null);
    setError(null);

    async function tick() {
      abortRef.current = new AbortController();
      try {
        const res = await pollStatus(operationName!, abortRef.current.signal);
        setResult(res);
        if (res.state === "running") {
          const elapsed = Date.now() - (startedAt.current ?? 0);
          const delay = elapsed > 60_000 ? 15_000 : 8_000;
          timerRef.current = setTimeout(tick, delay);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    tick();
    return stop;
  }, [operationName, stop]);

  return { result, error, stop };
}
