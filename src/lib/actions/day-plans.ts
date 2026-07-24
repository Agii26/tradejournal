"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { dayPlanSchema } from "@/lib/validation";

export interface PlainDayPlan {
  id: string;
  date: string;
  sleepScore: number | null;
  stressLevel: number | null;
  mood: string | null;
  notes: string | null;
}

/**
 * Date-only "today," normalized to UTC midnight to match Prisma's @db.Date
 * storage. This is server-clock "today," not the user's local calendar day —
 * fine for a single-user personal app, would need a stored timezone
 * preference to be fully correct once this is multi-user.
 */
function todayDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function getTodayDayPlan(): Promise<PlainDayPlan | null> {
  const userId = await requireUserId();
  const plan = await prisma.dayPlan.findUnique({
    where: { userId_date: { userId, date: todayDateOnly() } },
  });
  if (!plan) return null;
  return {
    id: plan.id,
    date: plan.date.toISOString(),
    sleepScore: plan.sleepScore,
    stressLevel: plan.stressLevel,
    mood: plan.mood,
    notes: plan.notes,
  };
}

export type ActionState = { error?: string } | undefined;

export async function upsertTodayDayPlan(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = dayPlanSchema.safeParse({
    sleepScore: formData.get("sleepScore"),
    stressLevel: formData.get("stressLevel"),
    mood: formData.get("mood"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const date = todayDateOnly();
  await prisma.dayPlan.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, ...parsed.data },
    update: { ...parsed.data },
  });

  revalidatePath("/journal");
  return undefined;
}
