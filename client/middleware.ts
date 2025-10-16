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

  // CRITICAL: Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // Session timeout configuration (30 minutes of inactivity)
  const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
  const lastActivity = req.cookies.get('last_activity')?.value
  const now = Date.now()

  // Handle session timeout for authenticated users
  if (session) {
    if (lastActivity) {
      const timeSinceLastActivity = now - parseInt(lastActivity)
      
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        // Session timed out - sign out
        await supabase.auth.signOut()
        
        const redirectUrl = new URL('/login', req.url)
        redirectUrl.searchParams.set('timeout', 'true')
        redirectUrl.searchParams.set('message', 'Your session has expired due to inactivity')
        
        // Clear the last_activity cookie
        const response = NextResponse.redirect(redirectUrl)
        response.cookies.delete('last_activity')
        return response
      }
    }

    // Update last activity timestamp
    supabaseResponse.cookies.set('last_activity', now.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TIMEOUT / 1000, // Convert to seconds
      path: '/',
    })
  }

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
  const protectedPaths = ['/dashboard', '/profile', '/admin', '/org', '/tenant', '/jobs', '/resumes']
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

  // Check organization-specific routes (if needed)
  if (pathname.startsWith('/org/') && session) {
    // Add any org-specific validation here if needed
    // For example, check if user belongs to the org in the URL
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}// // middleware.ts
// import { createServerClient } from '@supabase/ssr'
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export async function middleware(req: NextRequest) {
//   let supabaseResponse = NextResponse.next({
//     request: req,
//   })

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return req.cookies.getAll()
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) => {
//             req.cookies.set(name, value)
//             supabaseResponse.cookies.set(name, value, options)
//           })
//         },
//       },
//     }
//   )

//   // CRITICAL: Refresh session if expired - this fixes the 401 errors
//   const {
//     data: { session },
//   } = await supabase.auth.getSession()

//   const pathname = req.nextUrl.pathname

//   // Allow public routes
//   const publicPaths = ['/', '/login', '/register', '/forgot-password', '/debug-session']
//   if (publicPaths.includes(pathname) || pathname.startsWith('/_next')) {
//     return supabaseResponse
//   }

//   // Allow public API routes (if any)
//   if (pathname.startsWith('/api/public')) {
//     return supabaseResponse
//   }

//   // Block unauthenticated users from protected routes
//   const protectedPaths = ['/dashboard', '/profile', '/admin', '/org', '/tenant']
//   const isProtected = protectedPaths.some(path => pathname.startsWith(path))

//   if (isProtected && !session) {
//     const redirectUrl = new URL('/login', req.url)
//     redirectUrl.searchParams.set('redirect', pathname)
//     return NextResponse.redirect(redirectUrl)
//   }

//   // Protect org API routes
//   if (pathname.startsWith('/api/org') && !session) {
//     return NextResponse.json(
//       { success: false, message: 'Unauthorized' },
//       { status: 401 }
//     )
//   }

//   // Check admin routes
//   if (pathname.startsWith('/admin') && session) {
//     const role = session.user.user_metadata?.role || session.user.app_metadata?.role

//     if (role !== 'admin') {
//       console.warn(`❌ Non-admin user ${session.user.email} blocked from ${pathname}`)
//       return NextResponse.redirect(new URL('/dashboard', req.url))
//     }
//   }

//   return supabaseResponse
// }

// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// }