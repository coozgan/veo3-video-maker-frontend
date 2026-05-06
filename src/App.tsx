import { useEffect, useState } from "react";
import { generate, GenerateParams, HistoryItem, listHistory } from "./api";
import { JobStatus } from "./components/JobStatus";
import { PromptForm } from "./components/PromptForm";
import { usePolling } from "./hooks/usePolling";

export default function App() {
  const [operationName, setOperationName] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const { result, error } = usePolling(operationName);
  const isRunning = !!operationName && result?.state === "running";

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

  useEffect(() => {
    if (result?.state === "done") {
      listHistory().then(setHistory).catch(() => {});
    }
  }, [result?.state]);

  useEffect(() => {
    listHistory().then(setHistory).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: 24 }}>Veo 3.1 Generator</h1>

      <PromptForm onSubmit={handleSubmit} disabled={isRunning} />

      {submitError && <p style={{ color: "red", marginTop: 8 }}>{submitError}</p>}

      {operationName && (
        <div style={{ marginTop: 24 }}>
          <JobStatus operationName={operationName} result={result} error={error} />
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2>Recent videos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {history.map((item) => (
              <div key={item.name} style={{ border: "1px solid #ddd", borderRadius: 6, overflow: "hidden" }}>
                <video src={item.signedUrl} controls style={{ width: "100%", display: "block" }} />
                <div style={{ padding: "4px 8px", fontSize: 12, color: "#666" }}>
                  {new Date(item.created).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
