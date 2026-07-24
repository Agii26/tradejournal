"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import {
  DEFAULT_TAGS,
  TAG_CATEGORY_ORDER,
  TAG_CATEGORY_LABELS,
  type TagCategoryValue,
} from "@/lib/default-tags";

export interface PlainTag {
  id: string;
  name: string;
  category: TagCategoryValue;
}

export interface TagGroup {
  category: TagCategoryValue;
  label: string;
  tags: PlainTag[];
}

/**
 * Seeds any curated tag the user doesn't already have. Runs for brand-new
 * signups (first visit to the tag picker) and self-heals for existing
 * accounts whenever DEFAULT_TAGS grows — like today, adding Mistakes/
 * Emotions on top of the original 81 from Phase 3. Comparing against
 * DEFAULT_TAGS.length (not just "> 0") is what makes the self-healing part
 * work; a user's own custom tags push them past that count too, so this
 * still short-circuits to a single cheap query on every normal call.
 */
async function ensureDefaultTags(userId: string) {
  const count = await prisma.tag.count({ where: { userId } });
  if (count >= DEFAULT_TAGS.length) return;

  await prisma.tag.createMany({
    data: DEFAULT_TAGS.map((t) => ({ ...t, userId })),
    skipDuplicates: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
function toPlainTag(t: any): PlainTag {
  return { id: t.id, name: t.name, category: t.category as TagCategoryValue };
}

export async function getTagGroups(): Promise<TagGroup[]> {
  const userId = await requireUserId();
  await ensureDefaultTags(userId);

  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  const plainTags: PlainTag[] = tags.map(toPlainTag);

  return TAG_CATEGORY_ORDER.map((category) => ({
    category,
    label: TAG_CATEGORY_LABELS[category],
    tags: plainTags.filter((t) => t.category === category),
  }));
}

export type ActionState = { error?: string } | undefined;

export async function createCustomTag(
  _prevState: ActionState,
  formData: FormData
): Promise<{ error?: string; tag?: PlainTag }> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "") as TagCategoryValue;

  if (!name || name.length > 40) {
    return { error: "Tag name must be 1–40 characters" };
  }
  if (!TAG_CATEGORY_ORDER.includes(category)) {
    return { error: "Invalid category" };
  }

  const existing = await prisma.tag.findUnique({
    where: { userId_name: { userId, name } },
  });
  if (existing) {
    return {
      tag: { id: existing.id, name: existing.name, category: existing.category as TagCategoryValue },
    };
  }

  const tag = await prisma.tag.create({ data: { userId, name, category } });
  return { tag: { id: tag.id, name: tag.name, category: tag.category as TagCategoryValue } };
}
