# Equipo-4-MLOPS

On-premise monolithic image annotation portal for the MLOps course project (COCO dataset generation).

## Status

- Phase 1 & 2 repository setup: **In progress**.

## Repository Rules

- Stable branch: `main`
- Development work should be done in feature branches.
- Do not commit local environment files (`.env`) or generated dependencies (`node_modules`).
- The `.env.example` file must contain only safe sample values without real secrets.

## Architecture & Stack

- **Language:** TypeScript (Strict Mode)
- **Backend & Validation:** Express.js + Zod 4
- **Database & ORM:** MariaDB + Drizzle ORM
- **Storage:** MinIO (S3-compatible)
- **Infrastructure:** Docker / Docker Compose
- **Quality:** Biome

## Setup (Clone-to-Run)

Requires [Node.js](https://nodejs.org/) v20+ and [Docker](https://www.docker.com/).

1. **Configure environment:** 
   ```bash
   cp .env.example .env