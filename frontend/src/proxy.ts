import { NextResponse, type NextRequest } from "next/server";
import { decodeToken } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/register", "/unauthorized"];
const ADMIN_ONLY_PREFIXES = ["/admin"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  const session = token ? decodeToken(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (ADMIN_ONLY_PREFIXES.some((path) => pathname.startsWith(path)) && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
