# Migration Recommendations: establishment_id in the Context of Recruiters Collection Decommissioning

**Document Version:** 1.0
**Date:** 2026-01-29
**Status:** Final Recommendation

---

## 1. Executive Summary

After thorough analysis of the codebase, **removing `establishment_id` is NOT recommended** during the recruiters collection decommissioning. The field should be preserved and migrated to the `jobs_partners` collection.

### Key Findings

| Impact Area        | Severity | Details                                                       |
| ------------------ | -------- | ------------------------------------------------------------- |
| **Server Impact**  | HIGH     | 20+ files directly reference `establishment_id`               |
| **UI Impact**      | HIGH     | 11+ components, 6 route patterns depend on it                 |
| **External Links** | CRITICAL | Email links using `establishment_id` would break permanently  |
| **Security**       | HIGH     | UUIDs provide security benefits over ObjectIds in public URLs |

### Recommendation

**Preserve `establishment_id`** by adding it to the `jobs_partners` collection. This approach:

- Maintains backward compatibility with existing URLs and email links
- Preserves security benefits of UUIDs in public-facing URLs
- Minimizes migration complexity and risk
- Allows grouping of jobs by establishment (recruiter)

---

## 2. Comparison: establishment_id vs \_id

| Aspect                | `_id` (ObjectId)                                    | `establishment_id` (UUID)                       |
| --------------------- | --------------------------------------------------- | ----------------------------------------------- |
| **Format**            | 24 character hex string                             | 36 characters with hyphens (8-4-4-4-12)         |
| **Example**           | `507f1f77bcf86cd799439011`                          | `550e8400-e29b-41d4-a716-446655440000`          |
| **Generation**        | MongoDB automatic on insert                         | `crypto.randomUUID()` in application code       |
| **Uniqueness**        | Primary key (guaranteed unique)                     | Assumed unique (**no unique index currently!**) |
| **Predictability**    | Sequential timestamp component, partially guessable | Cryptographically random, not guessable         |
| **Security**          | LOW - can be enumerated                             | HIGH - safe for public URLs                     |
| **Usage in codebase** | Internal DB operations, joins                       | External URLs, API endpoints, email links       |
| **Cardinality**       | 1 per document                                      | 1 per recruiter (1:1 with recruiter)            |
| **URL-safe**          | Yes                                                 | Yes                                             |
| **Human readable**    | No                                                  | No                                              |

### Security Consideration

ObjectIds contain a timestamp component and are generated sequentially. An attacker could:

1. Extract the timestamp to determine when records were created
2. Enumerate IDs by incrementing/decrementing
3. Potentially access unauthorized resources through ID guessing

UUIDs (v4) are cryptographically random, making enumeration attacks infeasible.

---

## 3. Options Analysis

### Option A: Keep establishment_id in jobs_partners (RECOMMENDED)

**Description:** Migrate `establishment_id` from `recruiters` to `jobs_partners` as a field that groups jobs belonging to the same establishment.

#### Pros

- **No breaking changes** - All existing URLs, bookmarks, and email links continue to work
- **Minimal migration effort** - Simple field addition and copy during sync
- **Maintains security** - UUIDs remain in public-facing URLs
- **Preserves semantics** - Jobs from same recruiter remain logically grouped
- **Backward compatible API** - Existing API contracts unchanged

#### Cons

- Additional field to maintain in the new schema
- Need to ensure `establishment_id` is copied during recruiter-to-jobs_partners sync
- Slight data redundancy (same establishment_id on multiple job documents)

#### Implementation Effort

- **Estimated time:** 1-2 days
- **Risk level:** LOW
- **Breaking changes:** None

---

### Option B: Replace with job \_id only (NOT RECOMMENDED)

**Description:** Remove `establishment_id` entirely and use MongoDB `_id` for all job references.

#### Pros

- Simpler data model (one less field)
- Standard MongoDB pattern

#### Cons

- **Breaking change for ALL URLs** - Every job URL changes
- **Email links invalidated** - Historical emails with job links become dead links
- **Massive UI refactor required:**
  - 6+ route patterns to update
  - 11+ components to refactor
  - All tests to update
- **API changes:**
  - 7+ API functions to modify
  - API version bump required
  - Client applications affected
- **Security regression** - ObjectIds are partially guessable
- **Loss of establishment grouping** - Cannot easily query "all jobs for this establishment"

#### Implementation Effort

