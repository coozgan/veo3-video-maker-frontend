import { useCallback, useEffect, useRef, useState } from "react";
import { pollStatus } from "../api";
const POLL_INTERVAL_MS = 8000;
const POLL_INTERVAL_SLOW_MS = 15000;
const SLOW_AFTER_MS = 60000;
const MAX_TRANSIENT_RETRIES = 3;
export function usePolling(operationName) {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);
    const timerRef = useRef(null);
    const startedAt = useRef(null);
    const transientFailures = useRef(0);
    const stop = useCallback(() => {
        abortRef.current?.abort();
        if (timerRef.current)
            clearTimeout(timerRef.current);
    }, []);
    useEffect(() => {
        if (!operationName)
            return;
        startedAt.current = Date.now();
        transientFailures.current = 0;
        setResult(null);
        setError(null);
        async function tick() {
            abortRef.current = new AbortController();
            try {
                const res = await pollStatus(operationName, abortRef.current.signal);
                transientFailures.current = 0;
                setResult(res);
                if (res.state === "running") {
                    const elapsed = Date.now() - (startedAt.current ?? 0);
                    const delay = elapsed > SLOW_AFTER_MS ? POLL_INTERVAL_SLOW_MS : POLL_INTERVAL_MS;
                    timerRef.current = setTimeout(tick, delay);
                }
                // "done" and "failed" are both terminal — stop polling.
            }
            catch (err) {
                if (err instanceof DOMException && err.name === "AbortError")
                    return;
                transientFailures.current += 1;
                if (transientFailures.current <= MAX_TRANSIENT_RETRIES) {
                    // Exponential backoff: 2s, 4s, 8s
                    const backoff = Math.pow(2, transientFailures.current) * 1000;
                    timerRef.current = setTimeout(tick, backoff);
                }
                else {
                    setError(err instanceof Error
                        ? err.message
                        : "Lost connection to the server. Please refresh and check your history.");
                }
            }
        }
        tick();
        return stop;
    }, [operationName, stop]);
    return { result, error, stop };
}
