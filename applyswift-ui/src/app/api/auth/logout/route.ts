import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/auth-db";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (token) {
    deleteSession(token);
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const response = NextResponse.redirect(`${appUrl}/`);
  response.cookies.set(clearSessionCookie());
  return response;
}
