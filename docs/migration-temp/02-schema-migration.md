# 02 - Migration du Schéma

## Comparaison des Schémas

### Champs Actuels: recruiters vs jobs_partners

#### Niveau Recruteur (recruiters)

| Champ recruiters                                | Existe dans jobs_partners | Mapping                                            |
| ----------------------------------------------- | ------------------------- | -------------------------------------------------- |
| `_id`                                           | -                         | N/A (identifiant établissement)                    |
| `establishment_id`                              | ❌                        | **À ajouter**                                      |
| `establishment_siret`                           | ✅                        | `workplace_siret`                                  |
| `establishment_raison_sociale`                  | ✅                        | `workplace_legal_name`                             |
| `establishment_enseigne`                        | ✅                        | `workplace_brand`                                  |
| `establishment_size`                            | ✅                        | `workplace_size`                                   |
| `establishment_creation_date`                   | ❌                        | Non requis                                         |
| `address`                                       | ✅                        | `workplace_address_label`                          |
| `address_detail`                                | ✅                        | Déjà éclaté dans `workplace_address_*` (voir note) |
| `address_detail.code_postal`                    | ✅                        | `workplace_address_zipcode`                        |
| `address_detail.localite`                       | ✅                        | `workplace_address_city` (via `getCity()`)         |
| `address_detail.numero_voie/type_voie/nom_voie` | ⚠️                        | `workplace_address_street_label` (toujours `null`) |
| `geo_coordinates`                               | ✅                        | `workplace_geopoint`                               |
| `geopoint`                                      | ✅                        | `workplace_geopoint`                               |
| `is_delegated`                                  | ✅                        | `is_delegated`                                     |
| `cfa_delegated_siret`                           | ✅                        | `cfa_siret`                                        |
| `email`                                         | ✅                        | `apply_email`                                      |
| `phone`                                         | ✅                        | `apply_phone`                                      |
| `first_name`                                    | ❌                        | Via managed_by → user                              |
| `last_name`                                     | ❌                        | Via managed_by → user                              |
| `opco`                                          | ✅                        | `workplace_opco`                                   |
| `idcc`                                          | ✅                        | `workplace_idcc`                                   |
| `naf_code`                                      | ✅                        | `workplace_naf_code`                               |
| `naf_label`                                     | ✅                        | `workplace_naf_label`                              |
| `origin`                                        | ✅                        | `offer_origin`                                     |
| `status`                                        | ❌                        | **À ajouter** (`recruiter_status`)                 |
| `managed_by`                                    | ❌                        | **À ajouter**                                      |
| `createdAt`                                     | ✅                        | `created_at`                                       |
| `updatedAt`                                     | ✅                        | `updated_at`                                       |

#### Niveau Job (recruiters.jobs[])

| Champ jobs[]                 | Existe dans jobs_partners | Mapping                          |
| ---------------------------- | ------------------------- | -------------------------------- |
| `_id`                        | ✅                        | `_id` / `partner_job_id`         |
| `rome_code`                  | ✅                        | `offer_rome_codes`               |
| `rome_label`                 | ✅                        | Inclus dans `offer_title`        |
| `rome_appellation_label`     | ✅                        | Inclus dans `offer_title`        |
| `job_level_label`            | ✅                        | `offer_target_diploma`           |
| `job_start_date`             | ✅                        | `contract_start`                 |
| `job_description`            | ✅                        | `offer_description`              |
| `job_employer_description`   | ❌                        | `workplace_description` (null)   |
| `job_creation_date`          | ✅                        | `offer_creation`                 |
| `job_expiration_date`        | ✅                        | `offer_expiration`               |
| `job_update_date`            | ✅                        | `updated_at`                     |
| `job_status`                 | ✅                        | `offer_status`                   |
| `job_status_comment`         | ✅                        | `job_status_comment`             |
| `job_type`                   | ✅                        | `contract_type`                  |
| `job_duration`               | ✅                        | `contract_duration`              |
| `job_rythm`                  | ✅                        | `contract_rythm`                 |
| `job_count`                  | ✅                        | `offer_opening_count`            |
| `is_multi_published`         | ✅                        | `offer_multicast`                |
| `is_disabled_elligible`      | ✅                        | `contract_is_disabled_elligible` |
| `delegations`                | ✅                        | `delegations`                    |
| `job_delegation_count`       | ✅                        | `job_delegation_count`           |
| `competences_rome`           | ✅                        | `offer_desired_skills`, etc.     |
| `relance_mail_expiration_J7` | ❌                        | **À ajouter**                    |
| `relance_mail_expiration_J1` | ❌                        | **À ajouter**                    |
| `job_last_prolongation_date` | ❌                        | **À ajouter**                    |
| `job_prolongation_count`     | ❌                        | **À ajouter**                    |
| `offer_title_custom`         | ✅                        | `offer_title`                    |

---

## Nouveaux Champs à Ajouter

