# Server-Side Usage of `establishment_id`

This document provides a comprehensive analysis of how `establishment_id` is used throughout the La Bonne Alternance server-side codebase.

## Table of Contents

1. [Definition and Generation](#1-definition-and-generation)
2. [Database Index](#2-database-index)
3. [API Endpoints Using establishment_id](#3-api-endpoints-using-establishment_id)
4. [Service Functions Querying by establishment_id](#4-service-functions-querying-by-establishment_id)
5. [URLs and Links in Emails](#5-urls-and-links-in-emails)
6. [Authorization System](#6-authorization-system)
7. [Complete File List](#7-complete-file-list)

---

## 1. Definition and Generation

### Schema Definition

**File:** `/shared/src/models/recruiter.model.ts` (lines 18-24)

The `establishment_id` field is defined as a string field in the `ZRecruiterWritable` Zod schema:

```typescript
const ZRecruiterWritable = z.object({
  establishment_id: z
    .string()
    .default(() => new ObjectId().toString())
    .describe("Identifiant de formulaire unique")
    .openapi({
      default: "Random UUID",
    }),
  // ... other fields
})
```

### Actual Generation

**File:** `/server/src/services/formulaire.service.ts` (line 394)

The actual generation happens in the `createFormulaire` function:

```typescript
export const createFormulaire = async (payload: Partial<Omit<IRecruiter, "_id" | "establishment_id" | "createdAt" | "updatedAt">>, managedBy: string): Promise<IRecruiter> => {
  const recruiter: IRecruiter = {
    ...payload,
    managed_by: managedBy,
    _id: new ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    establishment_id: randomUUID(), // <-- Uses crypto.randomUUID()
    status: RECRUITER_STATUS.ACTIF,
    // ... other fields
  }
  await getDbCollection("recruiters").insertOne(recruiter)
  return recruiter
}
```

### BUG: Schema/Implementation Mismatch

There is an inconsistency between the schema and the actual implementation:

| Location                                       | Method                      | Result                                 |
| ---------------------------------------------- | --------------------------- | -------------------------------------- |
| Schema default (`recruiter.model.ts` line 20)  | `new ObjectId().toString()` | MongoDB ObjectId string (24 hex chars) |
| Actual code (`formulaire.service.ts` line 394) | `randomUUID()`              | UUID v4 format (36 chars with dashes)  |
| OpenAPI documentation                          | Claims "Random UUID"        | Correct for actual behavior            |

**Example values:**

- ObjectId: `507f1f77bcf86cd799439011`
- UUID: `550e8400-e29b-41d4-a716-446655440000`

This mismatch could cause issues if code relies on the format of `establishment_id`.

---

## 2. Database Index

**File:** `/shared/src/models/recruiter.model.ts` (line 117)

```typescript
export default {
  zod: ZRecruiter,
  indexes: [
    [{ geopoint: "2dsphere", status: 1, "jobs.job_status": 1, "jobs.rome_code": 1, "jobs.job_expiration_date": 1 }, {}],
    [{ establishment_id: 1 }, {}], // <-- establishment_id index
    [{ establishment_siret: 1 }, {}],
    [{ cfa_delegated_siret: 1 }, {}],
    [{ email: 1, establishment_siret: 1 }, { unique: true }],
    // ... more indexes
  ],
  collectionName,
}
```

### Index Analysis

| Property  | Value                       |
| --------- | --------------------------- |
| Index Key | `{ establishment_id: 1 }`   |
| Direction | Ascending                   |
| Unique    | **No** (empty options `{}`) |
| Sparse    | No                          |

### Potential Issue

The `establishment_id` is used as a unique identifier for formulaires throughout the codebase, but the index is **not unique**. This could potentially allow duplicate values. The uniqueness appears to be enforced only by the application logic (generating UUIDs), not at the database level.

Compare with `email + establishment_siret` which has `{ unique: true }`.

---

## 3. API Endpoints Using establishment_id

### GET Endpoints

#### GET `/formulaire/:establishment_id`

**File:** `/server/src/http/controllers/formulaire.controller.ts` (lines 40-52)

```typescript
server.get(
  "/formulaire/:establishment_id",
  {
    schema: zRoutes.get["/formulaire/:establishment_id"],
    onRequest: [server.auth(zRoutes.get["/formulaire/:establishment_id"])],
  },
  async (req, res) => {
    const { establishment_id } = req.params
    const recruiterOpt = await getFormulaireWithRomeDetailAndApplicationCount({ establishment_id })
    if (!recruiterOpt) {
      throw notFound(`pas de formulaire avec establishment_id=${establishment_id}`)
    }
    return res.status(200).send(recruiterOpt)
  }
)
```

**Purpose:** Retrieve a formulaire by its establishment_id (authenticated via cookie session).

---

#### GET `/formulaire/:establishment_id/by-token`

**File:** `/server/src/http/controllers/formulaire.controller.ts` (lines 55-67)

```typescript
server.get(
  "/formulaire/:establishment_id/by-token",
  {
    schema: zRoutes.get["/formulaire/:establishment_id/by-token"],
    onRequest: [server.auth(zRoutes.get["/formulaire/:establishment_id/by-token"])],
  },
  async (req, res) => {
    const { establishment_id } = req.params
    const recruiterOpt = await getFormulaireWithRomeDetailAndApplicationCount({ establishment_id })
    if (!recruiterOpt) {
      throw notFound(`pas de formulaire avec establishment_id=${establishment_id}`)
    }
    return res.status(200).send(recruiterOpt)
  }
)
```

**Purpose:** Retrieve a formulaire using access token authentication (for depot simplifie flow).

---

#### GET `/formulaire/delegation/:establishment_id`

**File:** `/server/src/http/controllers/formulaire.controller.ts` (lines 74-87)

```typescript
server.get(
  "/formulaire/delegation/:establishment_id",
  {
    schema: zRoutes.get["/formulaire/delegation/:establishment_id"],
    onRequest: [server.auth(zRoutes.get["/formulaire/delegation/:establishment_id"])],
  },
  async (req, res) => {
    const result = await getFormulaireWithRomeDetail({ establishment_id: req.params.establishment_id })
    if (!result) {
      throw badRequest()
    }
    return res.status(200).send(result)
  }
)
```

**Purpose:** Retrieve formulaire data for delegation view (CFA viewing company offer details).

---

#### GET `/v1/jobs/establishment`

**File:** `/server/src/http/controllers/jobs.controller.ts` (lines 45-62)

```typescript
server.get(
  "/v1/jobs/establishment",
  {
    schema: zRoutes.get["/v1/jobs/establishment"],
    config,
    onRequest: server.auth(zRoutes.get["/v1/jobs/establishment"]),
  },
  async (req, res) => {
    const { establishment_siret, email } = req.query

    const establishment = await getDbCollection("recruiters").findOne({ establishment_siret, email })

    if (!establishment) {
      return res.status(400).send({ error: true, message: "Establishment not found" })
    }

    return res.status(200).send(establishment.establishment_id)
  }
)
```

**Purpose:** API v1 - Retrieve establishment_id by SIRET and email (returns the establishment_id as response).

---

#### GET `/v2/jobs/establishment`

**File:** `/server/src/http/controllers/v2/jobs.controller.v2.ts` (lines 22-39)

```typescript
server.get(
  "/v2/jobs/establishment",
  {
    schema: zRoutes.get["/v2/jobs/establishment"],
    config,
    onRequest: server.auth(zRoutes.get["/v2/jobs/establishment"]),
  },
  async (req, res) => {
    const { establishment_siret, email } = req.query

    const establishment = await getDbCollection("recruiters").findOne({ establishment_siret, email })

    if (!establishment) {
      return res.status(400).send({ error: true, message: "Establishment not found" })
    }

    return res.status(200).send(establishment.establishment_id)
  }
)
```

**Purpose:** API v2 - Same as v1, retrieve establishment_id by SIRET and email.

---

### POST Endpoints

#### POST `/formulaire/:establishment_id/offre`

**File:** `/server/src/http/controllers/formulaire.controller.ts` (lines 165-224)

```typescript
server.post(
  "/formulaire/:establishment_id/offre",
  {
    schema: zRoutes.post["/formulaire/:establishment_id/offre"],
    onRequest: [server.auth(zRoutes.post["/formulaire/:establishment_id/offre"])],
    bodyLimit: 5 * 1024 ** 2, // 5MB
  },
  async (req, res) => {
    const { establishment_id } = req.params
    const user = getUserFromRequest(req, zRoutes.post["/formulaire/:establishment_id/offre"]).value
    const recruiter = await getDbCollection("recruiters").findOne({ establishment_id })
    if (!recruiter) {
      throw badRequest("/formulaire/:establishment_id/offre - L'entreprise n'existe pas")
    }
    // ... create job logic
    const updatedFormulaire = await createJob({
      job: {
        /* job fields */
      },
      user,
      establishment_id,
      source: getSourceFromCookies(req),
    })
    // ...
  }
)
```

**Purpose:** Create a new job offer for a formulaire (authenticated user).

---

#### POST `/formulaire/:establishment_id/offre/by-token`

**File:** `/server/src/http/controllers/formulaire.controller.ts` (lines 226-293)

```typescript
server.post(
  "/formulaire/:establishment_id/offre/by-token",
  {
    schema: zRoutes.post["/formulaire/:establishment_id/offre/by-token"],
    onRequest: [server.auth(zRoutes.post["/formulaire/:establishment_id/offre/by-token"])],
    bodyLimit: 5 * 1024 ** 2, // 5MB
  },
  async (req, res) => {
    const { establishment_id } = req.params
    const tokenUser = getUserFromRequest(req, zRoutes.post["/formulaire/:establishment_id/offre/by-token"]).value
    // ... validation and job creation using establishment_id
  }
)
```

**Purpose:** Create a new job offer using access token (depot simplifie flow).

---

#### POST `/formulaire/:establishment_id/informations`

**File:** `/server/src/http/controllers/formulaire.controller.ts` (lines 322-340)

```typescript
server.post(
  // this route is for CFA only
  "/formulaire/:establishment_id/informations",
  {
    schema: zRoutes.post["/formulaire/:establishment_id/informations"],
    onRequest: [server.auth(zRoutes.post["/formulaire/:establishment_id/informations"])],
  },
  async (req, res) => {
    const user = getUserFromRequest(req, zRoutes.post["/formulaire/:establishment_id/informations"]).value
    const { establishment_id } = req.params
    const { email, phone } = req.body

    validateDelegatedCompanyPhoneAndEmail(user, phone, email)

    await updateCfaManagedRecruiter(establishment_id, req.body)

    return res.status(200).send({ ok: true })
  }
)
```

**Purpose:** Update company information for CFA-delegated recruiters.

---

#### POST `/v1/jobs/:establishmentId`

**File:** `/server/src/http/controllers/jobs.controller.ts` (lines 126-150)

```typescript
server.post(
  "/v1/jobs/:establishmentId",
  {
    schema: zRoutes.post["/v1/jobs/:establishmentId"],
    onRequest: server.auth(zRoutes.post["/v1/jobs/:establishmentId"]),
    config,
  },
  async (req, res) => {
    const { establishmentId } = req.params
    const { body } = req
    // Check if entity exists
    const establishmentExists = await getFormulaire({ establishment_id: establishmentId })

    if (!establishmentExists) {
      return res.status(400).send({ error: true, message: "Establishment does not exist" })
    }
    // ... create job using establishment_id
    const updatedRecruiter = await createOffre(establishmentId, job)
    return res.status(201).send(updatedRecruiter)
  }
)
```

**Purpose:** API v1 - Create a job offer for an establishment (OPCO API).

---

### DELETE Endpoints

#### DELETE `/formulaire/:establishment_id`

**File:** `/server/src/http/controllers/formulaire.controller.ts` (lines 130-139)

```typescript
server.delete(
  "/formulaire/:establishment_id",
  {
    schema: zRoutes.delete["/formulaire/:establishment_id"],
    onRequest: [server.auth(zRoutes.delete["/formulaire/:establishment_id"])],
  },
  async (req, res) => {
    await archiveFormulaireByEstablishmentId(req.params.establishment_id)
    return res.status(200).send({})
  }
)
```

**Purpose:** Archive (soft delete) a formulaire and all its job offers.

---

## 4. Service Functions Querying by establishment_id

### formulaire.service.ts

**File:** `/server/src/services/formulaire.service.ts`

#### createJob() - Line 168

```typescript
export const createJob = async ({
  job,
  establishment_id,
  user,
  source,
}: {
  job: IJobCreate
  establishment_id: string
  user: IUserWithAccount
  source?: ITrackingCookies
}): Promise<IRecruiter> => {
  // ...
  const recruiter = await getDbCollection("recruiters").findOne({ establishment_id: establishment_id })
  if (!recruiter) {
    throw internal(`recruiter with establishment_id=${establishment_id} not found`)
  }
  // ...
}
```

---

#### updateFormulaire() - Line 416

```typescript
export const updateFormulaire = async (establishment_id: IRecruiter["establishment_id"], payload: UpdateFilter<IRecruiter>): Promise<IRecruiter> => {
  const recruiter = await getDbCollection("recruiters").findOneAndUpdate({ establishment_id }, { $set: { ...payload, updatedAt: new Date() } }, { returnDocument: "after" })
  if (!recruiter) {
    throw internal("Recruiter not found")
  }
  return recruiter
}
```

---

#### archiveFormulaireByEstablishmentId() - Line 429

```typescript
export const archiveFormulaireByEstablishmentId = async (id: IRecruiter["establishment_id"]) => {
  const recruiter = await getDbCollection("recruiters").findOne({ establishment_id: id })
  if (!recruiter) {
    throw internal("Recruiter not found")
  }
  await archiveFormulaire(recruiter)
}
```

---

#### createOffre() - Line 494

```typescript
export async function createOffre(establishment_id: IRecruiter["establishment_id"], payload: UpdateFilter<IJob>): Promise<IRecruiter> {
  const recruiter = await getDbCollection("recruiters").findOneAndUpdate(
    { establishment_id },
    { $push: { jobs: { ...payload, _id: new ObjectId() } } },
    { returnDocument: "after" }
  )
  if (!recruiter) {
    throw internal("Recruiter not found")
  }
  return recruiter
}
```

---

#### updateCfaManagedRecruiter() - Line 884

```typescript
export const updateCfaManagedRecruiter = async (establishment_id: string, payload: Partial<IRecruiter>) => {
  const recruiter = await getDbCollection("recruiters").findOneAndUpdate({ establishment_id }, { $set: { ...payload, updatedAt: new Date() } }, { returnDocument: "after" })
  return recruiter
}
```

---

### userRecruteur.service.ts

**File:** `/server/src/services/userRecruteur.service.ts` (lines 106-108)

```typescript
if (formulaire) {
  const { establishment_id } = formulaire
  Object.assign(entrepriseFields, { establishment_id })
}
```

Used to include `establishment_id` in the `IUserRecruteur` object when building user recruteur data.

---

### user.service.ts

**File:** `/server/src/services/user.service.ts` (line 60)

```typescript
const recruiters = await getDbCollection("recruiters")
  .find({ managed_by: { $in: userIds }, opco }, { projection: { establishment_id: 1, origin: 1, jobs: 1, managed_by: 1, _id: 0 } })
  .toArray()
```

Retrieves recruiters with `establishment_id` in projection for OPCO user data.

---

### roleManagement.service.ts

**File:** `/server/src/services/roleManagement.service.ts` (line 158)

```typescript
const recruiter = await getFormulaireFromUserIdOrError(user._id.toString())
return { ...commonFields, establishment_siret: siret, establishment_id: recruiter.establishment_id }
```

Returns `establishment_id` as part of public user recruteur properties.

---

## 5. URLs and Links in Emails

### appLinks.service.ts

**File:** `/server/src/services/appLinks.service.ts`

#### createViewDelegationLink() - Lines 150-181

```typescript
export function createViewDelegationLink(email: string, establishment_id: string, job_id: string, siret_formateur: string) {
  const token = generateAccessToken(
    { type: "cfa", email, siret: siret_formateur },
    [
      generateScope({
        schema: zRoutes.get["/formulaire/delegation/:establishment_id"],
        options: {
          params: { establishment_id: establishment_id },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.patch["/formulaire/offre/:jobId/delegation/view"],
        options: {
          params: { jobId: job_id },
          querystring: { siret_formateur },
        },
      }),
    ],
    { expiresIn: "30d" }
  )

  return `${config.publicUrl}/espace-pro/proposition/formulaire/${establishment_id}/offre/${job_id}/siret/${siret_formateur}?token=${token}`
}
```

**Purpose:** Creates a link for CFAs to view delegation details. The `establishment_id` is embedded in:

- The URL path
- The access token scope parameters

---

#### generateDepotSimplifieToken() - Lines 365-395

```typescript
export function generateDepotSimplifieToken(user: IUserWithAccountForAccessToken, establishment_id: string) {
  return generateAccessToken(
    user,
    [
      generateScope({
        schema: zRoutes.get["/formulaire/:establishment_id/by-token"],
        options: {
          params: { establishment_id },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.post["/formulaire/:establishment_id/offre/by-token"],
        options: {
          params: { establishment_id },
          querystring: undefined,
        },
      }),
      // ... more scopes
    ],
    { expiresIn: "2h" }
  )
}
```

**Purpose:** Generates a token for the "depot simplifie" (simplified job posting) flow, with `establishment_id` in the scope parameters.

---

#### createMERInvitationLink() - Lines 459-488

```typescript
export function createMERInvitationLink(user: IUserWithAccount, jobId: string, establishmentId: string): string {
  const token = generateAccessToken(
    userWithAccountToUserForToken(user),
    [
      generateScope({
        schema: zRoutes.post["/formulaire/offre/:jobId/delegation/by-token"],
        options: {
          params: { jobId },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.get["/formulaire/:establishment_id/by-token"],
        options: {
          params: { establishment_id: establishmentId },
          querystring: undefined,
        },
      }),
    ],
    { expiresIn: "30d" }
  )

  return `${config.publicUrl}/espace-pro/mise-en-relation/${establishmentId}/${jobId}?token=${encodeURIComponent(token)}`
}
```

**Purpose:** Creates an invitation link for "Mise en Relation" (connecting companies with CFAs).

---

## 6. Authorization System

### authorisationService.ts

**File:** `/server/src/security/authorisationService.ts` (lines 131-136)

The authorization system uses `establishment_id` to identify recruiter resources for access control:

```typescript
async function getRecruitersResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["recruiters"]> {
  if (!schema.securityScheme.resources.recruiter) {
    return []
  }

  const recruiters: IRecruiter[] = (
    await Promise.all(
      schema.securityScheme.resources.recruiter.map(async (recruiterDef): Promise<IRecruiter[]> => {
        if ("_id" in recruiterDef) {
          // ... handle _id case
        }
        if ("establishment_id" in recruiterDef) {
          return getDbCollection("recruiters")
            .find({
              establishment_id: getAccessResourcePathValue(recruiterDef.establishment_id, req),
            })
            .toArray()
        }
        // ... other cases
      })
    )
  ).flatMap((_) => _)
  // ...
}
```

### Route Security Scheme Examples

From `/shared/src/routes/formulaire.route.ts`:

```typescript
"/formulaire/:establishment_id": {
  // ...
  securityScheme: {
    auth: "cookie-session",
    access: { some: ["recruiter:manage", "recruiter:add_job"] },
    resources: {
      recruiter: [{ establishment_id: { type: "params", key: "establishment_id" } }],
    },
  },
}
```

The security scheme uses `establishment_id` from route params to:

1. Identify which recruiter resource is being accessed
2. Check if the authenticated user has permission to access that specific recruiter

---

## 7. Complete File List

The following 21 files in the server codebase reference `establishment_id`:

### Controllers (4 files)

| File                                                                | Description                        |
| ------------------------------------------------------------------- | ---------------------------------- |
| `/server/src/http/controllers/formulaire.controller.ts`             | Main formulaire CRUD operations    |
| `/server/src/http/controllers/jobs.controller.ts`                   | Jobs API v1 endpoints              |
| `/server/src/http/controllers/v2/jobs.controller.v2.ts`             | Jobs API v2 endpoints              |
| `/server/src/http/controllers/etablissementRecruteur.controller.ts` | Establishment recruteur operations |

### Services (6 files)

| File                                              | Description                     |
| ------------------------------------------------- | ------------------------------- |
| `/server/src/services/formulaire.service.ts`      | Core formulaire business logic  |
| `/server/src/services/userRecruteur.service.ts`   | User recruteur management       |
| `/server/src/services/user.service.ts`            | User data management            |
| `/server/src/services/appLinks.service.ts`        | Magic link and token generation |
| `/server/src/services/roleManagement.service.ts`  | Role and permission management  |
| `/server/src/services/formulaire.service.test.ts` | Formulaire service tests        |

### Security (2 files)

| File                                           | Description                              |
| ---------------------------------------------- | ---------------------------------------- |
| `/server/src/security/accessTokenService.ts`   | Access token handling (authorized paths) |
| `/server/src/security/authorisationService.ts` | Authorization and access control         |

### Jobs/Background Tasks (5 files)

| File                                                           | Description                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| `/server/src/jobs/anonymization/anonimizeUsersWithAccounts.ts` | User anonymization (includes establishment_id in projection) |
| `/server/src/jobs/anonymization/anonymizeIndividual.ts`        | Individual record anonymization                              |
| `/server/src/jobs/recruiters/updateSiretInfosInErrorJob.ts`    | SIRET info correction job                                    |
| `/server/src/jobs/partenaireExport/exportJobsToS3.ts`          | S3 export (excludes establishment_id)                        |
| `/server/src/jobs/metabase/metabaseJobsCollection.ts`          | Metabase jobs collection aggregation                         |
| `/server/src/jobs/miseEnRelation/sendMiseEnRelation.ts`        | Mise en relation email job                                   |

### Tests (2 files)

| File                                                                     | Description      |
| ------------------------------------------------------------------------ | ---------------- |
| `/server/tests/utils/user.test.utils.ts`                                 | Test utilities   |
| `/server/src/http/controllers/etablissementRecruteur.controller.test.ts` | Controller tests |

### Snapshots (1 file)

| File                                                                 | Description    |
| -------------------------------------------------------------------- | -------------- |
| `/server/src/services/__snapshots__/formulaire.service.test.ts.snap` | Test snapshots |

---

## Summary

The `establishment_id` field is a critical identifier in the La Bonne Alternance system:

1. **Unique Identifier**: Acts as the primary public identifier for recruiters/formulaires (distinct from MongoDB `_id`)

2. **API Parameter**: Used extensively in REST API routes as a URL parameter

3. **Token Scope**: Embedded in access tokens to control which formulaires a token can access

4. **Email Links**: Included in various magic links sent via email

5. **Authorization**: Key resource identifier for the permission system

### Key Concerns

1. **Format Inconsistency**: Schema default uses ObjectId format, but actual code uses UUID format
2. **Non-Unique Index**: Database index is not unique, relying on application logic for uniqueness
3. **Exposed in URLs**: As a public identifier, it's visible in URLs and tokens
