import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Edge-safe config only. No Prisma, no bcrypt — this file is imported by
 * proxy.ts, which runs on the Edge runtime. The real `authorize()` (DB
 * lookup + password check) lives in auth.ts, which only route handlers and
 * Server Components import. See auth.ts for why the split exists.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [
    // Shape only — real authorize() is added in auth.ts. Proxy never calls
    // authorize(); it only decodes an existing session JWT for the redirect
    // check below, so this stub is never invoked on the edge.
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async () => null,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      // Add protected route prefixes here as Phase 2+ builds them out.
      const isProtected = request.nextUrl.pathname.startsWith("/journal");
      if (isProtected) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
