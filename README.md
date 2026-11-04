# Enterprise Admin Dashboard

A single Git repository with two npm workspaces:

- `frontend/` — existing React 19 + TypeScript + Vite application (preserved from the uploaded project)
- `backend/` — Express 5 + TypeScript API

## Requirements

Node.js **22.12 or newer** and npm 10 or newer are recommended for the existing Vite 8 setup. Use `node -v` and `npm -v` to check versions.

## First-time setup

Open a terminal at the **project root**, where this README and root `package.json` are located.

```bash
npm install
cp backend/.env.example backend/.env  # macOS / Linux / Git Bash
# On Windows PowerShell instead: Copy-Item backend/.env.example backend/.env
npm run dev
```

Copying `.env.example` is optional because the backend defaults to port 5000.

Open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/api/health
- Via frontend proxy: http://localhost:5173/api/health

Both health URLs should return:

```json
{"status":"ok","service":"enterprise-admin-dashboard-api"}
```

The React UI itself remains the original Vite starter; no dashboard UI has been implemented or replaced by this setup.

## Commands (run from root)

| Command | Function |
| --- | --- |
| `npm run dev` | Start React and Express together |
| `npm run dev:frontend` | Start only React |
| `npm run dev:backend` | Start only Express |
| `npm run build` | Build both applications |
| `npm run lint` | Lint React frontend |
| `npm run check` | Lint frontend and build both |
| `npm run start:backend` | Run compiled backend after building |

Run frontend-only installs from the root with `npm install <package> -w frontend`, or backend installs with `npm install <package> -w backend`. Workspace dependencies and their lockfile are handled by npm at the root.

## API connection

The Vite development server forwards `/api/*` requests to Express on port 5000. Frontend code can call `fetch('/api/health')`, without a hardcoded backend URL. This proxy is for local development; production deployment requires an equivalent reverse proxy or a separately configured API endpoint and cross-origin policy.

## Git: one repository at root

**Preferred if your GitHub repository already exists:** clone the repository first, then copy these files into the clone. This keeps all existing commits and the root `.git` history intact.

If starting with only this downloaded ZIP and no existing Git history, initialize once at the root:

```bash
git init
git branch -M main
git add .
git commit -m "Set up React and Express monorepo"
```

Do **not** run `git init` in `frontend/` or `backend/`. Git metadata is intentionally not bundled in the ZIP. A GitHub ZIP normally contains files, but not the `.git` directory or commit history.

## Notes

- `.gitignore` protects local `.env` files, `node_modules`, build output, and editor files.
- Real backend secrets belong only in `backend/.env`, not in React/Vite source files.
- `backend/.env.example` contains safe sample settings and should be committed.
- If changing `PORT`, also update `frontend/vite.config.ts`'s proxy target.
