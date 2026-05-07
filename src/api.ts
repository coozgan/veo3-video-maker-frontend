const API_URL = import.meta.env.VITE_API_URL ?? "";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

function headers(): HeadersInit {
  return { "Content-Type": "application/json", "X-API-Key": API_KEY };
}

async function checked(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export type GenerateMode = "text" | "image" | "frames";

export interface GenerateParams {
  prompt: string;
  mode?: GenerateMode;
  tier?: "lite" | "fast" | "standard";
  duration?: 4 | 6 | 8;
  aspectRatio?: "9:16" | "16:9";
  generateAudio?: boolean;
  // mode="image"
  imageBase64?: string;
  imageMimeType?: string;
  // mode="frames"
  firstFrameBase64?: string;
  firstFrameMimeType?: string;
  lastFrameBase64?: string;
  lastFrameMimeType?: string;
}

export async function generate(params: GenerateParams): Promise<{ operationName: string }> {
  return checked(
    await fetch(`${API_URL}/api/generate`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(params),
    })
  );
}

export type JobState = "running" | "done" | "failed";

export interface StatusResult {
  state: JobState;
  videoUrl?: string;
  error?: string;
}

export async function pollStatus(op: string, signal?: AbortSignal): Promise<StatusResult> {
  return checked(
    await fetch(`${API_URL}/api/status?op=${encodeURIComponent(op)}`, {
      headers: headers(),
      signal,
    })
  );
}

export interface HistoryItem {
  name: string;
  created: string;
  signedUrl: string;
}

export interface HistoryPage {
  items: HistoryItem[];
  total: number;
  hasMore: boolean;
}

export async function listHistory(limit = 10, offset = 0): Promise<HistoryPage> {
  return checked(
    await fetch(`${API_URL}/api/history?limit=${limit}&offset=${offset}`, { headers: headers() })
  );
}

/** Read a File as a base64 string (without the data: prefix). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
