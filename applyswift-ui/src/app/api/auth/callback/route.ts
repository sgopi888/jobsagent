import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { verifyOAuthState, upsertGoogleUser, createSession } from "@/lib/auth-db";
import { sessionCookieOptions, isEmailAllowed } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${appUrl}/api/auth/callback`;

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Google returned an error (user cancelled, etc.)
  if (error) {
    return NextResponse.redirect(`${appUrl}/?auth_error=${error}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/?auth_error=missing_params`);
  }

  // Verify CSRF state
  console.log("[auth/callback] state from Google:", state);
  const stateValid = verifyOAuthState(state);
  console.log("[auth/callback] verifyOAuthState result:", stateValid);
  if (!stateValid) {
    return NextResponse.redirect(`${appUrl}/?auth_error=invalid_state`);
  }

  try {
    // Exchange code for tokens
    const client = new OAuth2Client(clientId, clientSecret, redirectUri);
    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      return NextResponse.redirect(`${appUrl}/?auth_error=no_id_token`);
    }

    // Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return NextResponse.redirect(`${appUrl}/?auth_error=invalid_token`);
    }

    // Check email allowlist/blocklist
    if (!isEmailAllowed(payload.email)) {
      return NextResponse.redirect(`${appUrl}/?auth_error=email_not_allowed`);
    }

    // Upsert user and create session
    const user = upsertGoogleUser(
      payload.sub,
      payload.email,
      payload.name || payload.email.split("@")[0]
    );
    const token = createSession(user.id);

    // Redirect to dashboard with session cookie
    const response = NextResponse.redirect(`${appUrl}/dashboard`);
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${appUrl}/?auth_error=callback_failed`);
  }
}
