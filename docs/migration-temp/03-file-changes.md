# 03 - Liste Détaillée des Fichiers à Modifier

## Résumé par Priorité

| Priorité             | Fichiers | Description                        |
| -------------------- | -------- | ---------------------------------- |
| P1 - Critique        | 2        | Bloquant release                   |
| P2 - Services Core   | 4        | Logique métier principale          |
| P3 - Services User   | 6        | Gestion utilisateurs/organisations |
| P4 - Controllers     | 5        | Endpoints API                      |
| P5 - Background Jobs | 11       | Jobs automatisés                   |
| P6 - Tests           | 12       | Tests unitaires/intégration        |
| P7 - Autres          | 4        | Sitemap, obfuscation, etc.         |

---

## Priorité 1 - Critique (Bloquant Release)

### 1.1 `server/src/security/authorisationService.ts`

**Impact:** Vérifications d'autorisation pour toutes les opérations sur les offres.

| Ligne   | Fonction                  | Changement                                    |
| ------- | ------------------------- | --------------------------------------------- |
| 119-162 | `getRecruitersResource()` | Lookup parallèle dans jobs_partners           |
| 164-192 | `getJobsResource()`       | Changer de recruiters.jobs vers jobs_partners |
| 326-333 | `canAccessRecruiter()`    | Utiliser managed_by depuis jobs_partners      |
| 335-337 | `canAccessJob()`          | Utiliser jobs_partners directement            |

**Code actuel:**

```typescript
// Ligne 128
const recruiter = await getDbCollection("recruiters").findOne({ _id: new ObjectId(...) })

// Ligne 174
const recruiter = await getDbCollection("recruiters").findOne({ "jobs._id": id })
```

**Code cible:**

```typescript
// Nouveau
const job = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(id) })
const canAccess = job?.managed_by === userId || hasAdminAccess
```

---

### 1.2 `server/src/services/lbajob.service.ts`

**Impact:** Recherche géospatiale des offres LBA, cœur de la fonctionnalité de recherche.

| Ligne   | Fonction                      | Changement                                               |
| ------- | ----------------------------- | -------------------------------------------------------- |
| 39-118  | `getJobs()`                   | Remplacer aggregation recruiters par query jobs_partners |
| 217-240 | `getLbaJobById()`             | Query jobs_partners au lieu de recruiters                |
| 427-441 | `addOffreDetailView()`        | Update jobs_partners directement                         |
| 446-461 | `incrementLbaJobsViewCount()` | Update jobs_partners                                     |
| 463-491 | `getLbaJobContactInfo()`      | Utiliser cfa\_\* fields depuis jobs_partners             |

**Code actuel (ligne 92):**

```typescript
const recruiters = await getDbCollection("recruiters")
  .aggregate<IRecruiter>([
    { $geoNear: { near: { type: "Point", coordinates }, ... } },
    // ... stages complexes avec $unwind sur jobs
  ])
  .toArray()
```

**Code cible:**

```typescript
const jobs = await getDbCollection("jobs_partners")
  .aggregate<IJobsPartnersOfferPrivate>([
    { $geoNear: { near: { type: "Point", coordinates }, distanceField: "distance", ... } },
    { $match: { partner_label: "RECRUTEURS_LBA", offer_status: "Active" } },
    // Aggregation simplifiée - pas de $unwind nécessaire
  ])
  .toArray()
```

---

## Priorité 2 - Services Core

### 2.1 `server/src/services/formulaire.service.ts`

**Impact:** Service principal CRUD pour les recruteurs et offres. **40+ opérations**.

