import { NextResponse } from "next/server";
import { createOAuthState } from "@/lib/auth-db";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID not configured" }, { status: 500 });
  }

  let state: string;
  try {
    state = createOAuthState();
    console.log("[auth/login] state created successfully:", state);
  } catch (err) {
    console.error("[auth/login] createOAuthState failed:", err);
    return NextResponse.json({ error: "Failed to create state" }, { status: 500 });
  }

  const redirectUri = `${appUrl}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  console.log("[auth/login] redirecting to Google with state:", state);
  return NextResponse.redirect(googleUrl);
}
