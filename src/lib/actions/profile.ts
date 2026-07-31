"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { usernameSchema } from "@/lib/validation";

export interface PlainUserSettings {
  username: string | null;
  isPublicProfile: boolean;
}

export async function getUserSettings(): Promise<PlainUserSettings> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { username: true, isPublicProfile: true },
  });
  return { username: user.username, isPublicProfile: user.isPublicProfile };
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
