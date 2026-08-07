import { redirect } from "next/navigation";

/**
 * Middleware has already decided whether this request is authenticated, so the
 * root can redirect on the server. The previous version rendered a spinner and
 * redirected from a useEffect, which cost an extra round trip and flashed.
 */
export default function Home() {
  redirect("/dashboard");
}
