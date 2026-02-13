# 04 - Migration des Background Jobs

## Vue d'ensemble

| Catégorie       | Nombre | Action                     |
| --------------- | ------ | -------------------------- |
| À réécrire      | 7      | Adapter pour jobs_partners |
| À déprécier     | 3      | Supprimer après migration  |
| À mettre à jour | 4      | Modifications mineures     |

---

## Jobs à Réécrire

### 4.1 `server/src/jobs/recruiters/recruiterOfferExpirationReminderJob.ts`

**Fonction:** Envoie des emails de rappel J-7 et J-1 avant expiration des offres.

**Logique actuelle:**

```typescript
// Ligne 27
const recruiters = await getDbCollection("recruiters")
  .find({
    "jobs.job_status": JOB_STATUS.ACTIVE,
    "jobs.job_expiration_date": { $gt: now },
    $or: [{ "jobs.relance_mail_expiration_J7": null }, { "jobs.relance_mail_expiration_J1": null }],
  })
  .toArray()

// Pour chaque job, envoie email puis update
await getDbCollection("recruiters").findOneAndUpdate({ "jobs._id": job._id }, { $set: { "jobs.$.relance_mail_expiration_J7": now } })
```

**Nouvelle logique:**

```typescript
// Query jobs_partners directement
const jobsJ7 = await getDbCollection("jobs_partners")
  .find({
    partner_label: "RECRUTEURS_LBA",
    offer_status: "Active",
    offer_expiration: {
      $gte: dayjs().add(6, "days").toDate(),
      $lte: dayjs().add(7, "days").toDate(),
    },
    relance_mail_expiration_J7: null,
  })
  .toArray()

// Grouper par managed_by pour envoyer un seul email par utilisateur
const jobsByUser = groupBy(jobsJ7, "managed_by")

for (const [userId, jobs] of Object.entries(jobsByUser)) {
  const user = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(userId) })
  if (!user) continue

  await sendExpirationReminderEmail(user, jobs, "J7")

  // Update en batch
  await getDbCollection("jobs_partners").updateMany({ _id: { $in: jobs.map((j) => j._id) } }, { $set: { relance_mail_expiration_J7: new Date() } })
}

// Même logique pour J1
```

**Champs requis dans jobs_partners:**

- `relance_mail_expiration_J7` (nouveau)
- `relance_mail_expiration_J1` (nouveau)
- `managed_by` (nouveau)

---

### 4.2 `server/src/jobs/recruiters/cancelOfferJob.ts`

**Fonction:** Annule automatiquement les offres expirées.

**Logique actuelle:**

```typescript
// Ligne 12
const formulaires = await getFormulaires({ "jobs.job_status": JOB_STATUS.ACTIVE }, {}, { limit: 1000 })

for (const formulaire of formulaires) {
  for (const job of formulaire.jobs) {
    if (job.job_expiration_date < now) {
      await cancelOffre(job._id)
    }
  }
}
```

**Nouvelle logique:**

```typescript
// Update en batch directement
const result = await getDbCollection("jobs_partners").updateMany(
  {
    partner_label: "RECRUTEURS_LBA",
    offer_status: "Active",
    offer_expiration: { $lt: new Date() },
  },
  {
    $set: {
      offer_status: "Cancelled",
      updated_at: new Date(),
    },
  }
)

logger.info(`Cancelled ${result.modifiedCount} expired offers`)
```

---

### 4.3 `server/src/jobs/recruiters/fixJobExpirationDateJob.ts`

**Fonction:** Corrige les dates d'expiration invalides (trop lointaines).

**Logique actuelle:**

```typescript
// Ligne 12
const recruiters = await getDbCollection("recruiters")
  .find({
    "jobs.job_expiration_date": { $gt: latestExpirationDate },
  })
  .toArray()
```

**Nouvelle logique:**

```typescript
const result = await getDbCollection("jobs_partners").updateMany(
  {
    partner_label: "RECRUTEURS_LBA",
    offer_expiration: { $gt: latestExpirationDate },
  },
  {
    $set: { offer_expiration: latestExpirationDate },
  }
)
```

---

### 4.4 `server/src/jobs/recruiters/updateMissingStartDateJob.ts`

**Fonction:** Corrige les offres sans date de début.

**Logique actuelle:**

```typescript
// Ligne 7
const recruiters = await getDbCollection("recruiters")
  .find({
    "jobs.job_start_date": null,
  })
  .toArray()
```

**Nouvelle logique:**

