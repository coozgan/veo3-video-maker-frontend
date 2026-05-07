import { FormEvent, useState } from "react";
import { Film, Image as ImageIcon, Sparkles, Type, Volume2 } from "lucide-react";
import { fileToBase64, GenerateMode, GenerateParams } from "../api";
import { Button } from "./ui/Button";
import { FileDropzone } from "./ui/FileDropzone";
import { Select } from "./ui/Select";
import { Tabs, TabItem } from "./ui/Tabs";
import { Toggle } from "./ui/Toggle";

interface Props {
  onSubmit: (params: GenerateParams) => void;
  disabled?: boolean;
}

interface ImageField {
  file: File | null;
  preview: string | null;
}

const emptyImage = (): ImageField => ({ file: null, preview: null });

const TABS: TabItem<GenerateMode>[] = [
  { value: "text", label: "Text", icon: <Type size={14} /> },
  { value: "image", label: "Image", icon: <ImageIcon size={14} /> },
  { value: "frames", label: "Frames", icon: <Film size={14} /> },
];

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

  // Effective tier: Lite is never valid for image-to-video, force Fast.
  const effectiveTier = mode === "image" && tier === "lite" ? "fast" : tier;

  function handleModeChange(next: GenerateMode) {
    setMode(next);
    setError(null);
    if (next === "image" && tier === "lite") setTier("fast");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!prompt.trim()) return;

    const base: GenerateParams = { prompt: prompt.trim(), mode, tier: effectiveTier, duration, aspectRatio, generateAudio };

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

  const placeholder =
    mode === "text"
      ? "Describe your video in detail…"
      : mode === "image"
      ? "Describe how to animate this image…"
      : "Describe the motion between frames…";

  const canSubmit = !disabled && prompt.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Tabs items={TABS} value={mode} onChange={handleModeChange} disabled={disabled} />

      <div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          rows={4}
          disabled={disabled}
          className="w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm text-fg placeholder:text-fg-subtle transition-colors hover:border-border-strong focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
        />
      </div>

      {mode === "image" && (
        <FileDropzone
          label="Source image"
          file={image.file}
          preview={image.preview}
          onChange={(file, preview) => setImage({ file, preview })}
          disabled={disabled}
        />
      )}

      {mode === "frames" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FileDropzone
            label="First frame"
            file={firstFrame.file}
            preview={firstFrame.preview}
            onChange={(file, preview) => setFirstFrame({ file, preview })}
            disabled={disabled}
          />
          <FileDropzone
            label="Last frame"
            optional
            file={lastFrame.file}
            preview={lastFrame.preview}
            onChange={(file, preview) => setLastFrame({ file, preview })}
            disabled={disabled}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Select
          label="Tier"
          value={effectiveTier}
          onChange={(e) => setTier(e.target.value as typeof tier)}
          disabled={disabled}
        >
          {mode !== "image" && <option value="lite">Lite</option>}
          <option value="fast">Fast</option>
          <option value="standard">Standard</option>
        </Select>

        <Select
          label="Duration"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value) as typeof duration)}
          disabled={disabled}
        >
          <option value={4}>4 seconds</option>
          <option value={6}>6 seconds</option>
          <option value={8}>8 seconds</option>
        </Select>

        <Select
          label="Aspect ratio"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
          disabled={disabled}
        >
          <option value="16:9">16:9 — landscape</option>
          <option value="9:16">9:16 — portrait</option>
        </Select>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Toggle
          checked={generateAudio}
          onChange={setGenerateAudio}
          disabled={disabled}
          label={
            <span className="inline-flex items-center gap-1.5">
              <Volume2 size={14} className="text-fg-muted" />
              Generate audio
            </span>
          }
        />

        <Button type="submit" size="lg" disabled={!canSubmit}>
          <Sparkles size={16} />
          {disabled ? "Generating…" : "Generate video"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
    </form>
  );
}
