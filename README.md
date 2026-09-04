# Equipo-4-MLOPS

On-premise monolithic image annotation portal for the MLOps course project (COCO dataset generation).

## Status

- Phase 1 & 2 repository setup: **Completed**.

## Repository Rules

- Stable branch: `main`
- Development work should be done in feature branches.
- Do not commit local environment files (`.env`) or generated dependencies (`node_modules`).
- The `.env.example` file must contain only safe sample values without real secrets.

## Architecture & Stack

- **Language:** TypeScript (Strict Mode)
- **Backend & Validation:** Express.js + Zod
- **Database & ORM:** MariaDB + Drizzle ORM
- **Storage:** MinIO (S3-compatible)
- **Infrastructure:** Docker / Docker Compose
- **Quality:** Biome

## Application Layers

- **Presentation/UI boundary:** `src/presentation` contains HTTP-facing controllers.
- **Logic:** `src/logic` contains application services and business rules.
- **Data:** `src/data` contains repositories and data-source adapters.
- **Composition root:** `src/app.ts` wires the layers together, while `src/server.ts` only starts the process.

## Setup (Clone-to-Run)

Requires [Node.js](https://nodejs.org/) v20+ and [Docker](https://www.docker.com/).

1. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

2. **Install dependencies:**
   ```bash
   npm ci
   ```

3. **Run verification commands:**
   ```bash
   npm run typecheck
   npm run check
   npm run test
   npm run build
   ```

4. **Start the application locally:**
   ```bash
   npm run dev
   ```

   The application should listen on `http://localhost:3000` and return:

   ```json
   {
     "name": "equipo-4-mlops",
     "status": "ok",
     "environment": "development"
   }
   ```

5. **Start the full Docker stack:**
   ```bash
   docker compose up --build
   ```

   Docker Compose starts the application, MariaDB, MinIO, and the MinIO bucket initialization job.
