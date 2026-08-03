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
import { auth } from "@/auth";
import { computeAnalytics } from "@/lib/analytics";
import type { PlainTradeListItem, PlainTradeDetail } from "@/lib/actions/trades";

export interface PlainUserSettings {
  username: string | null;
  isPublicProfile: boolean;
  image: string | null;
  coverImage: string | null;
  bio: string | null;
}

export async function getUserSettings(): Promise<PlainUserSettings> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { username: true, isPublicProfile: true, image: true, coverImage: true, bio: true },
  });
  return {
    username: user.username,
    isPublicProfile: user.isPublicProfile,
    image: user.image,
    coverImage: user.coverImage,
    bio: user.bio,
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
  const rawBio = formData.get("bio");
  const bio = typeof rawBio === "string" && rawBio.trim().length > 0 ? rawBio.trim().slice(0, 160) : null;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== userId) {
    return { error: "That username's taken" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { username, isPublicProfile, bio },
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
  name: string | null;
  image: string | null;
  coverImage: string | null;
  bio: string | null;
  trades: PlainTradeListItem[];
  totalCount: number;
  page: number;
  totalPages: number;
  stats: { winRate: number | null; profitFactor: number | null; publicTradeCount: number };
  followerCount: number;
  followingCount: number;
  isOwnProfile: boolean;
  viewerIsLoggedIn: boolean;
  viewerFollows: boolean;
}

export async function getPublicProfile(rawUsername: string, page = 1): Promise<PublicProfile | null> {
  const username = rawUsername.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, isPublicProfile: true, name: true, image: true, coverImage: true, bio: true },
  });
  if (!user || !user.isPublicProfile || !user.username) return null;

  const where = { userId: user.id, isPrivate: false };
  const [trades, totalCount, statsSource, followerCount, followingCount, session] = await Promise.all([
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
    // Full (unpaginated) field set for stats — computeAnalytics needs every
    // public trade, not just the current page, to get win rate/profit
    // factor right.
    prisma.trade.findMany({
      where,
      select: { id: true, symbol: true, direction: true, entryAt: true, exitAt: true, netPnl: true, realizedR: true, setupGrade: true },
    }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    auth(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
  const plain = trades.map((t: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
    const flatTags = t.tags.map((tt: any) => tt.tag);
    return toPlainTrade({ ...t, tags: flatTags }) as PlainTradeListItem;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
  const analytics = computeAnalytics(statsSource.map((t: any) => ({ ...t, netPnl: t.netPnl === null ? null : Number(t.netPnl) })));

  const viewerId = session?.user?.id;
  const isOwnProfile = viewerId === user.id;
  const viewerFollows =
    !isOwnProfile && viewerId
      ? (await prisma.follow.count({ where: { followerId: viewerId, followingId: user.id } })) > 0
      : false;

  return {
    username: user.username,
    name: user.name,
    image: user.image,
    coverImage: user.coverImage,
    bio: user.bio,
    trades: plain,
    totalCount,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / PUBLIC_TRADES_PER_PAGE)),
    stats: {
      winRate: analytics.winRate,
      profitFactor: analytics.profitFactor,
      publicTradeCount: totalCount,
    },
    followerCount,
    followingCount,
    isOwnProfile,
    viewerIsLoggedIn: !!viewerId,
    viewerFollows,
  };
}

export async function toggleFollow(targetUsername: string): Promise<{ following: boolean }> {
  const viewerId = await requireUserId();
  const username = targetUsername.trim().toLowerCase();

  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) throw new Error("User not found");
  if (target.id === viewerId) throw new Error("Can't follow yourself");

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: target.id } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { followerId: viewerId, followingId: target.id } });
  }

  revalidatePath(`/u/${username}`);
  return { following: !existing };
}

const FOLLOW_LIST_PER_PAGE = 30;

export interface FollowListEntry {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  viewerFollows: boolean;
  isViewer: boolean;
}

export interface FollowListResult {
  profileUsername: string;
  kind: "followers" | "following";
  entries: FollowListEntry[];
  totalCount: number;
  page: number;
  totalPages: number;
  viewerIsLoggedIn: boolean;
}

export async function getFollowList(
  rawUsername: string,
  kind: "followers" | "following",
  page = 1
): Promise<FollowListResult | null> {
  const username = rawUsername.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, isPublicProfile: true },
  });
  if (!user || !user.isPublicProfile || !user.username) return null;

  const skip = (page - 1) * FOLLOW_LIST_PER_PAGE;
  const personSelect = { id: true, username: true, name: true, image: true };

  const [rows, totalCount, session] =
    kind === "followers"
      ? await Promise.all([
          prisma.follow.findMany({
            where: { followingId: user.id },
            include: { follower: { select: personSelect } },
            orderBy: { createdAt: "desc" },
            skip,
            take: FOLLOW_LIST_PER_PAGE,
          }),
          prisma.follow.count({ where: { followingId: user.id } }),
          auth(),
        ])
      : await Promise.all([
          prisma.follow.findMany({
            where: { followerId: user.id },
            include: { following: { select: personSelect } },
            orderBy: { createdAt: "desc" },
            skip,
            take: FOLLOW_LIST_PER_PAGE,
          }),
          prisma.follow.count({ where: { followerId: user.id } }),
          auth(),
        ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
  const people = (rows as any[])
    .map((r) => (kind === "followers" ? r.follower : r.following))
    .filter((p): p is { id: string; username: string | null; name: string | null; image: string | null } => !!p?.username);

  const viewerId = session?.user?.id;
  let viewerFollowsSet = new Set<string>();
  if (viewerId && people.length > 0) {
    const viewerFollowRows = await prisma.follow.findMany({
      where: { followerId: viewerId, followingId: { in: people.map((p) => p.id) } },
      select: { followingId: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
    viewerFollowsSet = new Set((viewerFollowRows as any[]).map((r) => r.followingId));
  }

  return {
    profileUsername: user.username,
    kind,
    entries: people.map((p) => ({
      id: p.id,
      username: p.username as string,
      name: p.name,
      image: p.image,
      viewerFollows: viewerFollowsSet.has(p.id),
      isViewer: p.id === viewerId,
    })),
    totalCount,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / FOLLOW_LIST_PER_PAGE)),
    viewerIsLoggedIn: !!viewerId,
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