- **Estimated time:** 2-3 weeks additional work
- **Risk level:** HIGH
- **Breaking changes:** Extensive

#### Affected Routes (UI)

```
/espace-recruteur/etablissement/:establishment_id
/espace-recruteur/etablissement/:establishment_id/offre/creation
/espace-recruteur/etablissement/:establishment_id/offre/:jobId
/espace-recruteur/etablissement/:establishment_id/offre/:jobId/edition
/postuler?establishment_id=XXX
/recherche-apprentissage?establishment_id=XXX
```

#### Affected API Endpoints

```
GET  /etablissement/:establishment_id
GET  /etablissement/:establishment_id/offres
POST /etablissement/:establishment_id/offre
PUT  /etablissement/:establishment_id/offre/:jobId
DELETE /etablissement/:establishment_id/offre/:jobId
GET  /formular/etablissement/:establishment_id
```

---

### Option C: Replace with new UUID per job (HYBRID)

**Description:** Generate a new UUID for each job document in `jobs_partners`, decoupled from the establishment concept.

#### Pros

- Clean break from legacy data model
- Maintains URL security with UUIDs
- Each job has its own unique, secure identifier

#### Cons

- Still requires URL migration (breaking change)
- Email links still break
- Loses establishment grouping capability
- More complex migration (generate new UUIDs, update references)
- Intermediate complexity with most of Option B's downsides

#### Implementation Effort

- **Estimated time:** 1-2 weeks
- **Risk level:** MEDIUM-HIGH
- **Breaking changes:** Significant

---

## 4. Recommended Implementation for jobs_partners

### 4.1 Schema Addition

Add `establishment_id` to the `jobs_partners` model:

```typescript
// shared/src/models/jobsPartners.model.ts

import { z } from "zod"
import { zObjectId } from "./common"

export const ZJobsPartnersRecruiterFields = z.object({
  // Existing fields...

  /**
   * UUID identifying the establishment (recruiter).
   * Used for:
   * - Public URLs (secure, non-guessable)
   * - Grouping jobs from the same establishment
   * - External links in emails
   * - API endpoints
   *
   * Migrated from recruiters.establishment_id
   */
  establishment_id: z.string().uuid().describe("UUID of the establishment for URL routing and job grouping"),

  /**
   * User ID of the recruiter who manages this establishment's jobs
   */
  managed_by: zObjectId.nullable().describe("User ID managing this establishment"),

  /**
   * Status of the recruiter (affects all jobs in establishment)
   */
  recruiter_status: z.enum(["ACTIF", "EN ATTENTE DE VALIDATION", "DESACTIVE"]).optional(),
})
```

### 4.2 Query Patterns

#### Get All Jobs for an Establishment

```typescript
// server/src/services/jobsPartners.service.ts

export async function getEstablishmentJobs(establishment_id: string): Promise<IJobsPartners[]> {
  return getDbCollection("jobs_partners")
    .find({
      establishment_id,
      partner_label: "La bonne alternance", // Only LBA jobs
    })
    .toArray()
}
```

#### Get Single Job (with establishment context)

```typescript
export async function getJob(establishment_id: string, jobId: string): Promise<IJobsPartners | null> {
  return getDbCollection("jobs_partners").findOne({
    _id: new ObjectId(jobId),
    establishment_id,
    partner_label: "La bonne alternance",
  })
}
```

#### Get Establishment Summary

```typescript
export async function getEstablishmentSummary(establishment_id: string) {
  const jobs = await getEstablishmentJobs(establishment_id)

  if (jobs.length === 0) return null

  // All jobs share establishment-level data
  const firstJob = jobs[0]

  return {
    establishment_id,
    company_name: firstJob.workplace_name,
    siret: firstJob.workplace_siret,
    address: firstJob.workplace_address_label,
    managed_by: firstJob.managed_by,
    recruiter_status: firstJob.recruiter_status,
    jobs_count: jobs.length,
    jobs: jobs.map((j) => ({
      _id: j._id,
      title: j.offer_title,
      status: j.offer_status,
      created_at: j.created_at,
    })),
  }
}
```

### 4.3 Route Mapping (Legacy to New)