| Ligne   | Fonction                                              | Type   | Changement                                      |
| ------- | ----------------------------------------------------- | ------ | ----------------------------------------------- |
| 109-122 | `getOffreAvecInfoMandataire()`                        | READ   | Query jobs_partners                             |
| 132-144 | `getFormulaires()`                                    | READ   | Dual-read puis jobs_partners                    |
| 154-252 | `createJob()`                                         | WRITE  | Écrire dans jobs_partners (+ sync)              |
| 257-348 | `createJobDelegations()`                              | WRITE  | Update jobs_partners                            |
| 355-358 | `checkOffreExists()`                                  | READ   | Query jobs_partners                             |
| 365     | `getFormulaire()`                                     | READ   | Query jobs_partners groupé par establishment_id |
| 367-380 | `getFormulaireWithRomeDetail()`                       | READ   | Query jobs_partners + join referentielromes     |
| 387-405 | `createFormulaire()`                                  | WRITE  | Créer entrée(s) dans jobs_partners              |
| 410     | `deleteFormulaire()`                                  | DELETE | Update offer_status dans jobs_partners          |
| 415-421 | `updateFormulaire()`                                  | UPDATE | Update jobs_partners par establishment_id       |
| 428-446 | `archiveFormulaire()`                                 | UPDATE | Update recruiter_status dans jobs_partners      |
| 453-460 | `activateRecruiter()`                                 | UPDATE | Update recruiter_status                         |
| 466-470 | `archiveDelegatedFormulaire()`                        | UPDATE | Update par cfa_siret                            |
| 476-487 | `getOffre()` / `getOffreWithRomeDetail()`             | READ   | Query jobs_partners                             |
| 492-519 | `createOffre()` / `updateOffre()`                     | WRITE  | Update jobs_partners                            |
| 527-545 | `patchOffre()`                                        | UPDATE | Update jobs_partners                            |
| 547-557 | `updateJobDelegation()`                               | UPDATE | Update delegations                              |
| 564-603 | `provideOffre()` / `cancelOffre()`                    | UPDATE | Update offer_status                             |
| 610-650 | `extendOffre()` / `activateAndExtendOffre()`          | UPDATE | Update expiration + prolongation fields         |
| 656-674 | `checkForJobActivations()`                            | UPDATE | Update offer_status en batch                    |
| 679-700 | `getJob()` / `getJobWithRomeDetail()`                 | READ   | Query jobs_partners                             |
| 774-796 | `getJobFromRecruiter()` / `getFormulaireFromUserId()` | READ   | Query par managed_by                            |
| 869-873 | `validateUserEmailFromJobId()`                        | READ   | Utiliser managed_by                             |
| 884-887 | `updateCfaManagedRecruiter()`                         | UPDATE | Update jobs_partners                            |

**Stages d'aggregation à migrer (lignes 58-104):**

```typescript
// Ces stages deviennent obsolètes car jobs_partners a déjà les champs aplatis
const romeDetailAndCandidatureCountAggregateStage = [...]
export const romeDetailAggregateStages = [...]
```

---

### 2.2 `server/src/services/application.service.ts`

**Impact:** Gestion des candidatures, lien avec les offres.

| Ligne | Fonction                          | Changement                   |
| ----- | --------------------------------- | ---------------------------- |
| 810   | Lookup recruiter par job_id       | Query jobs_partners          |
| 1249  | `findOne({ "jobs._id": job_id })` | Query jobs_partners par \_id |
| 1338  | Lookup recruiter                  | Query jobs_partners          |

---

### 2.3 `server/src/services/userRecruteur.service.ts`

**Impact:** Transformation données recruteur pour l'interface.

| Ligne | Fonction                     | Changement                          |
| ----- | ---------------------------- | ----------------------------------- |
| 254   | Check email uniqueness       | Query jobs_partners                 |
| 272   | `updateMany({ managed_by })` | Update jobs_partners par managed_by |
| 386   | `findOne({ managed_by })`    | Query jobs_partners                 |

---

### 2.4 `server/src/services/etablissement.service.ts`

**Impact:** Gestion des délégations CFA.

| Ligne | Fonction                                                | Changement           |
| ----- | ------------------------------------------------------- | -------------------- |
| 536   | `findOne({ cfa_delegated_siret, establishment_siret })` | Query jobs_partners  |
| 551   | `findOneAndUpdate()`                                    | Update jobs_partners |

---

## Priorité 3 - Services User/Organisation

### 3.1 `server/src/services/organization.service.ts`

| Ligne | Fonction                              | Changement                              |
| ----- | ------------------------------------- | --------------------------------------- |
| 95    | `updateMany({ establishment_siret })` | Update workplace\_\* dans jobs_partners |
| 114   | `find({ establishment_siret })`       | Query jobs_partners                     |

---

### 3.2 `server/src/services/userWithAccount.service.ts`

| Ligne | Fonction               | Changement                         |
| ----- | ---------------------- | ---------------------------------- |
| 87    | `find({ managed_by })` | Query jobs_partners par managed_by |

---

### 3.3 `server/src/services/user.service.ts`

| Ligne | Fonction      | Changement                    |
| ----- | ------------- | ----------------------------- |
| 59    | `aggregate()` | Aggreger depuis jobs_partners |

---

### 3.4 `server/src/services/roleManagement.service.ts`

| Ligne | Fonction    | Changement          |
| ----- | ----------- | ------------------- |
| 335   | `findOne()` | Query jobs_partners |

---

## Priorité 4 - Controllers

### 4.1 `server/src/http/controllers/formulaire.controller.ts`

| Ligne | Endpoint                            | Changement                 |
| ----- | ----------------------------------- | -------------------------- |
| 174   | GET formulaire par establishment_id | Query jobs_partners groupé |
| 240   | GET formulaire                      | Query jobs_partners        |

---

### 4.2 `server/src/http/controllers/jobs.controller.ts`

| Ligne | Endpoint                                  | Changement          |
| ----- | ----------------------------------------- | ------------------- |
| 55    | `findOne({ establishment_siret, email })` | Query jobs_partners |

