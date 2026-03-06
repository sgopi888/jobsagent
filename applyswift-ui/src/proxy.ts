import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth needed
  if (
    pathname === "/" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get("session");
  if (!session?.value) {
    // API routes: return 401 JSON so fetch() callers don't get HTML
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "not_logged_in" },
        { status: 401 }
      );
    }
    // Page routes: redirect to landing
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth_error", "not_logged_in");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
