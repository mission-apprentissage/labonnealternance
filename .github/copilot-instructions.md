# Copilot Instructions for La Bonne Alternance

## Project Overview

**La Bonne Alternance (LBA)** is a French government platform for finding apprenticeship training and job opportunities. It's a full-stack web application serving job seekers, employers, and training centers.

**Repository Size**: ~93,000 lines of TypeScript/JavaScript code across 3 workspaces  
**Tech Stack**: Node.js 24, Yarn 3.8.7, TypeScript 5.9, Next.js 16 (UI), Fastify (Server), MongoDB, Vitest  
**Architecture**: Monorepo with 3 workspaces: `server` (API), `ui` (Next.js frontend), `shared` (common code)

## Critical Build & Test Requirements

### Prerequisites - ALWAYS verify these first
- **Node.js**: 24+ required (v20 will work but v24 is preferred)
- **Yarn**: 3.8.7 (automatically enforced via `packageManager` field)
- **Docker**: Required for MongoDB and local services
- **MongoDB**: Local instance required for tests via Docker Compose

### Initial Setup - Run in this exact order
```bash
# 1. Install dependencies (REQUIRED first step)
yarn install --immutable

# 2. Type check (validates TypeScript configuration)
yarn typecheck

# 3. Setup MongoDB service (REQUIRED for tests and dev)
docker compose up --build -d --wait mongodb
yarn setup:mongodb

# 4. Note: yarn setup requires GPG keys for vault access (not needed for code changes)
```

### Build Commands - Critical sequence

**Building the project**:
```bash
# Build all workspaces sequentially (server → shared → ui)
yarn build

# Takes ~30-60 seconds for server, 2-3 minutes for UI
# UI build requires React icons preprocessing (automatic)
```

**Important build notes**:
- Server uses `tsup` for bundling, UI uses Next.js
- Build MUST run sequentially (`yarn foreach:seq`), not in parallel
- UI prebuild step runs `react-dsfr update-icons` automatically
- Shared workspace must build before server/ui can use it

### Linting & Formatting - Required before PR

```bash
# Lint (must pass in CI)
yarn lint

# Auto-fix lint issues
yarn lint:fix

# Check formatting (runs in CI)
yarn prettier:check

# Auto-format code
yarn prettier:fix

# Check dependency deduplication (runs in CI)
yarn dedupe --check
```

**ESLint configuration**:
- Uses flat config (`eslint.config.mjs`)
- Separate rules for server (`server/**`), UI (`ui/**`), and shared
- TypeScript strict rules enabled: `@typescript-eslint/no-floating-promises`, `switch-exhaustiveness-check`
- Import alias required: `@` for server/ui source, enforced by `@dword-design/eslint-plugin-import-alias`

**Prettier configuration** (in `package.json`):
- No semicolons (`semi: false`)
- 2 spaces indentation
- 180 char print width
- ES5 trailing commas

### Testing - MongoDB dependency

```bash
# Start MongoDB first (REQUIRED)
docker compose up --build -d --wait mongodb
yarn setup:mongodb

# Run all tests
yarn test:ci

# Run tests in watch mode (development)
yarn test:watch

# Tests take 30-120 seconds typically
```

**Important test notes**:
- Tests REQUIRE MongoDB running locally
- Some tests make external API calls and may fail in isolated environments
- Sequential test execution for `useMongo` hooks (`sequence.hooks: "stack"`)
- Test files: `**/*.test.ts` (server), `**/*.test.(js|jsx)` (UI)
- Setup files: `server/tests/utils/setup.ts`, `ui/tests/setup.ts`

### Common Build Failures & Solutions

**Issue: MongoDB connection errors in tests**
```bash
# Solution: Ensure MongoDB is running and initialized
docker compose up --build -d --wait mongodb
yarn setup:mongodb
# Wait for "Healthy" status before running tests
```

**Issue: TypeScript errors about missing modules**
```bash
# Solution: Rebuild shared workspace first
yarn workspace shared build
yarn typecheck
```

**Issue: ESLint cache issues**
```bash
# Solution: Clear ESLint cache
rm -rf .eslintcache
yarn lint
```