### Fichier: `shared/src/models/jobsPartners.model.ts`

```typescript
// === CHAMPS À AJOUTER AU SCHÉMA ZJobsPartnersOfferPrivate ===

// Gestion établissement/utilisateur
managed_by: z.string().describe("ID de l'utilisateur gérant cette offre"),
establishment_id: z.string().describe("Identifiant unique de l'établissement"),
recruiter_status: z.nativeEnum(RECRUITER_STATUS).describe("Statut du recruteur: ACTIF, ARCHIVE, EN_ATTENTE_VALIDATION, etc."),

// Tracking des rappels email
relance_mail_expiration_J7: z.date().nullish().describe("Date d'envoi du rappel J-7"),
relance_mail_expiration_J1: z.date().nullish().describe("Date d'envoi du rappel J-1"),

// Tracking des prolongations
job_last_prolongation_date: z.date().nullish().describe("Date de dernière prolongation"),
job_prolongation_count: z.number().int().min(0).default(0).describe("Nombre de prolongations"),

// Mise en relation
mer_sent: z.date().nullish().describe("Date d'envoi de la mise en relation"),
```

### Import du type RECRUITER_STATUS

```typescript
import { RECRUITER_STATUS } from "shared/constants/recruteur"
```

---

## Note sur `address_detail`

⚠️ **`address_detail` n'a PAS besoin d'être ajouté** car ses sous-champs sont déjà mappés dans `jobs_partners` :

| Champ `address_detail`                   | Champ `jobs_partners`            | Sync actuelle                    |
| ---------------------------------------- | -------------------------------- | -------------------------------- |
| (objet complet)                          | -                                | Non synchronisé en tant qu'objet |
| `code_postal`                            | `workplace_address_zipcode`      | ✅ Synchronisé                   |
| `localite`                               | `workplace_address_city`         | ✅ Synchronisé via `getCity()`   |
| `numero_voie` + `type_voie` + `nom_voie` | `workplace_address_street_label` | ⚠️ Toujours `null`               |

### Amélioration optionnelle

Si besoin de `workplace_address_street_label`, ajouter dans `upsertJobPartnersFromRecruiter()` :

```typescript
workplace_address_street_label: recruiter.address_detail
  ? [
      recruiter.address_detail.numero_voie,
      recruiter.address_detail.type_voie,
      recruiter.address_detail.nom_voie
    ].filter(Boolean).join(' ')
  : null,
```

---

## Nouveaux Index

### Fichier: `shared/src/models/jobsPartners.model.ts`

Ajouter dans la section `indexes`:

```typescript
// Index pour requêtes par utilisateur gestionnaire
[[{ managed_by: 1 }, {}]],

// Index pour requêtes par établissement
[[{ establishment_id: 1 }, {}]],

// Index pour job de rappel J-7
[[{ relance_mail_expiration_J7: 1, offer_status: 1 }, {}]],

// Index pour job de rappel J-1
[[{ relance_mail_expiration_J1: 1, offer_status: 1 }, {}]],

// Index pour requêtes par statut recruteur
[[{ recruiter_status: 1 }, {}]],

// Index composé pour dashboard recruteur
[[{ managed_by: 1, offer_status: 1, offer_expiration: -1 }, {}]],
```

---

## Script de Migration

### Fichier: `server/src/migrations/20250XXX-add-recruiter-fields-to-jobs-partners.ts`

```typescript
import { Db } from "mongodb"

export const up = async (db: Db) => {
  // 1. Ajouter les nouveaux champs avec valeurs par défaut
  // Note: address_detail n'est pas ajouté car déjà éclaté dans workplace_address_*
  await db.collection("jobs_partners").updateMany(
    { partner_label: "RECRUTEURS_LBA" },
    {
      $set: {
        managed_by: null,
        establishment_id: null,
        recruiter_status: "Actif",
        relance_mail_expiration_J7: null,
        relance_mail_expiration_J1: null,
        job_last_prolongation_date: null,
        job_prolongation_count: 0,
        mer_sent: null,
      },
    }
  )

  // 2. Créer les nouveaux index
  await db.collection("jobs_partners").createIndex({ managed_by: 1 })
  await db.collection("jobs_partners").createIndex({ establishment_id: 1 })
  await db.collection("jobs_partners").createIndex({
    relance_mail_expiration_J7: 1,
    offer_status: 1,
  })
  await db.collection("jobs_partners").createIndex({
    relance_mail_expiration_J1: 1,
    offer_status: 1,
  })
  await db.collection("jobs_partners").createIndex({ recruiter_status: 1 })
  await db.collection("jobs_partners").createIndex({
    managed_by: 1,
    offer_status: 1,
    offer_expiration: -1,
  })
}

export const down = async (db: Db) => {
  // Supprimer les index
  await db.collection("jobs_partners").dropIndex("managed_by_1")
  await db.collection("jobs_partners").dropIndex("establishment_id_1")
  await db.collection("jobs_partners").dropIndex("relance_mail_expiration_J7_1_offer_status_1")
  await db.collection("jobs_partners").dropIndex("relance_mail_expiration_J1_1_offer_status_1")
  await db.collection("jobs_partners").dropIndex("recruiter_status_1")
  await db.collection("jobs_partners").dropIndex("managed_by_1_offer_status_1_offer_expiration_-1")

  // Supprimer les champs
  await db.collection("jobs_partners").updateMany(
    { partner_label: "RECRUTEURS_LBA" },
    {
      $unset: {
        managed_by: "",
        establishment_id: "",
        recruiter_status: "",
        relance_mail_expiration_J7: "",
        relance_mail_expiration_J1: "",
        job_last_prolongation_date: "",
        job_prolongation_count: "",
        mer_sent: "",
      },
    }
  )
}
```

