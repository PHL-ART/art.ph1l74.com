import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    if (req.nextUrl.pathname === '/admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
  },
  {
    pages: { signIn: '/admin/login' },
  }
)

export const config = {
  matcher: ['/admin', '/admin/((?!login$).*)'],
}
