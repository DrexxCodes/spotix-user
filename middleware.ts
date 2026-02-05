import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for User Portal
 * 
 * Protects routes and preserves redirect destinations for unauthenticated users
 */

// Routes that require authentication
const protectedRoutes = [
  '/payment',
  '/ticket-history',
  '/profile',
  '/Referrals',
  '/iwss',
  '/refund',
  '/refund-track',
  '/vote',
]

// Public routes (accessible without authentication)
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/not-found',
]

// Helper to check if a path matches protected routes (including wildcards)
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => {
    // Exact match
    if (pathname === route) return true
    // Wildcard match (e.g., /ticket-history/* or /iwss/*)
    if (pathname.startsWith(route + '/')) return true
    return false
  })
}

// Helper to check if a path is a public route
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route))
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  
  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Check if the current route is protected
  if (isProtectedRoute(pathname)) {
    // Get session cookie
    const session = request.cookies.get('session')?.value

    // If no session, redirect to login with the current path as redirect param
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      
      // Preserve any existing query parameters from the original request
      searchParams.forEach((value, key) => {
        loginUrl.searchParams.set(key, value)
      })
      
      console.log('🔒 Unauthenticated access to protected route:', pathname)
      console.log('↪️  Redirecting to:', loginUrl.toString())
      
      return NextResponse.redirect(loginUrl)
    }

    console.log('✅ Authenticated access to protected route:', pathname)
  }

  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp).*)',
  ],
}