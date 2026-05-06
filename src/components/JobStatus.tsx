import { useEffect, useState } from "react";
import { StatusResult } from "../api";

interface Props {
  operationName: string | null;
  result: StatusResult | null;
  error: string | null;
}

export function JobStatus({ operationName, result, error }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!operationName || result?.state !== "running") return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [operationName, result?.state]);

  if (!operationName) return null;

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  if (!result || result.state === "running") {
    return (
      <div>
        <p>Generating… {elapsed}s elapsed</p>
        <progress style={{ width: "100%" }} />
      </div>
    );
  }

  if (result.state === "failed") {
    return <div style={{ color: "red" }}>Generation failed: {result.error ?? "unknown error"}</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <video
        src={result.videoUrl}
        controls
        autoPlay
        loop
        style={{ maxWidth: "100%", borderRadius: 6 }}
      />
      <a href={result.videoUrl} download>
        Download video
      </a>
    </div>
  );
}
