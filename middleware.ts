import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthenticated = !!token

  // Define protected routes
  const protectedRoutes = [
    "/profile",
    "/settings",
    "/budgets",
    "/expenses",
    "/income",
    "/reports",
    "/assistant",
    "/receipts",
  ]

  // Define auth routes
  const authRoutes = ["/auth/login", "/auth/register"]

  const path = request.nextUrl.pathname

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  // Check if the path is an auth route
  const isAuthRoute = authRoutes.some((route) => path === route)

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // For protected routes, check token validity
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/settings/:path*",
    "/budgets/:path*",
    "/expenses/:path*",
    "/income/:path*",
    "/reports/:path*",
    "/assistant/:path*",
    "/receipts/:path*",
    "/auth/login",
    "/auth/register",
  ],
}
