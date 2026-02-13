# 05 - Migration des Fonctionnalités Métier

## Vue d'ensemble des Fonctionnalités

| Fonctionnalité        | Complexité | Dépendances            |
| --------------------- | ---------- | ---------------------- |
| Rappels email (J1/J7) | Moyenne    | Schema migration       |
| Prolongation offres   | Faible     | Schema migration       |
| Statut recruteur      | Moyenne    | Schema + propagation   |
| Gestion utilisateur   | Élevée     | Authorization refactor |
| Délégation CFA        | Moyenne    | Jobs_partners fields   |
| Recherche géospatiale | Moyenne    | Index optimization     |

---

## 5.1 Rappels Email d'Expiration (J1/J7)

### Fonctionnement Actuel

1. Job `recruiterOfferExpirationReminderJob` tourne quotidiennement
2. Query: offres actives avec `relance_mail_expiration_J7: null` et expiration dans 7 jours
3. Envoie email de rappel au recruteur
4. Update `jobs.$.relance_mail_expiration_J7 = now`
5. Même logique pour J-1

### Modèle de Données Actuel

```typescript
// Dans recruiters.jobs[]
{
  job_expiration_date: Date,
  relance_mail_expiration_J7: Date | null,
  relance_mail_expiration_J1: Date | null,
}
```

### Migration vers jobs_partners

**1. Ajouter champs au schéma:**

```typescript
// jobsPartners.model.ts
relance_mail_expiration_J7: z.date().nullish(),
relance_mail_expiration_J1: z.date().nullish(),
```

**2. Mettre à jour la sync:**

```typescript
// formulaire.service.ts - upsertJobPartnersFromRecruiter
relance_mail_expiration_J7: job.relance_mail_expiration_J7 ?? null,
relance_mail_expiration_J1: job.relance_mail_expiration_J1 ?? null,
```

**3. Réécrire le job:**

```typescript
// recruiterOfferExpirationReminderJob.ts
const sendJ7Reminders = async () => {
  const targetDate = dayjs().add(7, "days").startOf("day")

  const jobs = await getDbCollection("jobs_partners")
    .find({
      partner_label: "RECRUTEURS_LBA",
      offer_status: "Active",
      offer_expiration: {
        $gte: targetDate.toDate(),
        $lt: targetDate.add(1, "day").toDate(),
      },
      relance_mail_expiration_J7: null,
    })
    .toArray()

  // Grouper par utilisateur gestionnaire
  const jobsByUser = groupBy(jobs, "managed_by")

  for (const [userId, userJobs] of Object.entries(jobsByUser)) {
    const user = await getDbCollection("userswithaccounts").findOne({
      _id: new ObjectId(userId),
    })

    if (!user) {
      logger.warn(`User ${userId} not found for J7 reminder`)
      continue
    }

    // Envoyer un seul email avec toutes les offres
    await sendExpirationReminderEmail({
      to: user.email,
      jobs: userJobs,
      daysRemaining: 7,
    })

    // Marquer comme envoyé
    await getDbCollection("jobs_partners").updateMany({ _id: { $in: userJobs.map((j) => j._id) } }, { $set: { relance_mail_expiration_J7: new Date() } })
  }
}
```

**4. Index pour performance:**

```javascript
{ relance_mail_expiration_J7: 1, offer_status: 1, offer_expiration: 1 }
```

---

## 5.2 Prolongation des Offres

### Fonctionnement Actuel

```typescript
// formulaire.service.ts - extendOffre
await getDbCollection("recruiters").findOneAndUpdate(
  { "jobs._id": id },
  {
    $set: {
      "jobs.$.job_expiration_date": addExpirationPeriod(dayjs()).toDate(),
      "jobs.$.job_last_prolongation_date": now,
      "jobs.$.job_update_date": now,
      "jobs.$.relance_mail_expiration_J7": null, // Reset
      "jobs.$.relance_mail_expiration_J1": null, // Reset
    },
    $inc: { "jobs.$.job_prolongation_count": 1 },
  }
)
```

### Migration vers jobs_partners

**1. Ajouter champs:**

```typescript
job_last_prolongation_date: z.date().nullish(),
job_prolongation_count: z.number().int().min(0).default(0),
```

**2. Nouvelle implémentation:**

```typescript
export const extendOffre = async (id: IJob["_id"]): Promise<IJobsPartnersOfferPrivate> => {
  const now = new Date()
  const newExpiration = addExpirationPeriod(dayjs()).toDate()

  const job = await getDbCollection("jobs_partners").findOneAndUpdate(
    { _id: id, partner_label: "RECRUTEURS_LBA" },
    {
      $set: {
        offer_expiration: newExpiration,
        job_last_prolongation_date: now,
        updated_at: now,
        relance_mail_expiration_J7: null,
        relance_mail_expiration_J1: null,
      },
      $inc: { job_prolongation_count: 1 },
    },
    { returnDocument: "after" }
  )

  if (!job) {
    throw notFound(`Job with id=${id} not found`)
  }

  return job
}
```

