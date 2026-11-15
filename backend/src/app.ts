
import express, { type RequestHandler } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";

import { usersRouter } from "./routes/users.js";
import { departmentsRouter } from "./routes/departments.js";
import { employeesRouter } from "./routes/employees.js";
import { clientsRouter } from "./routes/clients.js";
import { projectsRouter } from "./routes/projects.js";
import { projectAssignmentsRouter } from "./routes/project-assignments.js";
import { dashboardRouter } from "./routes/dashboard.js";

// Helmet provides a default-exported middleware factory.
// The assertion handles Vercel's TypeScript import typing mismatch,
// while retaining a static import for serverless dependency bundling.
const createHelmet = helmet as unknown as () => RequestHandler;

export const app = express();

app.disable("x-powered-by");

// Request logging
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({
        method: req.method,
        path: req.url?.split("?")[0],
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  }),
);

// Security headers
app.use(createHelmet());

// CORS
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  }),
);

// Global API rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

// Request parsers
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// API routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use(
  "/api/projects/:projectId/assignments",
  projectAssignmentsRouter,
);
app.use("/api/projects", projectsRouter);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Vercel Express entry point
export default app;
