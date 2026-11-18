# Authentication

## Overview

Backend password authentication, signed access JWTs, and database-backed refresh sessions.

## Key Responsibilities

- Validate login credentials and authenticate active accounts.
- Issue 15-minute bearer access tokens and rotating refresh tokens.
- Hash stored refresh tokens; detect reused tokens and revoke affected session families.
- Support refresh, logout, and safe public-user responses.

## Structure

| File | Purpose |
| --- | --- |
| `schemas.ts` | Zod validation and normalization for login requests. |
| `repository.ts` | Finds a user and password hash for login verification. |
| `password.ts` | bcrypt password hashing and verification helpers. |
| `tokens.ts` | Signs and verifies HS256 JWTs using issuer/audience checks. |
| `sessions.ts` | Refresh-cookie options, token hashing, session creation, rotation, and revocation. |
| `services.ts` | Orchestrates login and refresh authentication workflows. |

## How It Works

`POST /api/auth/login` validates credentials, verifies the bcrypt hash, and issues a JWT plus an HttpOnly refresh cookie. `POST /refresh` consumes and rotates the session token; reuse triggers revocation of its token family. `POST /logout` revokes the current family and clears the cookie. `GET /me` returns the active user and permissions.
