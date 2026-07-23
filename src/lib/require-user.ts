import { auth } from "@/auth";

/**
 * Every Server Action must call this before touching the database —
 * proxy-only route protection is optimistic/UX-level and is bypassable
 * (see the CVE noted in proxy.ts), so real enforcement lives here.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}
