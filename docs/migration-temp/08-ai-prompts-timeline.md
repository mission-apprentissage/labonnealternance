# 08 - Prompts IA et Timeline Révisée

## Timeline Révisée: 6-7 Semaines

| Semaine | Phase               | Tâches                                        |
| ------- | ------------------- | --------------------------------------------- |
| 1       | Schema + Sync       | Migration DB, fix sync, backfill              |
| 2-3     | Code (Priorité 1-3) | Services critiques, authorization, formulaire |
| 4       | Code (Priorité 4-5) | Controllers, jobs background                  |
| 5       | Dual-read           | Activation, monitoring, fixes                 |
| 6       | Cutover             | Bascule complète vers jobs_partners           |
| 7       | Cleanup (IA)        | Suppression code legacy, tests finaux         |

**Hypothèses:**

- Tests générés par IA en parallèle du développement
- Cleanup automatisé par IA
- 1-2 développeurs
- Rollback testé avant cutover

---

## Prompt 1: Génération des Tests

````markdown
# Contexte

Je migre la collection MongoDB `recruiters` vers `jobs_partners` dans un projet Node.js/TypeScript avec Fastify et Vitest.

## Fichiers de référence

- Schéma source: `shared/src/models/recruiter.model.ts`
- Schéma cible: `shared/src/models/jobsPartners.model.ts`
- Service principal: `server/src/services/formulaire.service.ts`
- Tests existants: `server/src/services/formulaire.service.test.ts`

## Mapping des champs

| Source (recruiters)            | Cible (jobs_partners)      |
| ------------------------------ | -------------------------- |
| recruiter.managed_by           | managed_by                 |
| recruiter.establishment_id     | establishment_id           |
| recruiter.status               | recruiter_status           |
| job.relance_mail_expiration_J7 | relance_mail_expiration_J7 |
| job.relance_mail_expiration_J1 | relance_mail_expiration_J1 |
| job.job_last_prolongation_date | job_last_prolongation_date |
| job.job_prolongation_count     | job_prolongation_count     |

## Tâche

Génère des tests Vitest pour:

1. **Tests de consistance données** - Vérifie que les données dans `jobs_partners` correspondent à `recruiters`
2. **Tests des services migrés** - Teste les fonctions qui lisent/écrivent dans `jobs_partners`
3. **Tests de régression API** - Vérifie que les endpoints retournent les mêmes données qu'avant

### Format attendu

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"

describe("Migration recruiters → jobs_partners", () => {
  // Tests ici
})
```
````

### Fonctions à tester

1. `getOffre(id)` - Lecture d'une offre
2. `createOffre(establishmentId, data)` - Création d'offre
3. `updateOffre(id, data)` - Mise à jour
4. `getFormulaires(query)` - Liste des formulaires
5. `archiveFormulaire(establishmentId)` - Archivage

Génère les tests complets avec mocks MongoDB et assertions.

````

---

## Prompt 2: Cleanup du Code Legacy

```markdown
# Contexte

La migration `recruiters` → `jobs_partners` est terminée. Je dois nettoyer le code legacy.

## État actuel

- Toutes les lectures viennent de `jobs_partners`
- Toutes les écritures vont dans `jobs_partners`
- La collection `recruiters` n'est plus utilisée
- Le stream processor est arrêté

## Fichiers à nettoyer

### Services (supprimer code recruiters)

- `server/src/services/formulaire.service.ts`
  - Supprimer: `upsertJobPartnersFromRecruiter()` (lignes 889-1143)
  - Supprimer: `startRecruiterChangeStream()`
  - Supprimer: imports et références à la collection `recruiters`

- `server/src/services/application.service.ts`
  - Supprimer: lookups vers `recruiters`
  - Garder: lookups vers `jobs_partners`

### Jobs à supprimer

- `server/src/jobs/offrePartenaire/lbaJobToJobsPartners.ts` (plus nécessaire)
- `server/src/jobs/recruiters/removeDuplicatesRecruiters.ts` (obsolète)

### Jobs à modifier

- `server/src/jobs/database/obfuscateCollections.ts`
  - Supprimer: `obfuscateRecruiter()`
  - Garder: obfuscation de `jobs_partners`

### Feature flags à supprimer