**Issue: Next.js build fails with "icons not found"**
```bash
# Solution: Icons are auto-generated during prebuild
cd ui && yarn prebuild
yarn build
```

**Issue: Prettier check fails**
```bash
# Some files may currently fail Prettier formatting checks.
# To auto-fix formatting issues, run:
yarn prettier:fix
```

## Project Structure & Key Locations

### Root Directory
```
.github/workflows/    # CI/CD workflows (ci.yml is main)
.husky/              # Git hooks (pre-commit runs lint-staged)
.bin/                # CLI tools (mna-lba command)
.infra/              # Infrastructure & deployment configs
server/              # Backend API (Fastify)
ui/                  # Frontend (Next.js 16)
shared/              # Shared types & utilities
package.json         # Root workspace config
eslint.config.mjs    # ESLint flat config
vitest.config.ts     # Vitest test configuration
tsconfig.json        # Root TypeScript config
docker-compose.yml   # Local services (MongoDB, ClamAV, SMTP)
```

### Server Structure (`server/`)
```
src/
  http/
    controllers/     # API endpoint handlers
    middlewares/     # Fastify middleware
  services/          # Business logic layer
  jobs/              # Background jobs & CLI commands
  common/
    apis/            # External API clients
    utils/           # Utility functions
  migrations/        # Database migrations
  security/          # Auth & authorization
  index.ts           # Main entry point
tests/               # Test files
dist/                # Build output (gitignored)
tsup.config.ts       # Build configuration
```

**Server key files**:
- Entry: `src/index.ts`
- API routes: OpenAPI schema-driven via `@fastify/swagger`
- Build: Uses `tsup` with code splitting
- CLI: `yarn cli <command>` runs jobs/migrations

### UI Structure (`ui/`)
```
app/                      # Next.js App Router
  (candidat)/            # Job seeker pages
  (espace-pro)/          # Employer portal
  _components/           # Shared app components
components/              # Reusable UI components
services/                # API client services
utils/                   # Utility functions
public/                  # Static assets
theme/                   # DSFR theme customization
.next/                   # Build output (gitignored)
next.config.mjs          # Next.js configuration
```

**UI key files**:
- Config: `next.config.mjs` (includes CSP, Sentry, standalone output)
- Theme: Uses `@codegouvfr/react-dsfr` (French gov design system)
- Build: Standalone output mode for Docker deployment

### Shared Structure (`shared/`)
```
src/
  constants/       # Shared constants
  routes/          # API route schemas (Zod)
  helpers/         # Utility functions
  models/          # TypeScript types & Zod schemas
dist/              # Build output (gitignored)
```

## GitHub Workflows & CI/CD

### Main CI Workflow (`.github/workflows/ci.yml`)

Runs on: PRs, merge queue  
Steps executed in order:

1. **npm-packages-check**: Security check via `mna-npm-check`
2. **tests**: Main test suite
   - Node.js 24
   - `yarn install --immutable` (validate lockfile)
   - `yarn dedupe --check` (must pass)
   - `yarn typecheck`
   - `yarn lint`
   - MongoDB service start
   - `yarn test:ci`
   - `yarn prettier:check`
   - Upload coverage to Codecov

**Timeout**: 10 minutes for tests job. Note: CI does **not** run `yarn build`; it only validates typecheck, lint, tests, and formatting.

### Pre-commit Hooks (`.husky/pre-commit`)
```bash
yarn lint-staged              # Auto-lint/format staged files
preventSensibleFilesCommit.sh # Check for secrets
yarn node-talisman --githook  # Security scan
```

**lint-staged** configuration (in `package.json`):
- `*.{js,jsx,ts,tsx}`: ESLint fix + Prettier format
- All files: Prettier format
- `yarn.lock`: Run `yarn dedupe`

### Other Workflows
- `merge_queue.yml`: Runs CI on merge queue
- `preview.yml`: Creates preview deployments (comment with 🚀)
- `release.yml`: Automated releases via semantic-release
- `codeql.yml`: Security scanning

## Development Workflow

### Running Locally
```bash
# Start all services (MongoDB, ClamAV, SMTP, server, UI)
yarn dev

# Or run individually:
yarn services:start    # Start Docker services only
yarn server:dev        # Server on localhost:5001
yarn ui:dev           # UI on localhost:3000

# SMTP web UI: localhost:8025
```