```typescript
const jobsWithoutStartDate = await getDbCollection("jobs_partners")
  .find({
    partner_label: "RECRUTEURS_LBA",
    contract_start: null,
    offer_status: "Active",
  })
  .toArray()

// Logique de correction...
await getDbCollection("jobs_partners").updateOne({ _id: job._id }, { $set: { contract_start: estimatedStartDate } })
```

---

### 4.5 `server/src/jobs/recruiters/fixRecruiterDataValidationJob.ts`

**Fonction:** Corrige les données invalides dans les recruteurs.

**Changements:**

- Query jobs_partners au lieu de recruiters
- Adapter les validations aux champs jobs_partners
- Update directement dans jobs_partners

---

### 4.6 `server/src/jobs/recruiters/updateSiretInfosInErrorJob.ts`

**Fonction:** Met à jour les infos SIRET pour les recruteurs en erreur.

**Logique actuelle:**

```typescript
// Ligne 76
const recruiters = await getDbCollection("recruiters")
  .find({
    status: RECRUITER_STATUS.EN_ATTENTE_VALIDATION,
  })
  .toArray()
```

**Nouvelle logique:**

```typescript
// Grouper par establishment_id pour éviter les doublons
const jobsInError = await getDbCollection("jobs_partners")
  .aggregate([
    {
      $match: {
        partner_label: "RECRUTEURS_LBA",
        recruiter_status: "EN_ATTENTE_VALIDATION",
      },
    },
    {
      $group: {
        _id: "$establishment_id",
        workplace_siret: { $first: "$workplace_siret" },
        jobs: { $push: "$_id" },
      },
    },
  ])
  .toArray()

// Pour chaque établissement, vérifier et mettre à jour
for (const establishment of jobsInError) {
  const siretInfo = await fetchSiretInfo(establishment.workplace_siret)

  if (siretInfo.valid) {
    await getDbCollection("jobs_partners").updateMany(
      { establishment_id: establishment._id },
      {
        $set: {
          workplace_legal_name: siretInfo.raison_sociale,
          workplace_address_label: siretInfo.address,
          recruiter_status: "ACTIF",
        },
      }
    )
  }
}
```

---

### 4.7 `server/src/jobs/miseEnRelation/sendMiseEnRelation.ts`

**Fonction:** Envoie les mises en relation entreprise-candidat.

**Changement:**

```typescript
// Ligne 157 - Actuel
await getDbCollection("recruiters").updateOne(...)

// Nouveau
await getDbCollection("jobs_partners").updateOne(
  { _id: jobId },
  { $set: { mer_sent: new Date() } }
)
```

---

## Jobs à Déprécier

### 4.8 `server/src/jobs/recruiters/removeDuplicatesRecruiters.ts`

**Fonction:** Détecte et fusionne les recruteurs en doublon.

**Raison de dépréciation:**

- La logique de duplication change avec jobs_partners
- Les doublons sont gérés différemment (par partner_label + partner_job_id)
- Le job `detectDuplicateJobPartners.ts` existe déjà

**Action:** Supprimer après migration complète.

---

### 4.9 `server/src/jobs/offrePartenaire/lbaJobToJobsPartners.ts`

**Fonction:** Synchronisation batch des offres LBA vers jobs_partners.

**Raison de dépréciation:**

- Remplacé par écriture directe dans jobs_partners
- Le change stream devient obsolète quand on écrit directement

**Action:** Garder temporairement comme fallback, supprimer après cutover.

---

### 4.10 Stream Processor (Change Stream)

**Fichiers:**

- `server/src/services/formulaire.service.ts` (lignes 1069-1143)
- `server/src/http/StreamProcessorServer.ts`
- `.infra/docker-compose.production.yml` (service stream_processor)

**Raison de dépréciation:**

- Plus nécessaire quand les écritures vont directement dans jobs_partners

**Action:**

1. Phase 1: Garder actif pendant dual-write
2. Phase 2: Désactiver après validation
3. Phase 3: Supprimer le code et le service Docker

---

## Jobs à Mettre à Jour

### 4.11 `server/src/jobs/database/obfuscateCollections.ts`

**Changements:**

```typescript
// Supprimer (lignes 190-211)
const recruitersToObfuscate = await getDbCollection("recruiters")
  .find({
    first_name: { $ne: "prenom" },
  })
  .toArray()

// Garder uniquement l'obfuscation jobs_partners
const jobsToObfuscate = await getDbCollection("jobs_partners")
  .find({
    partner_label: "RECRUTEURS_LBA",
    // Critères d'obfuscation
  })
  .toArray()
```

