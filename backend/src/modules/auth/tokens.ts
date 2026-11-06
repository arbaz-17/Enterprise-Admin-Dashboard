
import { SignJWT, jwtVerify } from 'jose'
import { env } from '../../config/env.js'

const secret = new TextEncoder().encode(
  env.JWT_ACCESS_SECRET
)

const ISSUER = 'enterprise-dashboard-api'
const AUDIENCE = 'enterprise-dashboard'

// Create access token during login or refresh
export async function createAccessToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime('15m')
    .sign(secret)
}

// Verify a token and extract the user ID
export async function verifyAccessToken(
  token: string
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    })

    return typeof payload.sub === 'string'
      ? payload.sub
      : null
  } catch {
    return null
  }
}
