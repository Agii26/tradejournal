"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { getProfileImageUploadUrl, updateProfileImage } from "@/lib/actions/profile";

export function ProfileImageUpload({
  kind,
  currentUrl,
}: {
  kind: "avatar" | "cover";
  currentUrl: string | null;
}) {
  const [url, setUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { uploadUrl, publicUrl } = await getProfileImageUploadUrl(
        kind,
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
      await updateProfileImage(kind, publicUrl);
      setUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const shellClass =
    kind === "avatar"
      ? "h-20 w-20 rounded-full"
      : "h-32 w-full rounded-lg";

  return (
    <div className={kind === "cover" ? "w-full" : undefined}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`group relative flex items-center justify-center overflow-hidden border border-hairline bg-canvas cursor-pointer ${shellClass}`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, matches image-upload.tsx convention
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="px-2 text-center text-xs text-muted">
            {kind === "avatar" ? "Add photo" : "Add cover photo"}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-canvas opacity-0 transition-all group-hover:bg-ink/50 group-hover:opacity-100">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
