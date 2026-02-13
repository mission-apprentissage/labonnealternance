# 06 - Stratégie de Tests et Plan de Rollback

## Stratégie de Tests

### 6.1 Tests Unitaires à Modifier

| Fichier                          | Changements               | Priorité |
| -------------------------------- | ------------------------- | -------- |
| `formulaire.service.test.ts`     | Toutes les fonctions CRUD | P1       |
| `application.service.test.ts`    | Lookups job               | P2       |
| `jobOpportunity.service.test.ts` | Queries recherche         | P2       |
| `lbajob.service.test.ts`         | Recherche géospatiale     | P1       |
| `userRecruteur.service.test.ts`  | Gestion utilisateur       | P3       |

### 6.2 Tests d'Intégration à Modifier

| Fichier                                     | Changements              | Priorité |
| ------------------------------------------- | ------------------------ | -------- |
| `formulaire.controller.test.ts`             | Endpoints API formulaire | P1       |
| `jobs.controller.v3.test.ts`                | Endpoints jobs v3        | P1       |
| `etablissementRecruteur.controller.test.ts` | Endpoints établissement  | P2       |
| `applications.controller.v2.test.ts`        | Flux candidature         | P2       |

### 6.3 Tests E2E Cypress

**Scénarios critiques à couvrir:**

```typescript
// cypress/e2e/recruiter-flow.cy.ts

describe("Recruiter Job Management", () => {
  it("should create a new job offer", () => {
    // 1. Login as recruiter
    // 2. Navigate to job creation
    // 3. Fill form and submit
    // 4. Verify job appears in jobs_partners
    // 5. Verify job appears in search results
  })

  it("should extend a job offer", () => {
    // 1. Login as recruiter
    // 2. Find expiring job
    // 3. Click extend
    // 4. Verify new expiration date
    // 5. Verify prolongation_count incremented
  })

  it("should archive a recruiter and cancel all jobs", () => {
    // 1. Login as admin
    // 2. Archive recruiter
    // 3. Verify recruiter_status = ARCHIVE in all jobs
    // 4. Verify offer_status = Cancelled
    // 5. Verify jobs not visible in search
  })

  it("should handle CFA delegation", () => {
    // 1. Login as entreprise
    // 2. Create delegated job
    // 3. Verify is_delegated = true
    // 4. Verify cfa_* fields populated
    // 5. Verify contact info points to CFA
  })
})
```

---

### 6.4 Nouveaux Tests Requis

#### Test de Consistance (Temporaire)

```typescript
// server/src/tests/migration/dataConsistency.test.ts

describe("Recruiters to Jobs Partners Data Consistency", () => {
  it("should have matching job counts", async () => {
    const recruitersJobCount = await getDbCollection("recruiters")
      .aggregate([{ $unwind: "$jobs" }, { $match: { "jobs.job_status": "Active" } }, { $count: "total" }])
      .toArray()

    const jobsPartnersCount = await getDbCollection("jobs_partners").countDocuments({
      partner_label: "RECRUTEURS_LBA",
      offer_status: "Active",
    })

    expect(jobsPartnersCount).toBe(recruitersJobCount[0]?.total ?? 0)
  })

  it("should have all new fields populated for LBA jobs", async () => {
    const missingFields = await getDbCollection("jobs_partners").countDocuments({
      partner_label: "RECRUTEURS_LBA",
      $or: [{ managed_by: { $exists: false } }, { managed_by: null }, { establishment_id: { $exists: false } }, { establishment_id: null }],
    })

    expect(missingFields).toBe(0)
  })

  it("should have consistent managed_by values", async () => {
    // Vérifier que managed_by dans jobs_partners correspond à recruiters
    const sample = await getDbCollection("jobs_partners").find({ partner_label: "RECRUTEURS_LBA" }).limit(100).toArray()

    for (const job of sample) {
      const recruiter = await getDbCollection("recruiters").findOne({ "jobs._id": job._id })

      expect(job.managed_by).toBe(recruiter?.managed_by)
    }
  })
})
```

#### Test d'Autorisation

