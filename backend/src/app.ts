
import express, { type ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'
import {pinoHttp} from 'pino-http'

import { env } from './config/env.js'
import { logger } from './lib/logger.js'


import { authRouter } from './routes/auth.js'
import { healthRouter } from './routes/health.js'
import { notFound } from './middleware/not-found.js'
import { errorHandler } from './middleware/error-handler.js'

import { usersRouter } from './routes/users.js'
import { departmentsRouter } from './routes/departments.js'


export const app = express()

app.disable('x-powered-by')

app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({
        method: req.method,
        path: req.url?.split('?')[0],
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  })
)

app.use(helmet())

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  })
)

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  })
)

// Request parsers
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())


// API routes
app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/departments', departmentsRouter)

// 404 handler (after all API routes)
app.use(notFound)

// Global error handler (always last)
app.use(errorHandler)