---

### 4.12 `server/src/jobs/anonymization/anonymizeIndividual.ts`

**Changements:**

- Anonymiser dans jobs_partners au lieu de recruiters
- Adapter les champs (first_name → contact dans managed_by lookup)

---

### 4.13 `server/src/jobs/anonymization/anonimizeUsersWithAccounts.ts`

**Changements:**

- Quand un user est anonymisé, anonymiser ses offres dans jobs_partners

```typescript
// Nouveau
await getDbCollection("jobs_partners").updateMany(
  { managed_by: userId },
  {
    $set: {
      apply_email: "anonymized@example.com",
      apply_phone: null,
    },
  }
)
```

---

### 4.14 `server/src/jobs/oneTimeJob/analyzeClosedCompanies.ts`

**Changements:**

```typescript
// Ligne 8 - Actuel
const recruiters = await getDbCollection("recruiters").find({...}).toArray()

// Nouveau
const activeJobs = await getDbCollection("jobs_partners").find({
  partner_label: "RECRUTEURS_LBA",
  offer_status: "Active"
}).toArray()
```

---

## Nouveau Job à Créer

### 4.15 `server/src/jobs/migrations/syncRecruiterStatusToJobsPartners.ts`

**Fonction:** Propagation du statut recruteur vers toutes ses offres.

```typescript
/**
 * Quand le statut d'un recruteur change (ACTIF → ARCHIVE),
 * il faut mettre à jour toutes ses offres dans jobs_partners
 */
export const syncRecruiterStatusToJobsPartners = async () => {
  // Trouver les incohérences
  const mismatches = await getDbCollection("recruiters")
    .aggregate([
      { $unwind: "$jobs" },
      {
        $lookup: {
          from: "jobs_partners",
          localField: "jobs._id",
          foreignField: "_id",
          as: "partner_job",
        },
      },
      { $unwind: "$partner_job" },
      {
        $match: {
          $expr: {
            $ne: ["$status", "$partner_job.recruiter_status"],
          },
        },
      },
    ])
    .toArray()

  for (const mismatch of mismatches) {
    await getDbCollection("jobs_partners").updateOne({ _id: mismatch.jobs._id }, { $set: { recruiter_status: mismatch.status } })
  }

  logger.info(`Synced ${mismatches.length} recruiter statuses`)
}
```

---

## Planning de Migration des Jobs

| Semaine | Jobs                                | Action                      |
| ------- | ----------------------------------- | --------------------------- |
| 8       | recruiterOfferExpirationReminderJob | Réécrire pour jobs_partners |
| 8       | cancelOfferJob                      | Réécrire pour jobs_partners |
| 9       | fixJobExpirationDateJob             | Réécrire pour jobs_partners |
| 9       | updateMissingStartDateJob           | Réécrire pour jobs_partners |
| 9       | fixRecruiterDataValidationJob       | Réécrire pour jobs_partners |
| 9       | updateSiretInfosInErrorJob          | Réécrire pour jobs_partners |
| 10      | sendMiseEnRelation                  | Adapter update              |
| 10      | obfuscateCollections                | Supprimer partie recruiters |
| 10      | anonymizeIndividual                 | Adapter pour jobs_partners  |
| 14      | removeDuplicatesRecruiters          | Déprécier                   |
| 14      | lbaJobToJobsPartners                | Déprécier                   |
| 16      | Stream Processor                    | Supprimer service           |

---

## Checklist Jobs

```markdown
## À Réécrire

- [ ] recruiterOfferExpirationReminderJob.ts
- [ ] cancelOfferJob.ts
- [ ] fixJobExpirationDateJob.ts
- [ ] updateMissingStartDateJob.ts
- [ ] fixRecruiterDataValidationJob.ts
- [ ] updateSiretInfosInErrorJob.ts
- [ ] sendMiseEnRelation.ts

## À Déprécier

- [ ] removeDuplicatesRecruiters.ts
- [ ] lbaJobToJobsPartners.ts
- [ ] Stream Processor (formulaire.service.ts + Docker)

## À Mettre à Jour

- [ ] obfuscateCollections.ts
- [ ] anonymizeIndividual.ts
- [ ] anonimizeUsersWithAccounts.ts
- [ ] analyzeClosedCompanies.ts

## Nouveau

- [ ] syncRecruiterStatusToJobsPartners.ts (créer)
```
