import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Film, Image as ImageIcon, Sparkles, Type, Volume2 } from "lucide-react";
import { fileToBase64 } from "../api";
import { Button } from "./ui/Button";
import { FileDropzone } from "./ui/FileDropzone";
import { Select } from "./ui/Select";
import { Tabs } from "./ui/Tabs";
import { Toggle } from "./ui/Toggle";
const emptyImage = () => ({ file: null, preview: null });
const TABS = [
    { value: "text", label: "Text", icon: _jsx(Type, { size: 14 }) },
    { value: "image", label: "Image", icon: _jsx(ImageIcon, { size: 14 }) },
    { value: "frames", label: "Frames", icon: _jsx(Film, { size: 14 }) },
];
export function PromptForm({ onSubmit, disabled }) {
    const [prompt, setPrompt] = useState("");
    const [mode, setMode] = useState("text");
    const [tier, setTier] = useState("lite");
    const [duration, setDuration] = useState(8);
    const [aspectRatio, setAspectRatio] = useState("16:9");
    const [generateAudio, setGenerateAudio] = useState(false);
    const [image, setImage] = useState(emptyImage());
    const [firstFrame, setFirstFrame] = useState(emptyImage());
    const [lastFrame, setLastFrame] = useState(emptyImage());
    const [error, setError] = useState(null);
    // Effective tier: Lite is never valid for image-to-video, force Fast.
    const effectiveTier = mode === "image" && tier === "lite" ? "fast" : tier;
    function handleModeChange(next) {
        setMode(next);
        setError(null);
        if (next === "image" && tier === "lite")
            setTier("fast");
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        if (!prompt.trim())
            return;
        const base = { prompt: prompt.trim(), mode, tier: effectiveTier, duration, aspectRatio, generateAudio };
        try {
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
            : "Describe the motion between frames…";
    const canSubmit = !disabled && prompt.trim().length > 0;
    return (_jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col gap-5", children: [_jsx(Tabs, { items: TABS, value: mode, onChange: handleModeChange, disabled: disabled }), _jsx("div", { children: _jsx("textarea", { value: prompt, onChange: (e) => setPrompt(e.target.value), placeholder: placeholder, rows: 4, disabled: disabled, className: "w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm text-fg placeholder:text-fg-subtle transition-colors hover:border-border-strong focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60" }) }), mode === "image" && (_jsx(FileDropzone, { label: "Source image", file: image.file, preview: image.preview, onChange: (file, preview) => setImage({ file, preview }), disabled: disabled })), mode === "frames" && (_jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsx(FileDropzone, { label: "First frame", file: firstFrame.file, preview: firstFrame.preview, onChange: (file, preview) => setFirstFrame({ file, preview }), disabled: disabled }), _jsx(FileDropzone, { label: "Last frame", optional: true, file: lastFrame.file, preview: lastFrame.preview, onChange: (file, preview) => setLastFrame({ file, preview }), disabled: disabled })] })), _jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3", children: [_jsxs(Select, { label: "Tier", value: effectiveTier, onChange: (e) => setTier(e.target.value), disabled: disabled, children: [mode !== "image" && _jsx("option", { value: "lite", children: "Lite" }), _jsx("option", { value: "fast", children: "Fast" }), _jsx("option", { value: "standard", children: "Standard" })] }), _jsxs(Select, { label: "Duration", value: duration, onChange: (e) => setDuration(Number(e.target.value)), disabled: disabled, children: [_jsx("option", { value: 4, children: "4 seconds" }), _jsx("option", { value: 6, children: "6 seconds" }), _jsx("option", { value: 8, children: "8 seconds" })] }), _jsxs(Select, { label: "Aspect ratio", value: aspectRatio, onChange: (e) => setAspectRatio(e.target.value), disabled: disabled, children: [_jsx("option", { value: "16:9", children: "16:9 \u2014 landscape" }), _jsx("option", { value: "9:16", children: "9:16 \u2014 portrait" })] })] }), _jsxs("div", { className: "flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsx(Toggle, { checked: generateAudio, onChange: setGenerateAudio, disabled: disabled, label: _jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx(Volume2, { size: 14, className: "text-fg-muted" }), "Generate audio"] }) }), _jsxs(Button, { type: "submit", size: "lg", disabled: !canSubmit, children: [_jsx(Sparkles, { size: 16 }), disabled ? "Generating…" : "Generate video"] })] }), error && (_jsx("div", { className: "rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger", children: error }))] }));
}
