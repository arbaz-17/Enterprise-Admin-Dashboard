
import { SignJWT } from 'jose'
import { env } from '../../config/env.js'

const secret = new TextEncoder().encode(
  env.JWT_ACCESS_SECRET
)

export async function createAccessToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer('enterprise-dashboard-api')
    .setAudience('enterprise-dashboard')
    .setExpirationTime('15m')
    .sign(secret)
}
