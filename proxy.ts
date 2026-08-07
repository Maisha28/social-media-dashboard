import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";

/**
 * Gates every app route on a signed session cookie.
 *
 * The previous version checked `localStorage.getItem('isLoggedIn')` inside a
 * client component, which anyone could set from the browser console — and which
 * flashed protected content before redirecting. Doing it here means an
 * unauthenticated request never receives the page at all.
 *
 * (Next 16 renamed the `middleware` file convention to `proxy`.)
 */
const PUBLIC_PATHS = ["/login"];

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // Already signed in? Skip the login page.
  if (session && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *  - /api routes (they do their own checks, and Meta's OAuth callback must
     *    stay reachable without a session)
     *  - Next internals and static assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
