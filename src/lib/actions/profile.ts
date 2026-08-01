"use server";

import { randomUUID } from "crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { usernameSchema } from "@/lib/validation";
import { toPlainTrade } from "@/lib/trade-transform";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import type { PlainTradeListItem, PlainTradeDetail } from "@/lib/actions/trades";

export interface PlainUserSettings {
  username: string | null;
  isPublicProfile: boolean;
  image: string | null;
  coverImage: string | null;
}

export async function getUserSettings(): Promise<PlainUserSettings> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { username: true, isPublicProfile: true, image: true, coverImage: true },
  });
  return {
    username: user.username,
    isPublicProfile: user.isPublicProfile,
    image: user.image,
    coverImage: user.coverImage,
  };
}

export type ActionState = { error?: string; success?: boolean } | undefined;

export async function updateUserSettings(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = usernameSchema.safeParse(formData.get("username"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid username" };
  }
  const username = parsed.data;
  const isPublicProfile = formData.get("isPublicProfile") === "on";

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== userId) {
    return { error: "That username's taken" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { username, isPublicProfile },
  });

  revalidatePath("/journal/settings");
  return { success: true };
}

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB — profile images, smaller than trade screenshots

export async function getProfileImageUploadUrl(
  kind: "avatar" | "cover",
  filename: string,
  contentType: string,
  size: number
) {
  const userId = await requireUserId();

  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new Error("Only PNG, JPEG, WEBP, or GIF images are allowed");
  }
  if (size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Image is larger than 5MB");
  }

  const ext = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const key = `${kind}s/${userId}/${randomUUID()}.${ext}`;

  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );

  return { uploadUrl, publicUrl: `${R2_PUBLIC_URL}/${key}` };
}

export async function updateProfileImage(kind: "avatar" | "cover", url: string) {
  const userId = await requireUserId();

  const current = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { image: true, coverImage: true, username: true },
  });
  const oldUrl = kind === "avatar" ? current.image : current.coverImage;

  await prisma.user.update({
    where: { id: userId },
    data: kind === "avatar" ? { image: url } : { coverImage: url },
  });

  // Best-effort cleanup of the replaced image — don't let an R2 hiccup block
  // the actual profile update, the DB record is already correct either way.
  if (oldUrl) {
    const key = oldUrl.replace(`${R2_PUBLIC_URL}/`, "");
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    } catch {
      // Object may already be gone, or was never an R2 URL — fine either way.
    }
  }

  revalidatePath("/journal/settings");
  if (current.username) revalidatePath(`/u/${current.username}`);
}

// --- Everything below powers /discover and /u/[username] — unauthenticated
// routes (see src/proxy.ts matcher, which deliberately excludes them). No
// requireUserId() here on purpose: privacy is enforced by the
// isPublicProfile / isPrivate filters in each query below, not by login
// state. Don't add auth checks here, add them to the private equivalents. ---

const PUBLIC_TRADES_PER_PAGE = 12;

export interface PublicUserResult {
  username: string;
}

export async function searchPublicUsers(query: string): Promise<PublicUserResult[]> {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { isPublicProfile: true, username: { startsWith: q } },
    select: { username: true },
    orderBy: { username: "asc" },
    take: 20,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
  return users.map((u: any) => ({ username: u.username as string }));
}

export interface PublicProfile {
  username: string;
  trades: PlainTradeListItem[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export async function getPublicProfile(rawUsername: string, page = 1): Promise<PublicProfile | null> {
  const username = rawUsername.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, isPublicProfile: true },
  });
  if (!user || !user.isPublicProfile || !user.username) return null;

  const where = { userId: user.id, isPrivate: false };
  const [trades, totalCount] = await Promise.all([
    prisma.trade.findMany({
      where,
      orderBy: { entryAt: "desc" },
      include: {
        tradingAccount: { select: { name: true } },
        images: { take: 1 },
        tags: { include: { tag: true } },
      },
      skip: (page - 1) * PUBLIC_TRADES_PER_PAGE,
      take: PUBLIC_TRADES_PER_PAGE,
    }),
    prisma.trade.count({ where }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
  const plain = trades.map((t: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
    const flatTags = t.tags.map((tt: any) => tt.tag);
    return toPlainTrade({ ...t, tags: flatTags }) as PlainTradeListItem;
  });

  return {
    username: user.username,
    trades: plain,
    totalCount,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / PUBLIC_TRADES_PER_PAGE)),
  };
}

export async function getPublicTrade(rawUsername: string, tradeId: string) {
  const username = rawUsername.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, isPublicProfile: true },
  });
  if (!user || !user.isPublicProfile) return null;

  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId: user.id, isPrivate: false },
    include: {
      tradingAccount: true,
      images: { orderBy: { createdAt: "asc" } },
      tags: { include: { tag: true } },
    },
  });
  if (!trade) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
  const flatTags = trade.tags.map((tt: any) => tt.tag);
  return {
    ...(toPlainTrade({ ...trade, tags: flatTags }) as PlainTradeDetail),
    ownerUsername: user.username as string,
  };
}
