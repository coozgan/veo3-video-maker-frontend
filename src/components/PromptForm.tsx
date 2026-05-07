import { FormEvent, useState } from "react";
import { Film, Image as ImageIcon, Plus, Sparkles, Trash2, Type, Volume2, Wand2 } from "lucide-react";
import { fileToBase64, GenerateMode, GenerateParams, KlingShot } from "../api";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
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
  { value: "kling", label: "Kling 3.0", icon: <Wand2 size={14} /> },
];

const KLING_PROMPT_LIMIT = 500;
const KLING_DURATIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const KLING_SHOT_DURATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const KLING_MAX_SHOTS = 5;

export function PromptForm({ onSubmit, disabled }: Props) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<GenerateMode>("text");

  // Veo controls
  const [tier, setTier] = useState<"lite" | "fast" | "standard">("lite");
  const [duration, setDuration] = useState<4 | 6 | 8>(8);
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("16:9");
  const [generateAudio, setGenerateAudio] = useState(false);
  const [image, setImage] = useState<ImageField>(emptyImage());
  const [firstFrame, setFirstFrame] = useState<ImageField>(emptyImage());
  const [lastFrame, setLastFrame] = useState<ImageField>(emptyImage());

  // Kling controls
  const [klingDuration, setKlingDuration] = useState<number>(5);
  const [klingAspectRatio, setKlingAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [klingMode, setKlingMode] = useState<"std" | "pro" | "4K">("std");
  const [klingSound, setKlingSound] = useState(false);
  const [klingFirst, setKlingFirst] = useState<ImageField>(emptyImage());
  const [klingLast, setKlingLast] = useState<ImageField>(emptyImage());
  const [klingMultiShots, setKlingMultiShots] = useState(false);
  const [klingShots, setKlingShots] = useState<KlingShot[]>([
    { prompt: "", duration: 5 },
    { prompt: "", duration: 5 },
  ]);

  const [error, setError] = useState<string | null>(null);

  // Veo: Lite is never valid for image-to-video.
  const effectiveTier = mode === "image" && tier === "lite" ? "fast" : tier;

  function handleModeChange(next: GenerateMode) {
    setMode(next);
    setError(null);
    if (next === "image" && tier === "lite") setTier("fast");
  }

  function updateShot(idx: number, patch: Partial<KlingShot>) {
    setKlingShots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function addShot() {
    if (klingShots.length >= KLING_MAX_SHOTS) return;
    setKlingShots((prev) => [...prev, { prompt: "", duration: 5 }]);
  }

  function removeShot(idx: number) {
    if (klingShots.length <= 2) return; // keep at least 2 in multi-shot
    setKlingShots((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!prompt.trim() && mode !== "kling") return;

    const base: GenerateParams = { prompt: prompt.trim(), mode };

    try {
      if (mode === "kling") {
        if (!prompt.trim() && !klingMultiShots) {
          setError("Please enter a prompt.");
          return;
        }
        if (prompt.length > KLING_PROMPT_LIMIT) {
          setError(`Prompt must be ${KLING_PROMPT_LIMIT} characters or fewer.`);
          return;
        }

        base.klingDuration = klingDuration;
        base.klingAspectRatio = klingAspectRatio;
        base.klingMode = klingMode;
        base.klingSound = klingSound;
        base.klingMultiShots = klingMultiShots;

        if (klingMultiShots) {
          // Validate all shots
          for (const [i, shot] of klingShots.entries()) {
            if (!shot.prompt.trim()) {
              setError(`Shot ${i + 1} needs a prompt.`);
              return;
            }
            if (shot.prompt.length > KLING_PROMPT_LIMIT) {
              setError(`Shot ${i + 1} prompt must be ${KLING_PROMPT_LIMIT} characters or fewer.`);
              return;
            }
          }
          base.klingMultiPrompt = klingShots.map((s) => ({ prompt: s.prompt.trim(), duration: s.duration }));
        }

        // First frame works in both single- and multi-shot. Last frame is single-shot only.
        if (klingFirst.file) {
          base.imageBase64 = await fileToBase64(klingFirst.file);
          base.imageMimeType = klingFirst.file.type;
        }
        if (!klingMultiShots && klingLast.file) {
          base.lastFrameBase64 = await fileToBase64(klingLast.file);
          base.lastFrameMimeType = klingLast.file.type;
        }

        onSubmit(base);
        return;
      }

      // Veo modes
      base.tier = effectiveTier;
      base.duration = duration;
      base.aspectRatio = aspectRatio;
      base.generateAudio = generateAudio;

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
      : mode === "frames"
      ? "Describe the motion between frames…"
      : klingMultiShots
      ? "Optional overall prompt (each shot has its own below)…"
      : "Describe your video (Kling 3.0 prefers concise, vivid prompts)…";

  const canSubmit = !disabled && (mode === "kling" ? klingMultiShots || prompt.trim().length > 0 : prompt.trim().length > 0);

  const klingSingleHasFirstFrame = !klingMultiShots && klingFirst.file !== null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Tabs items={TABS} value={mode} onChange={handleModeChange} disabled={disabled} />

      <div className="flex flex-col gap-1">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          rows={mode === "kling" && klingMultiShots ? 2 : 4}
          disabled={disabled}
          maxLength={mode === "kling" ? KLING_PROMPT_LIMIT : 2000}
          className="w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm text-fg placeholder:text-fg-subtle transition-colors hover:border-border-strong focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
        />
        {mode === "kling" && (
          <div className="text-right text-xs text-fg-subtle">
            {prompt.length} / {KLING_PROMPT_LIMIT}
          </div>
        )}
      </div>

      {/* === Veo: image upload === */}
      {mode === "image" && (
        <FileDropzone
          label="Source image"
          file={image.file}
          preview={image.preview}
          onChange={(file, preview) => setImage({ file, preview })}
          disabled={disabled}
        />
      )}

      {/* === Veo: frames === */}
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

      {/* === Kling: multi-shot toggle === */}
      {mode === "kling" && (
        <Toggle
          checked={klingMultiShots}
          onChange={setKlingMultiShots}
          disabled={disabled}
          label={
            <span className="inline-flex items-center gap-1.5">
              <Film size={14} className="text-fg-muted" />
              Multi-shot storytelling
            </span>
          }
        />
      )}

      {/* === Kling: frame uploads ===
          Single-shot supports first + last. Multi-shot supports first only (kie.ai limitation). */}
      {mode === "kling" && !klingMultiShots && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FileDropzone
            label="First frame"
            optional
            file={klingFirst.file}
            preview={klingFirst.preview}
            onChange={(file, preview) => setKlingFirst({ file, preview })}
            disabled={disabled}
          />
          <FileDropzone
            label="Last frame"
            optional
            file={klingLast.file}
            preview={klingLast.preview}
            onChange={(file, preview) => {
              if (klingFirst.file) setKlingLast({ file, preview });
            }}
            disabled={disabled || !klingFirst.file}
          />
        </div>
      )}

      {mode === "kling" && klingMultiShots && (
        <div className="flex flex-col gap-1.5">
          <FileDropzone
            label="Reference first frame"
            optional
            file={klingFirst.file}
            preview={klingFirst.preview}
            onChange={(file, preview) => setKlingFirst({ file, preview })}
            disabled={disabled}
          />
          <p className="text-xs text-fg-subtle">
            Sets the visual style for shot 1. Last frame isn't supported in multi-shot mode.
          </p>
        </div>
      )}

      {/* === Kling: multi-shot rows === */}
      {mode === "kling" && klingMultiShots && (
        <div className="flex flex-col gap-3">
          {klingShots.map((shot, idx) => (
            <Card key={idx} className="rounded-xl p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-fg-muted">Shot {idx + 1}</span>
                {klingShots.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeShot(idx)}
                    disabled={disabled}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:bg-surface-elevated hover:text-danger disabled:opacity-50"
                    aria-label={`Remove shot ${idx + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <textarea
                value={shot.prompt}
                onChange={(e) => updateShot(idx, { prompt: e.target.value })}
                placeholder={`Shot ${idx + 1} description…`}
                rows={2}
                disabled={disabled}
                maxLength={KLING_PROMPT_LIMIT}
                className="w-full resize-y rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="w-32">
                  <Select
                    label="Duration"
                    value={shot.duration}
                    onChange={(e) => updateShot(idx, { duration: Number(e.target.value) })}
                    disabled={disabled}
                  >
                    {KLING_SHOT_DURATIONS.map((d) => (
                      <option key={d} value={d}>{d}s</option>
                    ))}
                  </Select>
                </div>
                <span className="text-xs text-fg-subtle">{shot.prompt.length} / {KLING_PROMPT_LIMIT}</span>
              </div>
            </Card>
          ))}
          {klingShots.length < KLING_MAX_SHOTS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addShot}
              disabled={disabled}
              className="self-start"
            >
              <Plus size={14} />
              Add shot
            </Button>
          )}
        </div>
      )}

      {/* === Veo controls row === */}
      {(mode === "text" || mode === "image" || mode === "frames") && (
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
      )}

      {/* === Kling controls row === */}
      {mode === "kling" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Select
            label="Quality"
            value={klingMode}
            onChange={(e) => setKlingMode(e.target.value as typeof klingMode)}
            disabled={disabled}
          >
            <option value="std">Standard</option>
            <option value="pro">Pro</option>
            <option value="4K">4K</option>
          </Select>

          {!klingMultiShots && (
            <Select
              label="Duration"
              value={klingDuration}
              onChange={(e) => setKlingDuration(Number(e.target.value))}
              disabled={disabled}
            >
              {KLING_DURATIONS.map((d) => (
                <option key={d} value={d}>{d} seconds</option>
              ))}
            </Select>
          )}

          {!klingMultiShots && (
            <Select
              label="Aspect ratio"
              value={klingAspectRatio}
              onChange={(e) => setKlingAspectRatio(e.target.value as typeof klingAspectRatio)}
              disabled={disabled || klingSingleHasFirstFrame}
            >
              <option value="16:9">16:9 — landscape</option>
              <option value="9:16">9:16 — portrait</option>
              <option value="1:1">1:1 — square</option>
            </Select>
          )}
        </div>
      )}

      {/* === Audio toggle + Generate button === */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        {mode === "kling" ? (
          <Toggle
            checked={klingSound}
            onChange={setKlingSound}
            disabled={disabled}
            label={
              <span className="inline-flex items-center gap-1.5">
                <Volume2 size={14} className="text-fg-muted" />
                Sound effects
              </span>
            }
          />
        ) : (
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
        )}

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