---

## 5.3 Gestion du Statut Recruteur

### Modèle Actuel

```typescript
// recruiters
{
  status: "Actif" | "Archive" | "En attente validation" | ...,
  jobs: [
    { job_status: "Active" | "Pourvue" | "Annulée" | "En attente" }
  ]
}
```

**Logique:**

- Quand `recruiter.status` change, cela affecte la visibilité de toutes ses offres
- `archiveFormulaire()` met `status = ARCHIVE` et annule tous les jobs

### Migration vers jobs_partners

**1. Nouveau champ:**

```typescript
recruiter_status: z.nativeEnum(RECRUITER_STATUS),
```

**2. Fonction de propagation:**

```typescript
export const updateRecruiterStatus = async (establishmentId: string, newStatus: RECRUITER_STATUS) => {
  // Update toutes les offres de cet établissement
  const result = await getDbCollection("jobs_partners").updateMany(
    {
      partner_label: "RECRUTEURS_LBA",
      establishment_id: establishmentId,
    },
    {
      $set: {
        recruiter_status: newStatus,
        updated_at: new Date(),
      },
    }
  )

  // Si archivage, annuler aussi les offres actives
  if (newStatus === RECRUITER_STATUS.ARCHIVE) {
    await getDbCollection("jobs_partners").updateMany(
      {
        partner_label: "RECRUTEURS_LBA",
        establishment_id: establishmentId,
        offer_status: "Active",
      },
      {
        $set: {
          offer_status: "Cancelled",
          offer_expiration: new Date(),
        },
      }
    )
  }

  return result.modifiedCount
}
```

**3. Adapter `getOfferStatus()`:**

```typescript
function getOfferStatus(jobStatus: JOB_STATUS, recruiterStatus: RECRUITER_STATUS): JOB_STATUS_ENGLISH {
  // Si recruteur non actif, l'offre est annulée
  if (recruiterStatus !== RECRUITER_STATUS.ACTIF) {
    return JOB_STATUS_ENGLISH.ANNULEE
  }
  // ... logique existante
}
```

---

## 5.4 Gestion Utilisateur (managed_by)

### Modèle Actuel

```typescript
// recruiters
{
  managed_by: "userId", // ObjectId as string
  // L'utilisateur peut avoir plusieurs recruiters
}

// Queries courantes
getDbCollection("recruiters").find({ managed_by: userId })
getDbCollection("recruiters").findOne({ "jobs._id": jobId })
  .then(r => r.managed_by) // Pour vérifier ownership
```

### Migration vers jobs_partners

**1. Nouveau champ:**

```typescript
managed_by: z.string().describe("User ID managing this offer"),
```

**2. Index:**

```javascript
{ managed_by: 1, offer_status: 1, offer_expiration: -1 }
```

**3. Queries typiques:**

```typescript
// Obtenir toutes les offres d'un utilisateur
const getUserOffers = async (userId: string) => {
  return getDbCollection("jobs_partners")
    .find({
      partner_label: "RECRUTEURS_LBA",
      managed_by: userId,
    })
    .toArray()
}

// Grouper par établissement pour l'affichage dashboard
const getUserEstablishments = async (userId: string) => {
  return getDbCollection("jobs_partners")
    .aggregate([
      {
        $match: {
          partner_label: "RECRUTEURS_LBA",
          managed_by: userId,
        },
      },
      {
        $group: {
          _id: "$establishment_id",
          workplace_siret: { $first: "$workplace_siret" },
          workplace_legal_name: { $first: "$workplace_legal_name" },
          recruiter_status: { $first: "$recruiter_status" },
          jobs: { $push: "$$ROOT" },
          activeJobsCount: {
            $sum: { $cond: [{ $eq: ["$offer_status", "Active"] }, 1, 0] },
          },
        },
      },
    ])
    .toArray()
}

// Vérifier ownership pour autorisation
const canUserAccessJob = async (userId: string, jobId: ObjectId) => {
  const job = await getDbCollection("jobs_partners").findOne({
    _id: jobId,
    partner_label: "RECRUTEURS_LBA",
  })

  return job?.managed_by === userId
}
```

**4. Adapter authorisationService.ts:**

```typescript
// Actuel
const recruiter = await getDbCollection("recruiters").findOne({ "jobs._id": jobId })
const canAccess = recruiter?.managed_by === userId

// Nouveau
const job = await getDbCollection("jobs_partners").findOne({ _id: jobId })
const canAccess = job?.managed_by === userId
```

---

## 5.5 Délégation CFA

### Modèle Actuel

```typescript
// recruiters (entreprise déléguant au CFA)
{
  is_delegated: true,
  cfa_delegated_siret: "12345678901234",
  // Contact = CFA, pas l'entreprise
}

// recruiters.jobs[].delegations[]
{
  siret_code: "98765432109876",
  email: "cfa@example.com"
}
```