**Port configuration**:
- UI: 3000 (Next.js)
- Server: 5001 (Fastify API)
- MongoDB: 27017
- SMTP UI: 8025
- ClamAV: 3310

### Making Changes - Best Practices

**Before making code changes**:
1. Run `yarn typecheck` to establish baseline
2. Run `yarn lint` to check for existing issues
3. Start MongoDB if tests needed: `docker compose up -d mongodb`

**After making changes**:
1. Run `yarn typecheck` (must pass)
2. Run `yarn lint:fix` (auto-fix issues)
3. Run `yarn prettier:fix` (format code)
4. Run relevant tests: `yarn test <path>` or `yarn test:ci`
5. Check git diff to ensure only intended files changed

**Code style requirements**:
- Use TypeScript strict mode
- Prefer type imports: `import type { X } from 'y'`
- Use path aliases: `@/` for server/UI source dirs
- Unused vars must start with `_`
- All promises must be awaited or handled (no floating promises)
- Exhaustive switch statements required

### Commit Message Format

**REQUIRED**: Use Conventional Commits format enforced by commitlint:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

**Example**:
```
feat(lba-1234): add user authentication

- Implement JWT token generation
- Add login endpoint
- Configure session management
```

Configuration: `.husky/commitlint.config.js` extends `@commitlint/config-conventional`

### Pull Request Requirements

**PR Title Format**: MUST include JIRA ticket reference
```
feat(lba-XXX): brief description
fix(lba-XXX): brief description
```

**PR Description**: Place content directly in the PR description field (NOT as a comment)

**PR Description Header**: Extract JIRA key from title and prepend link:
```
https://tableaudebord-apprentissage.atlassian.net/browse/LBA-XXX

## Changes
...
```

**Code Review Focus Areas**:

1. **Security Critical Issues** (highest priority):
   - Check for hardcoded secrets, API keys, or credentials
   - Look for SQL injection and XSS vulnerabilities
   - Verify proper input validation and sanitization
   - Review authentication and authorization logic

2. **Performance Red Flags**:
   - Identify N+1 database query problems
   - Spot inefficient loops and algorithmic issues
   - Check for memory leaks and resource cleanup
   - Review caching opportunities for expensive operations

3. **Code Quality Essentials**:
   - Functions should be focused and appropriately sized
   - Use clear, descriptive naming conventions
   - Ensure proper error handling throughout
   - Suggest refactoring for readability (extract functions, simplify logic)

4. **Review Style**:
   - Be specific and actionable in feedback
   - Explain the "why" behind recommendations
   - Acknowledge good patterns when you see them
   - Ask clarifying questions when code intent is unclear

### Database Migrations

```bash
# Create new migration
yarn migration:create -d <description>

# Check migration status
yarn migrations:status

# Run migrations
yarn migrations:up
```

## Docker & Services

### Local Services (`docker-compose.yml`)
- **mongodb**: Replica set on port 27017, 5GB memory limit
- **clamav**: Antivirus scanning on port 3310 (6min startup)
- **smtp**: Mailpit for email testing on ports 1025/8025

**MongoDB setup notes**:
- Uses custom config at `.infra/local/mongod.conf`
- Requires `mongo_keyfile` with permissions 440 (macOS) or 400 (Linux)
- Replica set must be initialized: `yarn setup:mongodb`
- Health check: `mongosh --eval "db.runCommand('ping').ok"`

### Service Management
```bash
yarn services:start   # Start all services
yarn services:stop    # Stop all services
yarn services:clean   # Remove all services & volumes
```

## Common Pitfalls & Workarounds

### TypeScript Configuration
- 4 separate `tsconfig.json` files (root, server, ui, shared)
- Build references: shared must build before others
- Path aliases configured per workspace in `eslint.config.mjs`

### Workspace Dependencies
- `shared` is a workspace dependency in server/UI
- Changes to shared require rebuild: `yarn workspace shared build`
- Server imports shared via `import { X } from 'shared'`

### Import Patterns
**Server imports**:
```typescript
import type { IMyType } from "@/services/myService"
import { myFunction } from "@/common/utils"
```

