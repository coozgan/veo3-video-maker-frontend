import { useCallback, useEffect, useRef, useState } from "react";
import { pollStatus } from "../api";
export function usePolling(operationName) {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);
    const timerRef = useRef(null);
    const startedAt = useRef(null);
    const stop = useCallback(() => {
        abortRef.current?.abort();
        if (timerRef.current)
            clearTimeout(timerRef.current);
    }, []);
    useEffect(() => {
        if (!operationName)
            return;
        startedAt.current = Date.now();
        setResult(null);
        setError(null);
        async function tick() {
            abortRef.current = new AbortController();
            try {
                const res = await pollStatus(operationName, abortRef.current.signal);
                setResult(res);
                if (res.state === "running") {
                    const elapsed = Date.now() - (startedAt.current ?? 0);
                    const delay = elapsed > 60000 ? 15000 : 8000;
                    timerRef.current = setTimeout(tick, delay);
                }
            }
            catch (err) {
                if (err instanceof DOMException && err.name === "AbortError")
                    return;
                setError(err instanceof Error ? err.message : String(err));
            }
        }
        tick();
        return stop;
    }, [operationName, stop]);
    return { result, error, stop };
}