```typescript
// server/src/http/controllers/establishment.controller.ts

import { FastifyPluginAsync } from "fastify"

export const establishmentRoutes: FastifyPluginAsync = async (server) => {
  // Get establishment with all its jobs
  server.get<{ Params: { establishment_id: string } }>("/etablissement/:establishment_id", async (request, reply) => {
    const { establishment_id } = request.params

    // Query jobs_partners instead of recruiters
    const establishment = await getEstablishmentSummary(establishment_id)

    if (!establishment) {
      return reply.code(404).send({ error: "Establishment not found" })
    }

    return establishment
  })

  // Get specific job within establishment
  server.get<{ Params: { establishment_id: string; jobId: string } }>("/etablissement/:establishment_id/offre/:jobId", async (request, reply) => {
    const { establishment_id, jobId } = request.params

    const job = await getJob(establishment_id, jobId)

    if (!job) {
      return reply.code(404).send({ error: "Job not found" })
    }

    return job
  })
}
```

---

## 5. Data Model in jobs_partners

### Current Model (recruiters)

```
recruiters (1 document per establishment)
├── _id: ObjectId
├── establishment_id: UUID  ← Groups all jobs
├── status: string
├── managed_by: ObjectId (User)
└── jobs: [                 ← Embedded array
    ├── job 1
    ├── job 2
    └── job N
]
```

### New Model (jobs_partners)

```
jobs_partners (1 document per job)
├── _id: ObjectId           ← Unique job identifier
├── establishment_id: UUID  ← Groups jobs from same establishment
├── managed_by: ObjectId    ← User managing this establishment
├── recruiter_status: string ← Status for all jobs in establishment
├── partner_label: "La bonne alternance"
├── offer_title: string
├── offer_description: string
├── workplace_siret: string
├── workplace_name: string
└── ... (other job fields)
```

### Key Relationships

```
                    ┌─────────────────────────────────────┐
                    │          jobs_partners              │
                    │         (per job document)          │
                    ├─────────────────────────────────────┤
                    │ _id: ObjectId (unique per job)      │
    ┌───────────────┤ establishment_id: UUID ─────────────┼───────┐
    │               │ managed_by: ObjectId ───────────────┼───┐   │
    │               │ recruiter_status: string            │   │   │
    │               │ offer_title, offer_description...   │   │   │
    │               └─────────────────────────────────────┘   │   │
    │                                                         │   │
    │   ┌─────────────────────────────────────────────────────┘   │
    │   │                                                         │
    │   ▼                                                         │
    │  ┌──────────────┐    Jobs with same establishment_id        │
    │  │    users     │    belong to the same establishment       │
    │  │  collection  │                     │                     │
    │  └──────────────┘                     │                     │
    │                                       ▼                     │
    │                    ┌─────────────────────────────────────┐  │
    │                    │  Establishment (Virtual Grouping)   │  │
    │                    ├─────────────────────────────────────┤  │
    └────────────────────┤  establishment_id: UUID             │◄─┘
                         │  All jobs with this ID share:       │
                         │    - managed_by (same user)         │
                         │    - recruiter_status               │
                         │    - workplace_siret, workplace_name│
                         └─────────────────────────────────────┘
```

---

## 6. URL Migration Strategy

### Phase 1: Maintain Full Backward Compatibility (Recommended)

Keep all existing URL patterns working exactly as they are:

```
# UI Routes (no changes)
/espace-recruteur/etablissement/[establishment_id]
/espace-recruteur/etablissement/[establishment_id]/offre/creation
/espace-recruteur/etablissement/[establishment_id]/offre/[jobId]
/espace-recruteur/etablissement/[establishment_id]/offre/[jobId]/edition

# API Routes (no changes)
GET  /api/etablissement/:establishment_id
POST /api/etablissement/:establishment_id/offre
PUT  /api/etablissement/:establishment_id/offre/:jobId
```

**Only the data source changes** (from `recruiters` collection to `jobs_partners` collection).

### Phase 2: Add New Direct Job Routes (Optional, Future)

If desired, add new routes that access jobs directly by their `_id`:

```
# New direct job routes (optional)
GET /api/v2/job/:jobId
PUT /api/v2/job/:jobId
DELETE /api/v2/job/:jobId
```