```typescript
// server/src/security/authorisationService.test.ts

describe("Authorization with jobs_partners", () => {
  it("should allow owner to access their job", async () => {
    const userId = new ObjectId()
    const job = await createTestJob({ managed_by: userId.toString() })

    const canAccess = await canUserAccessJob(userId.toString(), job._id)
    expect(canAccess).toBe(true)
  })

  it("should deny non-owner access to job", async () => {
    const ownerId = new ObjectId()
    const otherId = new ObjectId()
    const job = await createTestJob({ managed_by: ownerId.toString() })

    const canAccess = await canUserAccessJob(otherId.toString(), job._id)
    expect(canAccess).toBe(false)
  })

  it("should allow admin access to any job", async () => {
    const adminId = new ObjectId()
    const job = await createTestJob({ managed_by: new ObjectId().toString() })

    // Setup admin role
    await createAdminRole(adminId)

    const canAccess = await canUserAccessJob(adminId.toString(), job._id)
    expect(canAccess).toBe(true)
  })
})
```

#### Test des Rappels Email

```typescript
// server/src/jobs/recruiters/recruiterOfferExpirationReminderJob.test.ts

describe("Expiration Reminder Job with jobs_partners", () => {
  it("should send J7 reminder for expiring jobs", async () => {
    // Setup: créer job expirant dans 7 jours
    const job = await createTestJob({
      offer_expiration: dayjs().add(7, "days").toDate(),
      relance_mail_expiration_J7: null,
    })

    await runExpirationReminderJob()

    // Verify email sent
    expect(mockMailer.sendEmail).toHaveBeenCalled()

    // Verify field updated
    const updated = await getDbCollection("jobs_partners").findOne({ _id: job._id })
    expect(updated?.relance_mail_expiration_J7).not.toBeNull()
  })

  it("should not send reminder if already sent", async () => {
    const job = await createTestJob({
      offer_expiration: dayjs().add(7, "days").toDate(),
      relance_mail_expiration_J7: new Date(), // Already sent
    })

    await runExpirationReminderJob()

    expect(mockMailer.sendEmail).not.toHaveBeenCalled()
  })

  it("should group reminders by user", async () => {
    const userId = new ObjectId().toString()

    // Créer 3 jobs pour le même utilisateur
    await createTestJob({ managed_by: userId, offer_expiration: dayjs().add(7, "days").toDate() })
    await createTestJob({ managed_by: userId, offer_expiration: dayjs().add(7, "days").toDate() })
    await createTestJob({ managed_by: userId, offer_expiration: dayjs().add(7, "days").toDate() })

    await runExpirationReminderJob()

    // Un seul email pour les 3 jobs
    expect(mockMailer.sendEmail).toHaveBeenCalledTimes(1)
  })
})
```

---

### 6.5 Fixtures de Test

```typescript
// server/tests/fixtures/jobsPartners.fixture.ts

import { ObjectId } from "mongodb"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"

export const createTestJobPartner = async (overrides: Partial<IJobsPartnersOfferPrivate> = {}): Promise<IJobsPartnersOfferPrivate> => {
  const now = new Date()
  const jobId = new ObjectId()

  const job: IJobsPartnersOfferPrivate = {
    _id: jobId,
    partner_label: "RECRUTEURS_LBA",
    partner_job_id: jobId.toString(),

    // Nouveaux champs
    managed_by: new ObjectId().toString(),
    establishment_id: randomUUID(),
    recruiter_status: "ACTIF",
    address_detail: null,
    relance_mail_expiration_J7: null,
    relance_mail_expiration_J1: null,
    job_last_prolongation_date: null,
    job_prolongation_count: 0,

    // Champs existants
    offer_title: "Test Job",
    offer_description: "Test description",
    offer_rome_codes: ["M1805"],
    offer_status: "Active",
    offer_creation: now,
    offer_expiration: dayjs(now).add(2, "months").toDate(),
    offer_target_diploma: null,
    offer_desired_skills: [],
    offer_to_be_acquired_skills: [],
    offer_opening_count: 1,
    offer_multicast: true,
    offer_origin: "lba",

    workplace_siret: "12345678901234",
    workplace_legal_name: "Test Company",
    workplace_brand: null,
    workplace_address_label: "1 rue Test, 75001 Paris",
    workplace_address_zipcode: "75001",
    workplace_address_city: "Paris",
    workplace_geopoint: { type: "Point", coordinates: [2.3522, 48.8566] },
    workplace_size: null,
    workplace_opco: null,
    workplace_idcc: null,
    workplace_naf_code: null,
    workplace_naf_label: null,

    apply_email: "test@example.com",
    apply_phone: "0123456789",

    contract_type: ["Apprentissage"],
    contract_start: dayjs(now).add(1, "month").toDate(),
    contract_duration: 12,
    contract_rythm: null,
    contract_remote: null,
    contract_is_disabled_elligible: false,

    is_delegated: false,
    cfa_siret: null,
    cfa_legal_name: null,
    cfa_apply_email: null,
    cfa_apply_phone: null,
    cfa_address_label: null,
    delegations: [],
    job_delegation_count: 0,
    job_status_comment: null,

    created_at: now,
    updated_at: now,

    ...overrides,
  }

  await getDbCollection("jobs_partners").insertOne(job)
  return job
}

export const cleanupTestJobPartners = async () => {
  await getDbCollection("jobs_partners").deleteMany({
    partner_label: "RECRUTEURS_LBA",
    offer_title: { $regex: /^Test/ },
  })
}
```