Dans `server/src/config.ts`:
```typescript
// SUPPRIMER ces flags
USE_JOBS_PARTNERS_READ: true,
USE_JOBS_PARTNERS_WRITE: true,
KEEP_RECRUITERS_BACKUP: false,
FORCE_RECRUITERS_FALLBACK: false,
````

### Modèles

- `shared/src/models/recruiter.model.ts` - Marquer comme deprecated ou supprimer
- `shared/src/models/anonymizedRecruiters.model.ts` - Supprimer

## Tâche

Pour chaque fichier listé:

1. Identifie le code à supprimer (références à `recruiters`, `getDbCollection("recruiters")`)
2. Vérifie qu'aucune dépendance ne reste
3. Génère le diff de suppression
4. Liste les imports à nettoyer

### Format de sortie

Pour chaque fichier:

```
## fichier.ts

### À supprimer
- Lignes X-Y: description
- Fonction `nomFonction`: raison

### Imports à retirer
- import { X } from "..."

### Vérifications
- [ ] Aucune référence restante à recruiters
- [ ] Tests passent après suppression
```

````

---

## Prompt 3: Génération Migration DB

```markdown
# Contexte

Projet Node.js/TypeScript avec MongoDB. Je dois créer une migration pour ajouter des champs à `jobs_partners`.

## Nouveaux champs à ajouter

```typescript
// Pour les offres LBA (partner_label: "RECRUTEURS_LBA")
managed_by: string | null           // ID utilisateur gestionnaire
establishment_id: string | null     // UUID établissement
recruiter_status: string            // "Actif" | "Archivé" | "En attente de validation"
relance_mail_expiration_J7: Date | null
relance_mail_expiration_J1: Date | null
job_last_prolongation_date: Date | null
job_prolongation_count: number      // default: 0
mer_sent: Date | null
````

## Nouveaux index

```typescript
{ managed_by: 1 }
{ establishment_id: 1 }
{ relance_mail_expiration_J7: 1, offer_status: 1 }
{ relance_mail_expiration_J1: 1, offer_status: 1 }
{ recruiter_status: 1 }
{ managed_by: 1, offer_status: 1, offer_expiration: -1 }
```

## Format migration existant

```typescript
// server/src/migrations/20250XXX-nom-migration.ts
import { Db } from "mongodb"

export const up = async (db: Db) => {
  // Migration
}

export const down = async (db: Db) => {
  // Rollback
}
```

## Tâche

Génère:

1. Le fichier de migration complet
2. Un script de backfill pour populer les champs depuis `recruiters`
3. Un script de validation post-migration

````

---

## Prompt 4: Vérification Consistance

```markdown
# Contexte

Migration `recruiters` → `jobs_partners` en cours. Je dois vérifier la consistance des données.

## Vérifications requises

1. **Comptage** - Nombre de jobs dans recruiters == nombre dans jobs_partners (pour LBA)
2. **Champs critiques** - Tous les champs obligatoires sont remplis
3. **Références** - managed_by pointe vers un user existant
4. **Géolocalisation** - workplace_geopoint est valide

## Tâche

Génère un script de vérification qui:

1. Compare les counts entre collections
2. Identifie les documents avec champs manquants
3. Vérifie l'intégrité référentielle
4. Génère un rapport JSON avec:
   - Total documents vérifiés
   - Erreurs par type
   - Liste des _id problématiques

### Format sortie

```typescript
interface ConsistencyReport {
  timestamp: Date
  recruiters_jobs_count: number
  jobs_partners_lba_count: number
  discrepancy: number
  missing_fields: { field: string; count: number }[]
  invalid_references: { _id: string; field: string }[]
  invalid_geopoints: string[]
}
````

````

---

## Checklist Utilisation Prompts

| Étape | Prompt | Quand |
|-------|--------|-------|
| Semaine 1 | Prompt 3 (Migration DB) | Début migration |
| Semaine 2-4 | Prompt 1 (Tests) | Après chaque service migré |
| Semaine 5 | Prompt 4 (Consistance) | Avant activation dual-read |
| Semaine 7 | Prompt 2 (Cleanup) | Après cutover validé |

---

## Commandes de Validation

```bash
# Vérifier consistance
yarn cli jobs:run validateMigrationConsistency

# Lancer tests migration
yarn test --grep "Migration recruiters"

# Vérifier aucune référence recruiters restante
grep -r "getDbCollection.*recruiters" server/src --include="*.ts" | grep -v ".test.ts"

# Compter références
grep -r "recruiters" server/src --include="*.ts" | wc -l
````
