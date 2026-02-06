# 01 - Vue d'ensemble du Décommissionnement

## Contexte

La collection `recruiters` gère actuellement les offres d'emploi en alternance (offres LBA). Elle est progressivement remplacée par la collection `jobs_partners` qui unifie toutes les sources d'offres (France Travail, partenaires, LBA).

### Architecture Actuelle

```
┌─────────────────┐     Change Stream      ┌─────────────────┐
│   recruiters    │ ───────────────────────▶│  jobs_partners  │
│   (source)      │   stream_processor     │   (cible)       │
└─────────────────┘                        └─────────────────┘
        │                                          │
        ▼                                          ▼
   57 fichiers                              API v3/v4
   (services, jobs,                         (lecture unifiée)
    controllers)
```

### Service stream_processor

**Configuration Docker** (`.infra/docker-compose.production.yml` lignes 82-110):

- Image: `ghcr.io/mission-apprentissage/mna_lba_server`
- Replicas: 1 (instance unique pour fiabilité change stream)
- Commande: `yarn cli stream_processor:start`
- Mémoire: 1GB
- Health check: `/api/healthcheck` toutes les 60s

### Logique de Synchronisation

**Fichier:** `server/src/services/formulaire.service.ts` (lignes 889-1143)

```typescript
// Point d'entrée
startRecruiterChangeStream(signal: AbortSignal)
  ├── startChangeStream("recruiters", resumeToken, signal)
  └── startChangeStream("anonymized_recruiters", resumeToken, signal)

// Gestionnaire de changements
onChange(change) {
  switch (change.operationType) {
    case "insert":
    case "update":
      await updateJobsPartnersFromRecruiterUpdate(change)
      await storeResumeToken("recruiters", change._id)
      break
    case "invalidate":
      // Restart après 10s sans token
      break
  }
}

// Mise à jour jobs_partners
updateJobsPartnersFromRecruiterUpdate(change)
  └── updateJobsPartnersFromRecruiterById(recruiterId)
        └── upsertJobPartnersFromRecruiter(recruiter, job)
```

---

## Statistiques d'Impact

### Fichiers par Catégorie

| Catégorie       | Nombre | % du total |
| --------------- | ------ | ---------- |
| Services        | 15     | 26%        |
| Controllers     | 8      | 14%        |
| Background Jobs | 18     | 32%        |
| Tests           | 12     | 21%        |
| Security        | 1      | 2%         |
| Models          | 3      | 5%         |
| **Total**       | **57** | 100%       |

### Opérations par Type

| Opération            | Occurrences |
| -------------------- | ----------- |
| `findOne()`          | 28          |
| `find()`             | 19          |
| `aggregate()`        | 8           |
| `findOneAndUpdate()` | 15          |
| `updateOne()`        | 7           |
| `updateMany()`       | 4           |
| `insertOne()`        | 6           |
| `deleteOne()`        | 3           |
| `deleteMany()`       | 4           |
| `bulkWrite()`        | 1           |

---

## Timeline de Migration

```
Semaine 1-2:   [████] Schema Migration
Semaine 3-4:   [████] Sync Fixes + Backfill
Semaine 5-6:   [████████] Priority 1-2 Services
Semaine 7-8:   [████████] Priority 3-4 Controllers
Semaine 9-10:  [████████] Background Jobs
Semaine 11-12: [████] Testing + Dual-Read
Semaine 13-14: [████] Cutover
Semaine 15-16: [████] Cleanup
```

### Jalons Clés

| Jalon             | Semaine | Critères                              |
| ----------------- | ------- | ------------------------------------- |
| Schema Ready      | 1       | Nouveaux champs déployés              |
| Sync Complete     | 2       | Backfill terminé, 0 écarts            |
| Services Migrated | 8       | Tous services utilisent jobs_partners |
| Jobs Migrated     | 10      | Tous jobs background migrés           |
| Dual-Read Stable  | 12      | 0 erreurs pendant 2 semaines          |
| Cutover           | 14      | recruiters reads désactivés           |
| Cleanup Done      | 16      | Collection supprimée                  |

---

## Risques et Mitigations

### Risques Techniques

| Risque                       | Probabilité | Impact | Mitigation                        |
| ---------------------------- | ----------- | ------ | --------------------------------- |
| Perte données pendant sync   | Moyenne     | Élevé  | Resume tokens + backfill nocturne |
| Performance dégradée         | Faible      | Moyen  | Index optimisés, batch processing |
| Incompatibilité API          | Moyenne     | Élevé  | Dual-read + tests E2E             |
| Token expiré (>24h downtime) | Faible      | Élevé  | Monitoring + alertes              |

### Risques Organisationnels

| Risque                   | Probabilité | Impact | Mitigation               |
| ------------------------ | ----------- | ------ | ------------------------ |
| Délais dépassés          | Moyenne     | Moyen  | Buffer 20% dans timeline |
| Régression fonctionnelle | Moyenne     | Élevé  | Tests automatisés + QA   |
| Rollback nécessaire      | Faible      | Moyen  | Plan rollback documenté  |

---

## Dépendances Externes

### Collections MongoDB

| Collection          | Relation                        |
| ------------------- | ------------------------------- |
| `userswithaccounts` | managed_by → \_id               |
| `applications`      | job_id → jobs.\_id              |
| `entreprises`       | establishment_siret → siret     |
| `cfas`              | cfa_delegated_siret → siret     |
| `rolemanagements`   | authorized_id → enterprise.\_id |
| `referentielromes`  | rome_code → rome.code_rome      |
| `unsubscribedofs`   | establishment_siret → siret     |
| `resumetokens`      | collection → "recruiters"       |

### Services Externes

| Service            | Usage                                         |
| ------------------ | --------------------------------------------- |
| France Travail API | Engagement entreprise (is_disabled_elligible) |
| Brevo              | Emails transactionnels                        |
| Sentry             | Error tracking                                |

---

## Questions Non Résolues

1. **Rétention backup:** Combien de temps conserver recruiters après cutover ?
   - Suggestion: 3 mois minimum

2. **Metabase:** Le job `metabaseJobsCollection` doit-il migrer vers jobs_partners ?
   - Impact: Dashboards analytics

3. **Historique:** Y a-t-il des besoins d'agrégation au niveau établissement ?
   - À vérifier avec équipe data

4. **API v3 format:** Faut-il adapter le format de réponse pour refléter jobs_partners ?
   - Impact: Clients API existants

5. **OPCO consistance:** Vérifier équivalence `recruiter.opco` ↔ `workplace_opco`
   - Tests de non-régression requis

6. **Délégations:** Confirmer sync bidirectionnel du tableau `delegations`
   - Vérifier avec tests E2E