---

## Plan de Rollback

### 7.1 Feature Flags

```typescript
// server/src/config.ts

export const featureFlags = {
  // Phase 1: Dual-write (écrire dans les deux collections)
  DUAL_WRITE_ENABLED: process.env.DUAL_WRITE_ENABLED === "true",

  // Phase 2: Read from jobs_partners
  USE_JOBS_PARTNERS_READ: process.env.USE_JOBS_PARTNERS_READ === "true",

  // Phase 3: Write only to jobs_partners
  JOBS_PARTNERS_ONLY: process.env.JOBS_PARTNERS_ONLY === "true",

  // Emergency: Force recruiters read (bypass all)
  FORCE_RECRUITERS_READ: process.env.FORCE_RECRUITERS_READ === "true",
}
```

### 7.2 Utilisation des Feature Flags

```typescript
// server/src/services/formulaire.service.ts

export const getOffre = async (id: string | ObjectId) => {
  // Emergency bypass
  if (featureFlags.FORCE_RECRUITERS_READ) {
    return getOffreFromRecruiters(id)
  }

  // Normal flow
  if (featureFlags.USE_JOBS_PARTNERS_READ) {
    const job = await getDbCollection("jobs_partners").findOne({
      _id: new ObjectId(id.toString()),
    })

    if (job) return transformToRecruiterFormat(job)

    // Fallback si pas trouvé (pendant migration)
    if (!featureFlags.JOBS_PARTNERS_ONLY) {
      return getOffreFromRecruiters(id)
    }

    return null
  }

  return getOffreFromRecruiters(id)
}

const getOffreFromRecruiters = async (id: string | ObjectId) => {
  return getDbCollection("recruiters").findOne({
    "jobs._id": new ObjectId(id.toString()),
  })
}
```

### 7.3 Scénarios de Rollback

#### Scénario 1: Erreurs de lecture

**Symptômes:**

- 500 errors sur endpoints /jobs/\*
- Logs: "Job not found in jobs_partners"

**Actions:**

```bash
# 1. Activer fallback recruiters
kubectl set env deployment/lba-server USE_JOBS_PARTNERS_READ=false

# 2. Vérifier les erreurs
kubectl logs -l app=lba-server --tail=100 | grep "not found"

# 3. Investiguer la sync
yarn cli check:sync-status
```

#### Scénario 2: Données incohérentes

**Symptômes:**

- Offres manquantes dans les résultats de recherche
- Données obsolètes affichées

**Actions:**

```bash
# 1. Forcer lecture depuis recruiters
kubectl set env deployment/lba-server FORCE_RECRUITERS_READ=true

# 2. Relancer le backfill
yarn cli jobs:run backfillJobsPartnersFromRecruiters

# 3. Vérifier la consistance
yarn cli check:data-consistency

# 4. Réactiver progressivement
kubectl set env deployment/lba-server FORCE_RECRUITERS_READ=false
```

#### Scénario 3: Performance dégradée

**Symptômes:**

- Latence élevée sur recherche
- Timeouts fréquents

**Actions:**

```bash
# 1. Vérifier les index
yarn cli db:check-indexes jobs_partners

# 2. Analyser les queries lentes
yarn cli db:slow-queries

# 3. Si index manquant
yarn cli migrations:up

# 4. Si toujours lent, rollback temporaire
kubectl set env deployment/lba-server USE_JOBS_PARTNERS_READ=false
```