**UI imports**:
```typescript
import type { IProps } from "@/types"
import { MyComponent } from "@/components/MyComponent"
```

### Security & Validation
- All API inputs validated via Zod schemas
- OpenAPI auto-generated from Zod schemas
- Talisman scans for secrets in commits
- TODO_SECURITY_FIX comments mark known issues to avoid

## Additional Commands

```bash
# CLI commands (server)
yarn cli <command>        # Run server CLI command
yarn cli migrations:up    # Example: run migrations

# Code quality
yarn knip                 # Find unused files/exports

# Seed data (requires vault access)
yarn seed                 # Apply seed to local DB
yarn seed:update          # Update seed from local DB
```

## TypeScript Best Practices

### Type System
- **Avoid `any`**: Prefer `unknown` with type narrowing or proper types
- **Use discriminated unions** for state machines and complex types
- **Centralize shared contracts**: Define types in `shared/` workspace
- **Utility types**: Leverage `Readonly`, `Partial`, `Record`, `Pick`, `Omit`

### Code Organization
- **Single responsibility**: Keep functions focused and extract helpers when logic branches grow
- **Immutability**: Prefer immutable data and pure functions
- **ES Modules only**: Never emit `require` or CommonJS - use pure ES modules
- **TypeScript target/lib**: UI `tsconfig` targets ES2017; `lib` includes `es2022` in shared/UI. Prefer native features over polyfills where supported.

### Async & Error Handling
- **Use async/await**: Wrap awaits in try/catch with structured errors
- **Guard early**: Check edge cases at function start to avoid deep nesting
- **No floating promises**: All promises must be awaited or handled (enforced by ESLint)
- **Structured logging**: Send errors through Sentry and logging utilities

### Security Practices
- **Validate inputs**: Use Zod schemas for all external input validation
- **Sanitize content**: Use `sanitize-html` before rendering user content
- **No dynamic code**: Avoid `eval()` and dynamic template execution
- **Parameterized queries**: Use MongoDB query builders, never string concatenation
- **Secrets management**: Load from environment variables, never hardcode

## GitHub Actions & CI/CD Best Practices

### Workflow Security
- **Least privilege**: Set explicit `permissions` for `GITHUB_TOKEN` (default: `contents: read`)
- **Pin action versions**: Use full commit SHA or major version tags (e.g., `@v4`), never `@main`
- **Secret management**: Use GitHub Secrets, access via `${{ secrets.SECRET_NAME }}`
- **OIDC authentication**: Prefer OIDC for cloud providers over long-lived credentials

### Performance Optimization
- **Caching**: Use `actions/cache@v4` with `hashFiles()` for cache keys
- **Matrix strategies**: Run tests in parallel across Node versions, OS types
- **Conditional execution**: Use `if` conditions to skip unnecessary jobs
- **Job dependencies**: Use `needs` to define execution order and data passing via `outputs`

### Workflow Structure
- **Clear naming**: Descriptive names for workflows, jobs, and steps
- **Concurrency control**: Use `concurrency` to prevent simultaneous runs
- **Environment protection**: Use GitHub Environments for deployment approvals
- **Reusable workflows**: Extract common patterns with `workflow_call`

## When Instructions Are Incomplete

**Trust these instructions first**. Only search or explore when:
- Command fails unexpectedly
- Information is missing for a specific task
- Instructions appear outdated based on error messages

**If you find errors in these instructions**: Report them to help improve future agent performance.

## Quick Reference Card

| Task | Command | Prerequisites |
|------|---------|---------------|
| Install | `yarn install --immutable` | Node 24+, Yarn 3.8.7 |
| Typecheck | `yarn typecheck` | Dependencies installed |
| Lint | `yarn lint` | - |
| Format | `yarn prettier:fix` | - |
| Build | `yarn build` | Shared built first |
| Test | `yarn test:ci` | MongoDB running |
| Dev mode | `yarn dev` | Docker running |
| Start MongoDB | `docker compose up -d --wait mongodb && yarn setup:mongodb` | Docker |

**Build times**: typecheck ~10s, lint ~30-90s, build ~2-4min, test ~30-120s