---

## Job de Backfill

### Fichier: `server/src/jobs/migrations/backfillJobsPartnersFromRecruiters.ts`

```typescript
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { logger } from "@/common/logger"

export const backfillJobsPartnersFromRecruiters = async () => {
  const cursor = getDbCollection("recruiters").find({})

  let processed = 0
  let updated = 0
  let errors = 0

  for await (const recruiter of cursor) {
    for (const job of recruiter.jobs) {
      try {
        // Note: address_detail n'est pas synchronisé car déjà éclaté dans workplace_address_*
        const result = await getDbCollection("jobs_partners").updateOne(
          { _id: job._id },
          {
            $set: {
              managed_by: recruiter.managed_by,
              establishment_id: recruiter.establishment_id,
              recruiter_status: recruiter.status,
              relance_mail_expiration_J7: job.relance_mail_expiration_J7 ?? null,
              relance_mail_expiration_J1: job.relance_mail_expiration_J1 ?? null,
              job_last_prolongation_date: job.job_last_prolongation_date ?? null,
              job_prolongation_count: job.job_prolongation_count ?? 0,
            },
          }
        )

        if (result.modifiedCount > 0) updated++
        processed++

        if (processed % 1000 === 0) {
          logger.info(`Backfill progress: ${processed} processed, ${updated} updated`)
        }
      } catch (error) {
        errors++
        logger.error(`Error backfilling job ${job._id}:`, error)
      }
    }
  }

  logger.info(`Backfill complete: ${processed} processed, ${updated} updated, ${errors} errors`)
}
```

---

## Mise à Jour de la Synchronisation

### Fichier: `server/src/services/formulaire.service.ts`

Modifier la fonction `upsertJobPartnersFromRecruiter` (ligne ~953):

```typescript
const upsertJobPartnersFromRecruiter = async (recruiter: IRecruiter, job: IJob) => {
  const now = new Date()

  // ... code existant ...

  const partnerJobToUpsert: Partial<IJobsPartnersOfferPrivate> = {
    // ... champs existants (workplace_address_* déjà synchronisés) ...

    // === NOUVEAUX CHAMPS À AJOUTER ===
    managed_by: recruiter.managed_by,
    establishment_id: recruiter.establishment_id,
    recruiter_status: recruiter.status,
    relance_mail_expiration_J7: job.relance_mail_expiration_J7 ?? null,
    relance_mail_expiration_J1: job.relance_mail_expiration_J1 ?? null,
    job_last_prolongation_date: job.job_last_prolongation_date ?? null,
    job_prolongation_count: job.job_prolongation_count ?? 0,
    // Note: address_detail n'est pas ajouté car déjà éclaté dans workplace_address_*
    // ================================
  }

  // ... reste du code ...
}
```

---

## Validation Post-Migration

### Script de vérification

```typescript
const validateMigration = async () => {
  // 1. Vérifier que tous les jobs LBA ont les nouveaux champs
  const missingFields = await getDbCollection("jobs_partners").countDocuments({
    partner_label: "RECRUTEURS_LBA",
    $or: [{ managed_by: { $exists: false } }, { establishment_id: { $exists: false } }, { recruiter_status: { $exists: false } }],
  })

  if (missingFields > 0) {
    throw new Error(`${missingFields} documents missing required fields`)
  }

  // 2. Vérifier la consistance avec recruiters
  const recruitersCount = await getDbCollection("recruiters")
    .aggregate([{ $unwind: "$jobs" }, { $match: { "jobs.job_status": "Active" } }, { $count: "total" }])
    .toArray()

  const jobsPartnersCount = await getDbCollection("jobs_partners").countDocuments({
    partner_label: "RECRUTEURS_LBA",
    offer_status: "Active",
  })

  const diff = Math.abs(recruitersCount[0]?.total - jobsPartnersCount)
  if (diff > 10) {
    // Tolérance de 10 pour les changements en cours
    console.warn(`Discrepancy: recruiters=${recruitersCount[0]?.total}, jobs_partners=${jobsPartnersCount}`)
  }

  console.log("Migration validation complete")
}
```
