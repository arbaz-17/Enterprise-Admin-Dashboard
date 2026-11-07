
import type { ErrorRequestHandler } from 'express'
import { logger } from '../lib/logger.js'

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next
) => {
  if (res.headersSent) {
    next(error)
    return
  }

  const err = error as Error & {
    type?: string
  }

  if (err.type === 'entity.parse.failed') {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON request body',
      },
    })
    return
  }

  if (err.type === 'entity.too.large') {
    res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body is too large',
      },
    })
    return
  }

  logger.error({ err: error }, 'Unhandled API error')

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  })
}
