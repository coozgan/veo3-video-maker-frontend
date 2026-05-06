import { FormEvent, useRef, useState } from "react";
import { fileToBase64, GenerateMode, GenerateParams } from "../api";

interface Props {
  onSubmit: (params: GenerateParams) => void;
  disabled?: boolean;
}

interface ImageField {
  file: File | null;
  preview: string | null;
}

const emptyImage = (): ImageField => ({ file: null, preview: null });

export function PromptForm({ onSubmit, disabled }: Props) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<GenerateMode>("text");
  const [tier, setTier] = useState<"lite" | "fast" | "standard">("lite");
  const [duration, setDuration] = useState<4 | 6 | 8>(8);
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("16:9");
  const [generateAudio, setGenerateAudio] = useState(false);
  const [image, setImage] = useState<ImageField>(emptyImage());
  const [firstFrame, setFirstFrame] = useState<ImageField>(emptyImage());
  const [lastFrame, setLastFrame] = useState<ImageField>(emptyImage());
  const [error, setError] = useState<string | null>(null);

  const imageRef = useRef<HTMLInputElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);

  function handleModeChange(next: GenerateMode) {
    setMode(next);
    setError(null);
    // Image-to-video doesn't support Lite — auto-switch to Fast
    if (next === "image" && tier === "lite") setTier("fast");
    if (next !== "image" && tier === "fast") setTier("lite");
  }

  function handleFile(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: ImageField) => void
  ) {
    const file = e.target.files?.[0] ?? null;
    if (!file) { setter(emptyImage()); return; }
    const preview = URL.createObjectURL(file);
    setter({ file, preview });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!prompt.trim()) return;

    const base: GenerateParams = { prompt: prompt.trim(), mode, tier, duration, aspectRatio, generateAudio };

    try {
      if (mode === "image") {
        if (!image.file) { setError("Please select an image."); return; }
        base.imageBase64 = await fileToBase64(image.file);
        base.imageMimeType = image.file.type;
      } else if (mode === "frames") {
        if (!firstFrame.file) { setError("Please select a first frame."); return; }
        base.firstFrameBase64 = await fileToBase64(firstFrame.file);
        base.firstFrameMimeType = firstFrame.file.type;
        if (lastFrame.file) {
          base.lastFrameBase64 = await fileToBase64(lastFrame.file);
          base.lastFrameMimeType = lastFrame.file.type;
        }
      }
      onSubmit(base);
    } catch {
      setError("Failed to read image file.");
    }
  }

  const canSubmit = !disabled && prompt.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Mode selector */}
      <div style={{ display: "flex", gap: 8 }}>
        {(["text", "image", "frames"] as GenerateMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            disabled={disabled}
            style={{
              padding: "6px 16px",
              borderRadius: 4,
              border: "1px solid #888",
              background: mode === m ? "#333" : "#fff",
              color: mode === m ? "#fff" : "#333",
              cursor: "pointer",
              fontWeight: mode === m ? 600 : 400,
            }}
          >
            {m === "text" ? "Text → Video" : m === "image" ? "Image → Video" : "First + Last Frames"}
          </button>
        ))}
      </div>

      {/* Prompt */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={
          mode === "text"
            ? "Describe your video…"
            : mode === "image"
            ? "Describe how to animate this image…"
            : "Describe the motion between frames…"
        }
        rows={3}
        disabled={disabled}
        style={{ width: "100%", resize: "vertical", padding: 8, fontSize: 15, boxSizing: "border-box" }}
      />

      {/* Image upload — mode=image */}
      {mode === "image" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontWeight: 500 }}>
            Source image (JPEG or PNG)
            <input
              ref={imageRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => handleFile(e, setImage)}
              disabled={disabled}
              style={{ display: "block", marginTop: 4 }}
            />
          </label>
          {image.preview && (
            <img src={image.preview} alt="preview" style={{ maxHeight: 160, objectFit: "contain", borderRadius: 4 }} />
          )}
        </div>
      )}

      {/* Frame uploads — mode=frames */}
      {mode === "frames" && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontWeight: 500 }}>
              First frame *
              <input
                ref={firstRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => handleFile(e, setFirstFrame)}
                disabled={disabled}
                style={{ display: "block", marginTop: 4 }}
              />
            </label>
            {firstFrame.preview && (
              <img src={firstFrame.preview} alt="first frame" style={{ marginTop: 6, maxHeight: 140, objectFit: "contain", borderRadius: 4 }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontWeight: 500 }}>
              Last frame (optional)
              <input
                ref={lastRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => handleFile(e, setLastFrame)}
                disabled={disabled}
                style={{ display: "block", marginTop: 4 }}
              />
            </label>
            {lastFrame.preview && (
              <img src={lastFrame.preview} alt="last frame" style={{ marginTop: 6, maxHeight: 140, objectFit: "contain", borderRadius: 4 }} />
            )}
          </div>
        </div>
      )}

      {/* Options row */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <label>
          Tier&nbsp;
          <select value={tier} onChange={(e) => setTier(e.target.value as typeof tier)} disabled={disabled}>
            {/* Lite not available for image-to-video */}
            {mode !== "image" && <option value="lite">Lite (~$0.05/s)</option>}
            <option value="fast">Fast (~$0.10/s)</option>
            <option value="standard">Standard (~$0.35/s)</option>
          </select>
        </label>

        <label>
          Duration&nbsp;
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value) as typeof duration)} disabled={disabled}>
            <option value={4}>4s</option>
            <option value={6}>6s</option>
            <option value={8}>8s</option>
          </select>
        </label>

        <label>
          Aspect ratio&nbsp;
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)} disabled={disabled}>
            <option value="16:9">16:9 (landscape)</option>
            <option value="9:16">9:16 (portrait)</option>
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="checkbox"
            checked={generateAudio}
            onChange={(e) => setGenerateAudio(e.target.checked)}
            disabled={disabled}
          />
          Audio
        </label>
      </div>

      {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}

      <button type="submit" disabled={!canSubmit} style={{ padding: "8px 24px", width: "fit-content" }}>
        {disabled ? "Generating…" : "Generate"}
      </button>
    </form>
  );
}
