
import type { RequestHandler } from 'express'
import { env } from '../config/env.js'

const allowedOrigin = new URL(env.FRONTEND_ORIGIN).origin

export const requireTrustedOrigin: RequestHandler = (
  req,
  res,
  next
) => {
  const origin = req.get('origin')
  const referer = req.get('referer')

  let sourceOrigin: string | undefined

  if (origin) {
    sourceOrigin = origin
  } else if (referer) {
    try {
      sourceOrigin = new URL(referer).origin
    } catch {
      // Invalid Referer is not trusted.
    }
  }

  if (sourceOrigin !== allowedOrigin) {
    res.status(403).json({
      error: {
        code: 'INVALID_ORIGIN',
        message: 'Request origin not allowed',
      },
    })
    return
  }

  next()
}
