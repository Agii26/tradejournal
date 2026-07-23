"use server";

import { randomUUID } from "crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB — chart screenshots, not raw camera photos

export async function getUploadUrl(
  tradeId: string,
  filename: string,
  contentType: string,
  size: number
) {
  const userId = await requireUserId();

  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error("Only PNG, JPEG, WEBP, or GIF images are allowed");
  }
  if (size > MAX_BYTES) {
    throw new Error("Image is larger than 10MB");
  }

  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId },
    select: { id: true },
  });
  if (!trade) throw new Error("Trade not found");

  const ext = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const key = `trades/${userId}/${tradeId}/${randomUUID()}.${ext}`;

  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );

  return { uploadUrl, publicUrl: `${R2_PUBLIC_URL}/${key}`, key };
}

export async function attachImageToTrade(
  tradeId: string,
  url: string,
  kind: "entry" | "exit" | "context"
) {
  const userId = await requireUserId();

  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId },
    select: { id: true },
  });
  if (!trade) throw new Error("Trade not found");

  const image = await prisma.tradeImage.create({
    data: { tradeId, url, kind },
  });

  revalidatePath(`/journal/${tradeId}`);
  return image;
}

export async function deleteImage(imageId: string, tradeId: string) {
  const userId = await requireUserId();

  const image = await prisma.tradeImage.findFirst({
    where: { id: imageId, trade: { userId, id: tradeId } },
  });
  if (!image) throw new Error("Image not found");

  const key = image.url.replace(`${R2_PUBLIC_URL}/`, "");
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch {
    // Object may already be gone — don't block removing the DB record over it.
  }

  await prisma.tradeImage.delete({ where: { id: imageId } });
  revalidatePath(`/journal/${tradeId}`);
}
