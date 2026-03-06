// Auth helpers for API routes and server components

import { cookies } from "next/headers";
import { getSessionUser, type AuthUser } from "./auth-db";

export type { AuthUser } from "./auth-db";

const SESSION_COOKIE = "session";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionUser(token);
}

export function sessionCookieOptions(token: string) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  };
}

export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  };
}

export function isEmailAllowed(email: string): boolean {
  const allowed = process.env.ALLOWED_EMAILS?.trim();
  const blocked = process.env.BLOCKED_EMAILS?.trim();

  if (blocked) {
    const list = blocked.split(",").map((e) => e.trim().toLowerCase());
    if (list.includes(email.toLowerCase())) return false;
  }

  if (allowed) {
    const list = allowed.split(",").map((e) => e.trim().toLowerCase());
    return list.includes(email.toLowerCase());
  }

  return true; // no whitelist = allow all
}
