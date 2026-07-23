"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { signupSchema, loginSchema } from "@/lib/validation";
import { createDefaultTradingAccount } from "@/lib/actions/accounts";

export type ActionState = { error?: string } | undefined;

export async function signup(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  await createDefaultTradingAccount(user.id);

  try {
    await signIn("credentials", { email, password, redirectTo: "/journal" });
  } catch (error) {
    if (error instanceof AuthError) {
      // Account was created fine — this would only fire if sign-in itself
      // rejects, which shouldn't happen right after we just hashed this
      // exact password. Send them to log in manually rather than block them.
      return { error: "Account created — please log in." };
    }
    throw error; // NEXT_REDIRECT on success surfaces through here — must propagate
  }
}

export async function login(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/journal" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Incorrect email or password" };
    }
    throw error;
  }
}
