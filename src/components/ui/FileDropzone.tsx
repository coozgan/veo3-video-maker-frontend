import { DragEvent, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "../../lib/cn";

interface Props {
  label: string;
  optional?: boolean;
  file: File | null;
  preview: string | null;
  onChange: (file: File | null, preview: string | null) => void;
  disabled?: boolean;
  accept?: string;
}

export function FileDropzone({
  label,
  optional,
  file,
  preview,
  onChange,
  disabled,
  accept = "image/jpeg,image/png",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function setFile(next: File | null) {
    if (!next) {
      onChange(null, null);
      return;
    }
    if (accept && !accept.split(",").some((m) => next.type === m.trim())) {
      onChange(null, null);
      return;
    }
    onChange(next, URL.createObjectURL(next));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    setFile(e.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-fg-muted">
        {label}
        {optional && <span className="ml-1 text-fg-subtle">(optional)</span>}
      </span>

      {file && preview ? (
        <div className="group relative overflow-hidden rounded-lg border border-border bg-canvas">
          <img src={preview} alt={file.name} className="h-40 w-full object-contain" />
          <button
            type="button"
            disabled={disabled}
            onClick={() => setFile(null)}
            aria-label="Remove image"
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
          >
            <X size={14} />
          </button>
          <div className="border-t border-border bg-surface px-3 py-1.5 text-xs text-fg-muted truncate">
            {file.name}
          </div>
        </div>
      ) : (
        <div
          onDragEnter={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            "flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
            disabled && "cursor-not-allowed opacity-60",
            isDragging
              ? "border-accent bg-accent-soft"
              : "border-border-strong bg-canvas hover:bg-surface-elevated"
          )}
        >
          <ImagePlus size={22} className="text-fg-muted" />
          <div className="text-center">
            <p className="text-sm font-medium text-fg">Drop an image or click to upload</p>
            <p className="text-xs text-fg-subtle">JPEG or PNG</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            disabled={disabled}
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}
    </div>
  );
}
