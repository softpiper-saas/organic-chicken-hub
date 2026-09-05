import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/admin", "/api/admin", "/api/scrape"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function unauthorized(message = "Authentication required") {
  return new NextResponse(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Organic Foods Hub Admin"',
    },
  });
}

function decodeBasicCredentials(authHeader: string) {
  const encoded = authHeader.replace(/^Basic\s+/i, "");
  try {
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) return null;

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function isAuthorized(authHeader: string | null) {
  const adminSecret = process.env.ADMIN_SECRET;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!authHeader) return false;

  if (adminSecret && authHeader === `Bearer ${adminSecret}`) {
    return true;
  }

  if (!adminUsername || !adminPassword || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const credentials = decodeBasicCredentials(authHeader);

  return (
    credentials?.username === adminUsername &&
    credentials.password === adminPassword
  );
}

function hasAdminCredentials() {
  return Boolean(
    process.env.ADMIN_SECRET ||
    (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD)
  );
}

export function proxy(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!hasAdminCredentials() && process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  if (!hasAdminCredentials()) {
    return unauthorized("Admin credentials are not configured");
  }

  if (!isAuthorized(request.headers.get("authorization"))) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/scrape/:path*"],
};
