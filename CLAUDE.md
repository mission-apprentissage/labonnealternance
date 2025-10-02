# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

La bonne alternance is a platform for finding apprenticeship training and job opportunities. It's a monorepo with three main workspaces:

- `server/` - FastAPI backend with Node.js/TypeScript
- `ui/` - Next.js frontend with React/TypeScript
- `shared/` - Shared utilities, types, and validation schemas

## Development Commands

### Setup and Installation

```bash
yarn              # Install dependencies
yarn setup        # Configure environment files from vault
yarn dev          # Start full development stack
yarn seed         # Seed database with test data
```

### Individual Services

```bash
yarn server:dev   # Start server only
yarn ui:dev       # Start UI only
yarn services:start    # Start Docker services (MongoDB, etc.)
yarn services:stop     # Stop Docker services
yarn services:clean    # Clean Docker services and volumes
```

### Testing and Code Quality

```bash
yarn test         # Run all tests with Vitest
yarn test:ci      # Run tests in CI mode
yarn e2e          # Open Cypress for E2E tests
yarn lint         # Lint all code with ESLint
yarn lint:fix     # Fix linting issues
yarn typecheck    # TypeScript type checking across all workspaces
yarn prettier:check  # Check code formatting
yarn prettier:fix    # Fix code formatting
```

### Database Operations

```bash
yarn cli migrations:status    # Check migration status
yarn cli migrations:up        # Run pending migrations
yarn migration:create -d <name>  # Create new migration
yarn seed:update              # Update seed data from local DB
```

### Build and Deployment

```bash
yarn build        # Build all workspaces for production
yarn deploy <env> # Deploy to specified environment
```

## Architecture Overview

### Monorepo Structure

- **Yarn workspaces** manage dependencies across `server/`, `ui/`, and `shared/`
- **Shared workspace** contains common types, validation schemas (Zod), and utilities
- **Server** uses Fastify with TypeScript, MongoDB, and job processing
- **UI** uses Next.js with React, Chakra UI, and DSFR design system

### Backend (server/)

- **Framework**: Fastify with TypeScript and Zod validation
- **Database**: MongoDB with custom migration system
- **Architecture**:
  - `src/http/controllers/` - API route handlers
  - `src/services/` - Business logic services
  - `src/jobs/` - Background job processors
  - `src/migrations/` - Database migrations
  - `src/models/` - Shared data models (from shared workspace)
- **Key Features**:
  - Job processing system for partner data imports
  - Email services with Brevo integration
  - File upload with ClamAV virus scanning
  - Rate limiting and security middleware

### Frontend (ui/)

- **Framework**: Next.js 15 with App Router
- **Styling**: Chakra UI + DSFR (French government design system)
- **State**: React Query for server state, React Context for client state
- **Architecture**:
  - `app/` - Next.js App Router pages and layouts
  - `components/` - Reusable React components
  - `services/` - API calls and external integrations
  - `context/` - React Context providers

### Key Dependencies

- **Validation**: Zod schemas shared between frontend and backend
- **Database**: MongoDB with manual migration system
- **Authentication**: JWT tokens with Fastify
- **Jobs**: Custom job processor for data imports
- **Email**: Brevo for transactional emails
- **File Processing**: ClamAV for virus scanning
- **Monitoring**: Sentry for error tracking

### Development Workflow

1. Use `yarn dev` to start full stack (includes Docker services)
2. Database seeding available via `yarn seed`
3. Environment variables managed through encrypted vault system
4. Migrations must be run manually: `yarn cli migrations:up`
5. Always run `yarn typecheck` and `yarn lint` before committing
6. E2E tests use Cypress against local or remote environments

### Important Notes

- Uses GPG-encrypted vault for environment variables
- Custom CLI available via `yarn cli <command>`
- Migration system requires manual execution and monitoring
- Docker Swarm deployment with zero-downtime updates
- Strict TypeScript configuration across all workspaces

### Frontend styling

- Uses MUI for components
- For icons, use Remixicons or the DSFR library

### DSFR Component Development

- Always check the Dsfr component for typing. Here is the global component github repository https://github.com/codegouvfr/react-dsfr/tree/main/src
