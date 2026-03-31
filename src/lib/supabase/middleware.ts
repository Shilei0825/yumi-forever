import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected route patterns
  const protectedPaths = ['/portal', '/crew', '/dispatch', '/admin']
  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login/user'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const role = profile.role
      const rolePathMap: Record<string, string> = {
        customer: '/portal',
        crew: '/crew',
        dispatcher: '/dispatch',
        admin: '/admin',
      }

      // Check if user is accessing a route they're not authorized for
      const allowedPath = rolePathMap[role]
      if (allowedPath && !pathname.startsWith(allowedPath)) {
        // Admin can access everything
        if (role === 'admin') {
          return supabaseResponse
        }
        // Dispatcher can access dispatch routes
        if (role === 'dispatcher' && pathname.startsWith('/dispatch')) {
          return supabaseResponse
        }
        // Redirect to their correct portal
        const url = request.nextUrl.clone()
        url.pathname = allowedPath
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
