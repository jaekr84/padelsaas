import NextAuth, { type DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface User {
    id?: string
    role?: string
    tenantId?: string
    centerId?: string | null
  }

  interface Session {
    user: {
      id: string
      role: string
      tenantId: string
      centerId?: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    role?: string
    tenantId?: string
    centerId?: string | null
  }
}
