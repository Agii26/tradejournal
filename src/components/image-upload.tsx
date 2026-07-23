"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { getUploadUrl, attachImageToTrade, deleteImage } from "@/lib/actions/images";

type TradeImage = { id: string; url: string; kind: string | null };

export function ImageUpload({
  tradeId,
  images,
}: {
  tradeId: string;
  images: TradeImage[];
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const tempId = `${file.name}-${Date.now()}`;
      setUploading((u) => [...u, tempId]);
      setError(null);

      try {
        const { uploadUrl, publicUrl } = await getUploadUrl(
          tradeId,
          file.name,
          file.type,
          file.size
        );

        const res = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!res.ok) throw new Error("Upload to storage failed");

        await attachImageToTrade(tradeId, publicUrl, "context");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading((u) => u.filter((id) => id !== tempId));
      }
    },
    [tradeId]
  );

  const uploadFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((f) => uploadFile(f));
    },
    [uploadFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = Array.from(items)
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length) uploadFiles(files);
    },
    [uploadFiles]
  );

  useEffect(() => {
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [onPaste]);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`rounded-lg border border-dashed px-6 py-8 text-center transition-colors ${
          isDragging ? "border-accent bg-accent-tint" : "border-hairline"
        }`}
      >
        <ImagePlus size={20} className="mx-auto mb-2 text-muted" />
        <p className="text-sm text-muted">
          Drag screenshots here, paste from clipboard, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-accent hover:underline cursor-pointer"
          >
            browse
          </button>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {error && <p className="mt-2 text-sm text-error">{error}</p>}

      {(images.length > 0 || uploading.length > 0) && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-video overflow-hidden rounded-md border border-hairline"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external R2 URLs, no build-time optimization needed for chart screenshots */}
              <img
                src={img.url}
                alt="Trade screenshot"
                className="h-full w-full cursor-pointer object-cover"
                onClick={() => setLightbox(img.url)}
              />
              <button
                type="button"
                onClick={() => startTransition(() => deleteImage(img.id, tradeId))}
                aria-label="Delete image"
                disabled={isPending}
                className="absolute right-1.5 top-1.5 rounded-full bg-canvas/80 p-1.5 opacity-0 transition-opacity hover:bg-error hover:text-canvas group-hover:opacity-100 cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {uploading.map((id) => (
            <div
              key={id}
              className="flex aspect-video items-center justify-center rounded-md border border-hairline bg-accent-tint"
            >
              <Loader2 size={18} className="animate-spin text-accent" />
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-6 top-6 text-white/80 hover:text-white cursor-pointer"
            onClick={() => setLightbox(null)}
          >
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- external R2 URL in a lightbox overlay */}
          <img
            src={lightbox}
            alt="Trade screenshot enlarged"
            className="max-h-full max-w-full rounded-md"
          />
        </div>
      )}
    </div>
  );
}
