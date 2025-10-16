// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // CRITICAL: Refresh session if expired - this fixes the 401 errors
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // Allow public routes
  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/debug-session']
  if (publicPaths.includes(pathname) || pathname.startsWith('/_next')) {
    return supabaseResponse
  }

  // Allow public API routes (if any)
  if (pathname.startsWith('/api/public')) {
    return supabaseResponse
  }

  // Block unauthenticated users from protected routes
  const protectedPaths = ['/dashboard', '/profile', '/admin', '/org', '/tenant']
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtected && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Protect org API routes
  if (pathname.startsWith('/api/org') && !session) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Check admin routes
  if (pathname.startsWith('/admin') && session) {
    const role = session.user.user_metadata?.role || session.user.app_metadata?.role

    if (role !== 'admin') {
      console.warn(`❌ Non-admin user ${session.user.email} blocked from ${pathname}`)
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}