### Migration vers jobs_partners

**Champs existants (déjà synchronisés):**

```typescript
is_delegated: boolean,
cfa_siret: string | null,
cfa_legal_name: string | null,
cfa_apply_phone: string | null,
cfa_apply_email: string | null,
cfa_address_label: string | null,
delegations: IDelegation[],
job_delegation_count: number,
```

**Vérifications nécessaires:**

1. **Contact info:** Quand `is_delegated = true`, les champs `apply_email` et `apply_phone` pointent vers le CFA
2. **Délégations:** Le tableau `delegations` contient les CFAs à qui l'offre a été partagée

**Fonctions à adapter:**

```typescript
// Obtenir le contact pour une offre
const getOfferContactInfo = (job: IJobsPartnersOfferPrivate) => {
  if (job.is_delegated) {
    return {
      email: job.cfa_apply_email,
      phone: job.cfa_apply_phone,
      name: job.cfa_legal_name,
    }
  }
  return {
    email: job.apply_email,
    phone: job.apply_phone,
    name: job.workplace_legal_name,
  }
}

// Créer une délégation
const createDelegation = async (jobId: ObjectId, delegation: IDelegation) => {
  await getDbCollection("jobs_partners").updateOne(
    { _id: jobId },
    {
      $push: { delegations: delegation },
      $inc: { job_delegation_count: 1 },
      $set: { updated_at: new Date() },
    }
  )
}
```

---

## 5.6 Recherche Géospatiale

### Modèle Actuel

```typescript
// recruiters - Index 2dsphere sur geopoint
// Aggregation avec $geoNear sur recruiters puis $unwind sur jobs
```

### Migration vers jobs_partners

**Index existant:**

```javascript
{
  workplace_geopoint: "2dsphere"
}
```

**Nouvelle query:**

```typescript
const searchJobsByLocation = async (params: {
  latitude: number
  longitude: number
  radius: number // en mètres
  romes?: string[]
  status?: string
}) => {
  const pipeline: any[] = [
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [params.longitude, params.latitude],
        },
        distanceField: "distance",
        maxDistance: params.radius,
        spherical: true,
        query: {
          partner_label: "RECRUTEURS_LBA",
          offer_status: params.status || "Active",
          ...(params.romes && { offer_rome_codes: { $in: params.romes } }),
        },
      },
    },
    {
      $project: {
        _id: 1,
        offer_title: 1,
        workplace_legal_name: 1,
        workplace_address_label: 1,
        workplace_geopoint: 1,
        distance: 1,
        offer_rome_codes: 1,
        contract_type: 1,
        contract_start: 1,
        offer_description: 1,
      },
    },
    { $limit: 100 },
  ]

  return getDbCollection("jobs_partners").aggregate(pipeline).toArray()
}
```

**Avantages:**

- Plus de `$unwind` sur jobs (chaque offre = 1 document)
- Query plus simple et performante
- Même index 2dsphere

---

## Matrice de Compatibilité API

| Endpoint            | Champs retournés (actuel) | Source après migration           |
| ------------------- | ------------------------- | -------------------------------- |
| GET /jobs/:id       | recruiter + job fusionnés | jobs_partners direct             |
| GET /jobs/search    | Liste de jobs             | jobs_partners aggregation        |
| POST /jobs          | Crée recruiter + job      | Crée jobs_partners               |
| PUT /jobs/:id       | Update job dans recruiter | Update jobs_partners             |
| DELETE /jobs/:id    | Archive job               | Update offer_status              |
| GET /formulaire/:id | Recruiter avec jobs       | Aggregation par establishment_id |

**Transformation de réponse:**

Pour maintenir la compatibilité, créer un mapper:

```typescript
const mapJobsPartnersToLegacyJob = (job: IJobsPartnersOfferPrivate): IJobLegacy => ({
  _id: job._id,
  rome_code: job.offer_rome_codes,
  rome_label: job.offer_title, // Approximation
  job_status: mapStatusToLegacy(job.offer_status),
  job_type: job.contract_type,
  job_start_date: job.contract_start,
  job_duration: job.contract_duration,
  job_description: job.offer_description,
  job_creation_date: job.offer_creation,
  job_expiration_date: job.offer_expiration,
  // ... autres champs
})

const mapJobsPartnersToLegacyRecruiter = (jobs: IJobsPartnersOfferPrivate[]): IRecruiterLegacy => {
  const first = jobs[0]
  return {
    establishment_id: first.establishment_id,
    establishment_siret: first.workplace_siret,
    establishment_raison_sociale: first.workplace_legal_name,
    email: first.apply_email,
    phone: first.apply_phone,
    address: first.workplace_address_label,
    geopoint: first.workplace_geopoint,
    status: mapRecruiterStatus(first.recruiter_status),
    managed_by: first.managed_by,
    jobs: jobs.map(mapJobsPartnersToLegacyJob),
  }
}
```
