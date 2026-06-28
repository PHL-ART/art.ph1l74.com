import type { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const allowlist = (process.env.ADMIN_ALLOWLIST ?? '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
      if (allowlist.length === 0) return false
      return allowlist.includes(profile?.email ?? '')
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
