import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/_next/webpack-hmr')) {
    return NextResponse.next()
  }

  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true'
  const isMaintenancePage = request.nextUrl.pathname === '/maintenance'
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  if (isMaintenanceMode && !isMaintenancePage && !isApiRoute) {
    return NextResponse.rewrite(new URL('/maintenance', request.url))
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