#### Scénario 4: Problème de change stream

**Symptômes:**

- Nouvelles offres non synchronisées
- Stream processor en erreur

**Actions:**

```bash
# 1. Vérifier le stream processor
kubectl logs -l app=stream-processor --tail=100

# 2. Vérifier le resume token
yarn cli check:resume-token recruiters

# 3. Redémarrer le stream processor
kubectl rollout restart deployment/stream-processor

# 4. Si token expiré, reset
yarn cli reset:resume-token recruiters
yarn cli jobs:run fullSync
```

---

### 7.4 Checklist de Rollback

```markdown
## Rollback Rapide (< 5 min)

- [ ] Activer FORCE_RECRUITERS_READ=true
- [ ] Vérifier que le site fonctionne
- [ ] Notifier l'équipe

## Rollback Standard (< 30 min)

- [ ] Désactiver USE_JOBS_PARTNERS_READ
- [ ] Vérifier les endpoints critiques
- [ ] Analyser les logs d'erreur
- [ ] Créer ticket d'investigation

## Rollback Complet (< 2h)

- [ ] Désactiver tous les feature flags
- [ ] Réactiver stream processor
- [ ] Lancer sync complète recruiters → jobs_partners
- [ ] Vérifier consistance données
- [ ] Planifier post-mortem
```

---

### 7.5 Monitoring et Alertes

#### Métriques à Surveiller

```typescript
// server/src/common/metrics.ts

export const migrationMetrics = {
  // Nombre de lectures jobs_partners vs recruiters
  jobsPartnersReads: new Counter({
    name: "jobs_partners_reads_total",
    help: "Total reads from jobs_partners collection",
  }),

  recruitersReads: new Counter({
    name: "recruiters_reads_total",
    help: "Total reads from recruiters collection",
  }),

  // Fallbacks (indicateur de problème)
  fallbacksToRecruiters: new Counter({
    name: "fallbacks_to_recruiters_total",
    help: "Times we fell back to recruiters collection",
  }),

  // Latence par source
  readLatency: new Histogram({
    name: "collection_read_latency_seconds",
    help: "Read latency by collection",
    labelNames: ["collection"],
  }),

  // Erreurs
  syncErrors: new Counter({
    name: "sync_errors_total",
    help: "Errors during recruiters to jobs_partners sync",
  }),
}
```

#### Alertes Recommandées

```yaml
# alerting/migration-alerts.yml

groups:
  - name: recruiters-migration
    rules:
      # Trop de fallbacks = problème de données
      - alert: HighFallbackRate
        expr: rate(fallbacks_to_recruiters_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High fallback rate to recruiters collection"

      # Stream processor down
      - alert: StreamProcessorDown
        expr: up{job="stream-processor"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Stream processor is down"

      # Sync errors
      - alert: SyncErrors
        expr: rate(sync_errors_total[5m]) > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Errors during data sync"

      # Data inconsistency
      - alert: DataInconsistency
        expr: abs(recruiters_active_jobs_count - jobs_partners_active_jobs_count) > 100
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Data inconsistency between collections"
```

---

### 7.6 Communications

#### Template: Début de Migration

```markdown
## [Migration] Décommissionnement collection recruiters

**Date:** [DATE]
**Durée estimée:** 16 semaines

### Ce qui change

- Les offres d'emploi LBA seront progressivement lues depuis `jobs_partners`
- Aucun impact utilisateur attendu

### Actions requises

- [ ] Équipe data: Mettre à jour les dashboards Metabase
- [ ] Équipe support: Être vigilant sur les tickets liés aux offres

### Rollback

Feature flags en place pour rollback rapide si nécessaire.

### Contact

@tech-lead pour toute question
```

#### Template: Incident de Migration

```markdown
## [Incident] Problème migration recruiters

**Début:** [TIMESTAMP]
**Impact:** [DESCRIPTION]
**Sévérité:** P1/P2/P3

### Actions en cours

1. [ACTION 1]
2. [ACTION 2]

### Rollback effectué

- [ ] Oui / [ ] Non
- Détails: [...]

### Prochaine mise à jour

Dans [X] minutes

### Historique

- [TIMESTAMP] - Détection du problème
- [TIMESTAMP] - Investigation démarrée
- [TIMESTAMP] - ...
```