---

### 4.3 `server/src/http/controllers/v2/jobs.controller.v2.ts`

| Ligne | Endpoint         | Changement          |
| ----- | ---------------- | ------------------- |
| 32-38 | Lookup recruiter | Query jobs_partners |
| 50-61 | Lookup recruiter | Query jobs_partners |

---

### 4.4 `server/src/http/controllers/etablissementRecruteur.controller.ts`

| Ligne | Endpoint            | Changement          |
| ----- | ------------------- | ------------------- |
| 185   | `find()` recruiters | Query jobs_partners |

---

### 4.5 `server/src/http/controllers/user.controller.ts`

| Ligne | Endpoint                                   | Changement            |
| ----- | ------------------------------------------ | --------------------- |
| 174   | `updateMany({ establishment_siret })` OPCO | Update workplace_opco |

---

## Priorité 5 - Background Jobs

Voir document séparé: [04-background-jobs.md](./04-background-jobs.md)

---

## Priorité 6 - Tests

### Tests à mettre à jour

| Fichier                                                                  | Raison            |
| ------------------------------------------------------------------------ | ----------------- |
| `server/src/services/formulaire.service.test.ts`                         | Service principal |
| `server/src/services/application.service.test.ts`                        | Lookups job       |
| `server/src/services/jobs/jobOpportunity/jobOpportunity.service.test.ts` | Queries           |
| `server/src/http/controllers/formulaire.controller.test.ts`              | API responses     |
| `server/src/http/controllers/etablissementRecruteur.controller.test.ts`  | Operations        |
| `server/src/http/controllers/v3/jobs/jobs.controller.v3.test.ts`         | Job operations    |
| `server/src/http/controllers/v2/applications.controller.v2.test.ts`      | Application flows |
| `server/tests/utils/user.test.utils.ts`                                  | Test utilities    |
| `server/src/jobs/offrePartenaire/detectDuplicateJobPartners.test.ts`     | Job tests         |

### Fixtures à migrer

Tous les tests qui créent des `recruiters` doivent être adaptés pour créer des `jobs_partners`:

```typescript
// Avant
await getDbCollection("recruiters").insertOne(recruiter)

// Après
await getDbCollection("jobs_partners").insertMany(recruiter.jobs.map((job) => transformRecruiterJobToJobsPartners(recruiter, job)))
```

---

## Priorité 7 - Autres

### 7.1 `server/src/services/sitemap.service.ts`

| Ligne | Fonction            | Changement                 |
| ----- | ------------------- | -------------------------- |
| 22    | `find()` recruiters | Query jobs_partners actifs |

---

### 7.2 `server/src/jobs/database/obfuscateCollections.ts`

| Ligne   | Fonction               | Changement                      |
| ------- | ---------------------- | ------------------------------- |
| 190-211 | Obfuscation recruiters | Supprimer, garder jobs_partners |

---

### 7.3 `server/src/jobs/anonymization/anonymizeIndividual.ts`

Adapter pour anonymiser dans jobs_partners au lieu de recruiters.

---

### 7.4 `server/src/jobs/oneTimeJob/addNafDataToCacheEntreprise.ts`

| Ligne | Fonction                               | Changement          |
| ----- | -------------------------------------- | ------------------- |
| 28    | `findOne({ establishment_siret })` NAF | Query jobs_partners |

---

## Checklist de Migration par Fichier

```markdown
## Services (15 fichiers)

- [ ] formulaire.service.ts (40+ changements)
- [ ] lbajob.service.ts (5 changements)
- [ ] application.service.ts (3 changements)
- [ ] userRecruteur.service.ts (3 changements)
- [ ] etablissement.service.ts (2 changements)
- [ ] organization.service.ts (2 changements)
- [ ] userWithAccount.service.ts (1 changement)
- [ ] user.service.ts (1 changement)
- [ ] roleManagement.service.ts (1 changement)
- [ ] sitemap.service.ts (1 changement)
- [ ] partnerJob.service.ts (vérifier compatibilité)
- [ ] appLinks.service.ts (vérifier)
- [ ] catalogue.service.ts (vérifier)
- [ ] rome.service.ts (vérifier)
- [ ] trafficSource.service.ts (vérifier)

## Security (1 fichier)

- [ ] authorisationService.ts (4 changements critiques)

## Controllers (5 fichiers)

- [ ] formulaire.controller.ts (2 changements)
- [ ] jobs.controller.ts (1 changement)
- [ ] jobs.controller.v2.ts (2 changements)
- [ ] etablissementRecruteur.controller.ts (1 changement)
- [ ] user.controller.ts (1 changement)

## Jobs (voir doc séparé)

- [ ] 11 jobs à migrer

## Tests (12 fichiers)

- [ ] 9 fichiers de tests à mettre à jour
```