These routes would require proper authorization (user must be `managed_by` for the job's establishment).

### Phase 3: Deprecation (Optional, Long-term)

If consolidating to job-only routes is desired in the future:

1. Add deprecation headers to establishment routes
2. Monitor usage for 6+ months
3. Communicate changes to API consumers
4. Only remove after ensuring no active usage

**Recommendation:** Do NOT proceed to Phase 3 unless there is a compelling business reason.

---

## 7. Index Requirements

Add the following indexes to `jobs_partners` collection for efficient establishment queries:

```typescript
// server/src/migrations/YYYYMMDD-add-establishment-indexes.ts

import { getDbCollection } from "@/common/mongodb"

export const up = async () => {
  const collection = getDbCollection("jobs_partners")

  // Primary index for establishment lookups
  await collection.createIndex(
    { establishment_id: 1 },
    {
      name: "establishment_id_1",
      background: true,
    }
  )

  // Compound index for establishment + LBA filter (most common query)
  await collection.createIndex(
    {
      establishment_id: 1,
      partner_label: 1,
    },
    {
      name: "establishment_id_partner_label_1",
      background: true,
    }
  )

  // Compound index for establishment + status queries
  await collection.createIndex(
    {
      establishment_id: 1,
      offer_status: 1,
    },
    {
      name: "establishment_id_offer_status_1",
      background: true,
    }
  )

  // Index for managed_by queries (find all establishments for a user)
  await collection.createIndex(
    {
      managed_by: 1,
      partner_label: 1,
    },
    {
      name: "managed_by_partner_label_1",
      background: true,
    }
  )

  // Optional: Unique index to prevent duplicate establishment_ids
  // Note: This is per-job, so establishment_id is NOT unique per document
  // Only add if you want to enforce uniqueness of (establishment_id, offer_title) or similar
}

export const down = async () => {
  const collection = getDbCollection("jobs_partners")

  await collection.dropIndex("establishment_id_1")
  await collection.dropIndex("establishment_id_partner_label_1")
  await collection.dropIndex("establishment_id_offer_status_1")
  await collection.dropIndex("managed_by_partner_label_1")
}
```

### Index Size Estimation

| Index                              | Estimated Size per 100k Jobs |
| ---------------------------------- | ---------------------------- |
| `establishment_id_1`               | ~4 MB                        |
| `establishment_id_partner_label_1` | ~5 MB                        |
| `establishment_id_offer_status_1`  | ~5 MB                        |
| `managed_by_partner_label_1`       | ~4 MB                        |

**Total additional index overhead:** ~18 MB per 100k jobs (acceptable)

---

## 8. Action Items

### Pre-Migration

- [ ] Review and approve this recommendation document
- [ ] Create Jira tickets for each migration task
- [ ] Set up feature flag for gradual rollout (if needed)
- [ ] Backup current `recruiters` collection

### Schema Updates

- [ ] Add `establishment_id` field to `jobs_partners` Zod schema
- [ ] Add `managed_by` field to `jobs_partners` Zod schema
- [ ] Add `recruiter_status` field to `jobs_partners` Zod schema
- [ ] Update TypeScript types/interfaces
- [ ] Run `yarn typecheck` to verify schema changes

### Database Migration

- [ ] Create migration to add indexes on `jobs_partners`
- [ ] Run migration on staging environment
- [ ] Verify index creation with `db.jobs_partners.getIndexes()`
- [ ] Run migration on production (during low-traffic period)

### Data Sync Implementation

- [ ] Modify recruiter-to-jobs_partners sync to include `establishment_id`
- [ ] Ensure `establishment_id` is copied for all existing records
- [ ] Verify data integrity after sync
- [ ] Add monitoring for sync failures

### Service Layer Updates

- [ ] Update `getEstablishmentJobs()` to query `jobs_partners`
- [ ] Update `getJob()` to query `jobs_partners`
- [ ] Update `createJob()` to include `establishment_id`
- [ ] Update `updateJob()` to preserve `establishment_id`
- [ ] Update `deleteJob()` if applicable

### API Controller Updates

- [ ] Update establishment routes to use new service methods
- [ ] Verify all existing routes work unchanged
- [ ] Add appropriate error handling
- [ ] Update API documentation (if any)

### Testing

- [ ] Add unit tests for new query patterns
- [ ] Add integration tests for establishment routes
- [ ] Run full E2E test suite (`yarn e2e`)
- [ ] Test with production-like data volume

### Validation & Rollout

- [ ] Deploy to staging environment
- [ ] Perform smoke testing of all establishment routes
- [ ] Verify email links still work
- [ ] Monitor error rates for 24-48 hours
- [ ] Deploy to production
- [ ] Monitor production metrics

### Post-Migration

- [ ] Remove feature flag (if used)
- [ ] Update runbook/documentation
- [ ] Archive old migration scripts
- [ ] Plan for recruiter collection deprecation (separate ticket)

---

## 9. Risks and Mitigations

| Risk                                                        | Likelihood | Impact   | Mitigation                                                                                |
| ----------------------------------------------------------- | ---------- | -------- | ----------------------------------------------------------------------------------------- |
| **Data sync misses establishment_id**                       | Medium     | High     | Add validation in sync process to require establishment_id; alert on null values          |
| **Performance degradation with new indexes**                | Low        | Medium   | Create indexes in background; monitor query performance; have rollback plan               |
| **Missing establishment_id on existing jobs_partners docs** | High       | Medium   | Run backfill script before switching queries; verify 100% coverage                        |
| **API response format changes**                             | Low        | High     | Ensure response format matches existing contract exactly; add integration tests           |
| **Email links break during migration**                      | Low        | Critical | Test email link resolution on staging; keep recruiters readable during transition         |
| **Concurrent writes during sync**                           | Medium     | Medium   | Use transactions or implement idempotent sync; add retry logic                            |
| **Index creation locks collection**                         | Low        | High     | Use `background: true` option; schedule during low-traffic window                         |
| **Rollback needed after partial migration**                 | Low        | High     | Keep recruiters collection unchanged until full validation; have clear rollback procedure |
| **Type mismatches between collections**                     | Medium     | Medium   | Ensure Zod schemas match; run typecheck before deployment                                 |
| **Query timeout on large establishments**                   | Low        | Medium   | Add pagination support; set reasonable timeouts; add query hints                          |

### Rollback Procedure

If issues are discovered after migration:

1. **Immediate:** Revert API controller changes to query `recruiters` collection
2. **Within 1 hour:** Revert service layer changes
3. **Within 24 hours:** Keep new indexes (harmless) or drop if causing issues
4. **Post-mortem:** Document what went wrong; update migration plan

### Monitoring Checklist

- [ ] Set up alerts for 5xx errors on establishment routes
- [ ] Monitor query performance (p95 latency)
- [ ] Track null `establishment_id` occurrences
- [ ] Monitor sync job success rate
- [ ] Track email link click-through rates (if available)

---

## Appendix A: Files Requiring Updates

### Server Files (20+ files)

```
server/src/services/establishment.service.ts
server/src/services/recruiter.service.ts
server/src/services/jobsPartners.service.ts
server/src/http/controllers/establishment.controller.ts
server/src/http/controllers/recruiter.controller.ts
server/src/http/controllers/publicEstablishment.controller.ts
server/src/jobs/recruiter/syncRecruiters.job.ts
server/src/common/validation/establishment.validation.ts
... (see full analysis document)
```

### UI Components (11+ components)

```
ui/app/(espace-recruteur)/espace-recruteur/etablissement/[establishment_id]/
ui/components/establishment/EstablishmentCard.tsx
ui/components/job/JobForm.tsx
ui/services/establishment.service.ts
... (see full analysis document)
```

### Shared Types

```
shared/src/models/jobsPartners.model.ts
shared/src/models/recruiter.model.ts (to deprecate)
shared/src/routes/establishment.routes.ts
```

---

## Appendix B: Query Performance Comparison

### Before (recruiters collection)

```javascript
// Get establishment with all jobs
db.recruiters.findOne({ establishment_id: "uuid-here" })
// Single document, jobs embedded
// Fast for read, slow for write (large document updates)
```

### After (jobs_partners collection)

```javascript
// Get all jobs for establishment
db.jobs_partners.find({
  establishment_id: "uuid-here",
  partner_label: "La bonne alternance",
})
// Multiple documents
// Fast for both read and write
// Scales better for establishments with many jobs
```

### Expected Performance

| Operation                     | Before (recruiters)     | After (jobs_partners) |
| ----------------------------- | ----------------------- | --------------------- |
| Get establishment (1-10 jobs) | ~5ms                    | ~8ms                  |
| Get establishment (50+ jobs)  | ~15ms                   | ~20ms                 |
| Update single job             | ~50ms (rewrite array)   | ~5ms (single doc)     |
| Add new job                   | ~30ms (push to array)   | ~5ms (insert doc)     |
| Delete job                    | ~40ms (pull from array) | ~5ms (delete doc)     |

**Net result:** Write performance improves significantly; read performance slightly slower but acceptable.

---

_Document prepared for the recruiters collection decommissioning project._
