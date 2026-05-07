import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Film, Image as ImageIcon, Plus, Sparkles, Trash2, Type, Volume2, Wand2 } from "lucide-react";
import { fileToBase64 } from "../api";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { FileDropzone } from "./ui/FileDropzone";
import { Select } from "./ui/Select";
import { Tabs } from "./ui/Tabs";
import { Toggle } from "./ui/Toggle";
const emptyImage = () => ({ file: null, preview: null });
const TABS = [
    { value: "text", label: "Text", icon: _jsx(Type, { size: 14 }) },
    { value: "image", label: "Image", icon: _jsx(ImageIcon, { size: 14 }) },
    { value: "frames", label: "Frames", icon: _jsx(Film, { size: 14 }) },
    { value: "kling", label: "Kling 3.0", icon: _jsx(Wand2, { size: 14 }) },
];
const KLING_PROMPT_LIMIT = 500;
const KLING_DURATIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const KLING_SHOT_DURATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const KLING_MAX_SHOTS = 5;
export function PromptForm({ onSubmit, disabled }) {
    const [prompt, setPrompt] = useState("");
    const [mode, setMode] = useState("text");
    // Veo controls
    const [tier, setTier] = useState("lite");
    const [duration, setDuration] = useState(8);
    const [aspectRatio, setAspectRatio] = useState("16:9");
    const [generateAudio, setGenerateAudio] = useState(false);
    const [image, setImage] = useState(emptyImage());
    const [firstFrame, setFirstFrame] = useState(emptyImage());
    const [lastFrame, setLastFrame] = useState(emptyImage());
    // Kling controls
    const [klingDuration, setKlingDuration] = useState(5);
    const [klingAspectRatio, setKlingAspectRatio] = useState("16:9");
    const [klingMode, setKlingMode] = useState("std");
    const [klingSound, setKlingSound] = useState(false);
    const [klingFirst, setKlingFirst] = useState(emptyImage());
    const [klingLast, setKlingLast] = useState(emptyImage());
    const [klingMultiShots, setKlingMultiShots] = useState(false);
    const [klingShots, setKlingShots] = useState([
        { prompt: "", duration: 5 },
        { prompt: "", duration: 5 },
    ]);
    const [error, setError] = useState(null);
    // Veo: Lite is never valid for image-to-video.
    const effectiveTier = mode === "image" && tier === "lite" ? "fast" : tier;
    function handleModeChange(next) {
        setMode(next);
        setError(null);
        if (next === "image" && tier === "lite")
            setTier("fast");
    }
    function updateShot(idx, patch) {
        setKlingShots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    }
    function addShot() {
        if (klingShots.length >= KLING_MAX_SHOTS)
            return;
        setKlingShots((prev) => [...prev, { prompt: "", duration: 5 }]);
    }
    function removeShot(idx) {
        if (klingShots.length <= 2)
            return; // keep at least 2 in multi-shot
        setKlingShots((prev) => prev.filter((_, i) => i !== idx));
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        if (!prompt.trim() && mode !== "kling")
            return;
        const base = { prompt: prompt.trim(), mode };
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
                if (!image.file) {
                    setError("Please select an image.");
                    return;
                }
                base.imageBase64 = await fileToBase64(image.file);
                base.imageMimeType = image.file.type;
            }
            else if (mode === "frames") {
                if (!firstFrame.file) {
                    setError("Please select a first frame.");
                    return;
                }
                base.firstFrameBase64 = await fileToBase64(firstFrame.file);
                base.firstFrameMimeType = firstFrame.file.type;
                if (lastFrame.file) {
                    base.lastFrameBase64 = await fileToBase64(lastFrame.file);
                    base.lastFrameMimeType = lastFrame.file.type;
                }
            }
            onSubmit(base);
        }
        catch {
            setError("Failed to read image file.");
        }
    }
    const placeholder = mode === "text"
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
    return (_jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col gap-5", children: [_jsx(Tabs, { items: TABS, value: mode, onChange: handleModeChange, disabled: disabled }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("textarea", { value: prompt, onChange: (e) => setPrompt(e.target.value), placeholder: placeholder, rows: mode === "kling" && klingMultiShots ? 2 : 4, disabled: disabled, maxLength: mode === "kling" ? KLING_PROMPT_LIMIT : 2000, className: "w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm text-fg placeholder:text-fg-subtle transition-colors hover:border-border-strong focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60" }), mode === "kling" && (_jsxs("div", { className: "text-right text-xs text-fg-subtle", children: [prompt.length, " / ", KLING_PROMPT_LIMIT] }))] }), mode === "image" && (_jsx(FileDropzone, { label: "Source image", file: image.file, preview: image.preview, onChange: (file, preview) => setImage({ file, preview }), disabled: disabled })), mode === "frames" && (_jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsx(FileDropzone, { label: "First frame", file: firstFrame.file, preview: firstFrame.preview, onChange: (file, preview) => setFirstFrame({ file, preview }), disabled: disabled }), _jsx(FileDropzone, { label: "Last frame", optional: true, file: lastFrame.file, preview: lastFrame.preview, onChange: (file, preview) => setLastFrame({ file, preview }), disabled: disabled })] })), mode === "kling" && (_jsx(Toggle, { checked: klingMultiShots, onChange: setKlingMultiShots, disabled: disabled, label: _jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx(Film, { size: 14, className: "text-fg-muted" }), "Multi-shot storytelling"] }) })), mode === "kling" && !klingMultiShots && (_jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsx(FileDropzone, { label: "First frame", optional: true, file: klingFirst.file, preview: klingFirst.preview, onChange: (file, preview) => setKlingFirst({ file, preview }), disabled: disabled }), _jsx(FileDropzone, { label: "Last frame", optional: true, file: klingLast.file, preview: klingLast.preview, onChange: (file, preview) => {
                            if (klingFirst.file)
                                setKlingLast({ file, preview });
                        }, disabled: disabled || !klingFirst.file })] })), mode === "kling" && klingMultiShots && (_jsxs("div", { className: "flex flex-col gap-1.5", children: [_jsx(FileDropzone, { label: "Reference first frame", optional: true, file: klingFirst.file, preview: klingFirst.preview, onChange: (file, preview) => setKlingFirst({ file, preview }), disabled: disabled }), _jsx("p", { className: "text-xs text-fg-subtle", children: "Sets the visual style for shot 1. Last frame isn't supported in multi-shot mode." })] })), mode === "kling" && klingMultiShots && (_jsxs("div", { className: "flex flex-col gap-3", children: [klingShots.map((shot, idx) => (_jsxs(Card, { className: "rounded-xl p-3", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between", children: [_jsxs("span", { className: "text-xs font-medium text-fg-muted", children: ["Shot ", idx + 1] }), klingShots.length > 2 && (_jsx("button", { type: "button", onClick: () => removeShot(idx), disabled: disabled, className: "inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:bg-surface-elevated hover:text-danger disabled:opacity-50", "aria-label": `Remove shot ${idx + 1}`, children: _jsx(Trash2, { size: 14 }) }))] }), _jsx("textarea", { value: shot.prompt, onChange: (e) => updateShot(idx, { prompt: e.target.value }), placeholder: `Shot ${idx + 1} description…`, rows: 2, disabled: disabled, maxLength: KLING_PROMPT_LIMIT, className: "w-full resize-y rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60" }), _jsxs("div", { className: "mt-2 flex items-center justify-between", children: [_jsx("div", { className: "w-32", children: _jsx(Select, { label: "Duration", value: shot.duration, onChange: (e) => updateShot(idx, { duration: Number(e.target.value) }), disabled: disabled, children: KLING_SHOT_DURATIONS.map((d) => (_jsxs("option", { value: d, children: [d, "s"] }, d))) }) }), _jsxs("span", { className: "text-xs text-fg-subtle", children: [shot.prompt.length, " / ", KLING_PROMPT_LIMIT] })] })] }, idx))), klingShots.length < KLING_MAX_SHOTS && (_jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: addShot, disabled: disabled, className: "self-start", children: [_jsx(Plus, { size: 14 }), "Add shot"] }))] })), (mode === "text" || mode === "image" || mode === "frames") && (_jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3", children: [_jsxs(Select, { label: "Tier", value: effectiveTier, onChange: (e) => setTier(e.target.value), disabled: disabled, children: [mode !== "image" && _jsx("option", { value: "lite", children: "Lite" }), _jsx("option", { value: "fast", children: "Fast" }), _jsx("option", { value: "standard", children: "Standard" })] }), _jsxs(Select, { label: "Duration", value: duration, onChange: (e) => setDuration(Number(e.target.value)), disabled: disabled, children: [_jsx("option", { value: 4, children: "4 seconds" }), _jsx("option", { value: 6, children: "6 seconds" }), _jsx("option", { value: 8, children: "8 seconds" })] }), _jsxs(Select, { label: "Aspect ratio", value: aspectRatio, onChange: (e) => setAspectRatio(e.target.value), disabled: disabled, children: [_jsx("option", { value: "16:9", children: "16:9 \u2014 landscape" }), _jsx("option", { value: "9:16", children: "9:16 \u2014 portrait" })] })] })), mode === "kling" && (_jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3", children: [_jsxs(Select, { label: "Quality", value: klingMode, onChange: (e) => setKlingMode(e.target.value), disabled: disabled, children: [_jsx("option", { value: "std", children: "Standard" }), _jsx("option", { value: "pro", children: "Pro" }), _jsx("option", { value: "4K", children: "4K" })] }), !klingMultiShots && (_jsx(Select, { label: "Duration", value: klingDuration, onChange: (e) => setKlingDuration(Number(e.target.value)), disabled: disabled, children: KLING_DURATIONS.map((d) => (_jsxs("option", { value: d, children: [d, " seconds"] }, d))) })), !klingMultiShots && (_jsxs(Select, { label: "Aspect ratio", value: klingAspectRatio, onChange: (e) => setKlingAspectRatio(e.target.value), disabled: disabled || klingSingleHasFirstFrame, children: [_jsx("option", { value: "16:9", children: "16:9 \u2014 landscape" }), _jsx("option", { value: "9:16", children: "9:16 \u2014 portrait" }), _jsx("option", { value: "1:1", children: "1:1 \u2014 square" })] }))] })), _jsxs("div", { className: "flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between", children: [mode === "kling" ? (_jsx(Toggle, { checked: klingSound, onChange: setKlingSound, disabled: disabled, label: _jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx(Volume2, { size: 14, className: "text-fg-muted" }), "Sound effects"] }) })) : (_jsx(Toggle, { checked: generateAudio, onChange: setGenerateAudio, disabled: disabled, label: _jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx(Volume2, { size: 14, className: "text-fg-muted" }), "Generate audio"] }) })), _jsxs(Button, { type: "submit", size: "lg", disabled: !canSubmit, children: [_jsx(Sparkles, { size: 16 }), disabled ? "Generating…" : "Generate video"] })] }), error && (_jsx("div", { className: "rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger", children: error }))] }));
}
