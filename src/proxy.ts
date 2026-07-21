import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Imports authConfig only (not auth.ts) so this stays edge-compatible —
// see auth.config.ts for why. Optimistic check only: every protected
// Server Component/Action must still call auth() and verify itself
// (proxy-only protection is spoofable — CVE-2025-29927).
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/journal/:path*"],
};
