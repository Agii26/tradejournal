"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { getProfileImageUploadUrl, updateProfileImage } from "@/lib/actions/profile";

export function ProfileHeaderUpload({
  initialImage,
  initialCoverImage,
}: {
  initialImage: string | null;
  initialCoverImage: string | null;
}) {
  const [image, setImage] = useState(initialImage);
  const [coverImage, setCoverImage] = useState(initialCoverImage);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  async function handleFile(kind: "avatar" | "cover", file: File | undefined) {
    if (!file) return;
    setUploading(kind);
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
      if (kind === "avatar") setImage(publicUrl);
      else setCoverImage(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="mb-6 overflow-visible rounded-lg border border-hairline bg-surface">
      <div className="relative">
        <button
          type="button"
          onClick={() => coverInput.current?.click()}
          aria-label="Change cover photo"
          className="group relative flex h-36 w-full items-center justify-center overflow-hidden rounded-t-lg bg-canvas cursor-pointer"
        >
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, matches image-upload.tsx convention
            <img src={coverImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted">
              <Camera size={14} /> Add cover photo
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-canvas opacity-0 transition-all group-hover:bg-ink/50 group-hover:opacity-100">
            {uploading === "cover" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Camera size={16} /> {coverImage ? "Change cover" : "Add cover photo"}
              </span>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => avatarInput.current?.click()}
          aria-label="Change profile photo"
          className="group absolute left-5 top-[104px] flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-canvas cursor-pointer"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, matches image-upload.tsx convention
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera size={18} className="text-muted" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-canvas opacity-0 transition-all group-hover:bg-ink/50 group-hover:opacity-100">
            {uploading === "avatar" ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          </span>
        </button>
      </div>

      <div className="px-5 pb-4 pt-14">
        <p className="text-xs text-muted">Click the cover or your photo to change either one.</p>
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </div>

      <input
        ref={coverInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => handleFile("cover", e.target.files?.[0])}
      />
      <input
        ref={avatarInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => handleFile("avatar", e.target.files?.[0])}
      />
    </div>
  );
}
