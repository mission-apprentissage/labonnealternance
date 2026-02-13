# 07 - Feature Flags pour la Transition Progressive

## Principe de Base

Les feature flags sont des **interrupteurs conditionnels** dans le code qui permettent d'activer/désactiver des fonctionnalités sans redéploiement.

```typescript
// Exemple simple
if (config.USE_JOBS_PARTNERS_READ) {
  return readFromJobsPartners(id)
} else {
  return readFromRecruiters(id)
}
```

---

## Stratégie en 4 Phases

### Vue d'ensemble

```
PHASE 1: SYNC COMPLET
├── Stream processor: ✅ ACTIF
├── Écriture: recruiters uniquement (sync automatique)
├── Lecture: recruiters uniquement
└── Objectif: S'assurer que TOUS les champs sont synchronisés

PHASE 2: DUAL-READ
├── Stream processor: ✅ ACTIF
├── Écriture: recruiters (sync automatique)
├── Lecture: jobs_partners (primary) + recruiters (fallback)
└── Objectif: Valider que jobs_partners contient les bonnes données

PHASE 3: ÉCRITURE DIRECTE
├── Stream processor: ❌ COUPÉ
├── Écriture: jobs_partners (direct) + recruiters (backup optionnel)
├── Lecture: jobs_partners uniquement
└── Objectif: L'application écrit directement dans jobs_partners

PHASE 4: CLEANUP
├── Stream processor: ❌ SUPPRIMÉ
├── Écriture: jobs_partners uniquement
├── Lecture: jobs_partners uniquement
└── Objectif: Supprimer recruiters
```

### Diagrammes par Phase

```
PHASE 1: SYNC COMPLET (stream processor ACTIF)
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Application ──WRITE──→ recruiters ──Stream Processor──→ jobs_partners
│                                            (actif)                  │
│  READ ←─────────────────── recruiters                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

PHASE 2: DUAL-READ (stream processor ACTIF)
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Application ──WRITE──→ recruiters ──Stream Processor──→ jobs_partners
│                                            (actif)                  │
│  READ ←─────────────────── jobs_partners (primary)                  │
│  READ ←─────────────────── recruiters (fallback si non trouvé)      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

PHASE 3: ÉCRITURE DIRECTE (stream processor COUPÉ)
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Application ──WRITE──→ jobs_partners (direct)                      │
│             ──WRITE──→ recruiters (backup temporaire, optionnel)    │
│                                                                     │
│  READ ←─────────────────── jobs_partners                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

PHASE 4: CLEANUP
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Application ──WRITE──→ jobs_partners                               │
│  READ ←─────────────────── jobs_partners                            │
│                                                                     │
│  recruiters: SUPPRIMÉ                                               │
│  stream_processor: SUPPRIMÉ                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implémentation des Feature Flags

### Configuration

```typescript
// server/src/config.ts

export const migrationFlags = {
  /**
   * PHASE 2: Active la lecture depuis jobs_partners
   * - true: Lire depuis jobs_partners (fallback recruiters si non trouvé)
   * - false: Lire depuis recruiters uniquement
   */
  USE_JOBS_PARTNERS_READ: process.env.USE_JOBS_PARTNERS_READ === "true",

  /**
   * PHASE 3: Active l'écriture directe dans jobs_partners
   * - true: Écrire directement dans jobs_partners
   * - false: Écrire dans recruiters (sync via stream processor)
   */
  USE_JOBS_PARTNERS_WRITE: process.env.USE_JOBS_PARTNERS_WRITE === "true",

  /**
   * PHASE 3: Garde une copie dans recruiters (backup)
   * - true: Écrire aussi dans recruiters (dual-write)
   * - false: Écrire uniquement dans jobs_partners
   */
  KEEP_RECRUITERS_BACKUP: process.env.KEEP_RECRUITERS_BACKUP === "true",

  /**
   * URGENCE: Force le retour à recruiters
   * - true: Ignorer tous les autres flags, utiliser recruiters
   * - false: Comportement normal selon les autres flags
   */
  FORCE_RECRUITERS_FALLBACK: process.env.FORCE_RECRUITERS_FALLBACK === "true",
}
```

### Utilisation dans les Services

#### Lecture (GET)

```typescript
// server/src/services/formulaire.service.ts

export const getOffre = async (id: ObjectId): Promise<IJob | null> => {
  // URGENCE: Bypass total
  if (migrationFlags.FORCE_RECRUITERS_FALLBACK) {
    return getOffreFromRecruiters(id)
  }

  // PHASE 2+: Lecture depuis jobs_partners
  if (migrationFlags.USE_JOBS_PARTNERS_READ) {
    const job = await getDbCollection("jobs_partners").findOne({
      _id: id,
      partner_label: "RECRUTEURS_LBA",
    })

    if (job) {
      return transformJobsPartnersToLegacy(job)
    }

    // Fallback vers recruiters (Phase 2 uniquement)
    if (!migrationFlags.USE_JOBS_PARTNERS_WRITE) {
      logger.warn(`Job ${id} not found in jobs_partners, fallback to recruiters`)
      metrics.fallbackCount.inc()
      return getOffreFromRecruiters(id)
    }

    return null
  }

  // PHASE 1: Lecture depuis recruiters
  return getOffreFromRecruiters(id)
}

const getOffreFromRecruiters = async (id: ObjectId): Promise<IJob | null> => {
  const recruiter = await getDbCollection("recruiters").findOne({
    "jobs._id": id,
  })
  return recruiter?.jobs.find((j) => j._id.equals(id)) ?? null
}
```

#### Écriture (CREATE/UPDATE)

```typescript
// server/src/services/formulaire.service.ts

export const createOffre = async (establishmentId: string, data: IJobCreate): Promise<IJob> => {
  // PHASE 3+: Écriture directe dans jobs_partners
  if (migrationFlags.USE_JOBS_PARTNERS_WRITE) {
    const job = await createOffreInJobsPartners(establishmentId, data)

    // Backup optionnel dans recruiters (Phase 3 transitoire)
    if (migrationFlags.KEEP_RECRUITERS_BACKUP) {
      try {
        await createOffreInRecruiters(establishmentId, data)
      } catch (error) {
        logger.error("Failed to backup in recruiters", error)
        // Ne pas bloquer - jobs_partners est la source de vérité
      }
    }

    return job
  }

  // PHASE 1-2: Écriture dans recruiters (sync via stream processor)
  return createOffreInRecruiters(establishmentId, data)
}

export const updateOffre = async (id: ObjectId, data: Partial<IJob>): Promise<IJob> => {
  if (migrationFlags.USE_JOBS_PARTNERS_WRITE) {
    const job = await updateOffreInJobsPartners(id, data)

    if (migrationFlags.KEEP_RECRUITERS_BACKUP) {
      try {
        await updateOffreInRecruiters(id, data)
      } catch (error) {
        logger.error("Failed to backup update in recruiters", error)
      }
    }

    return job
  }

  return updateOffreInRecruiters(id, data)
}
```

---

## Configuration par Phase

### Phase 1 - Sync Complet

```bash
# .env.production
USE_JOBS_PARTNERS_READ=false
USE_JOBS_PARTNERS_WRITE=false
KEEP_RECRUITERS_BACKUP=false
FORCE_RECRUITERS_FALLBACK=false
```

**Actions:**

- Stream processor actif
- Ajouter les champs manquants à la sync
- Lancer le backfill complet
- Vérifier la consistance des données

### Phase 2 - Dual-Read

```bash
# .env.production
USE_JOBS_PARTNERS_READ=true    # ← Activé
USE_JOBS_PARTNERS_WRITE=false
KEEP_RECRUITERS_BACKUP=false
FORCE_RECRUITERS_FALLBACK=false
```

**Actions:**

- Monitorer les fallbacks (devrait être ~0)
- Comparer les latences
- Vérifier les réponses API

### Phase 3 - Écriture Directe

```bash
# .env.production - Étape 3a (avec backup)
USE_JOBS_PARTNERS_READ=true
USE_JOBS_PARTNERS_WRITE=true   # ← Activé
KEEP_RECRUITERS_BACKUP=true    # ← Backup actif
FORCE_RECRUITERS_FALLBACK=false
```

```bash
# .env.production - Étape 3b (sans backup, stream processor coupé)
USE_JOBS_PARTNERS_READ=true
USE_JOBS_PARTNERS_WRITE=true
KEEP_RECRUITERS_BACKUP=false   # ← Backup désactivé
FORCE_RECRUITERS_FALLBACK=false
```

**Actions:**

- Couper le stream processor (après 3a validé)
- Monitorer les erreurs d'écriture
- Vérifier que recruiters n'est plus mis à jour

### Phase 4 - Cleanup

```bash
# .env.production
USE_JOBS_PARTNERS_READ=true
USE_JOBS_PARTNERS_WRITE=true
KEEP_RECRUITERS_BACKUP=false
FORCE_RECRUITERS_FALLBACK=false
```

**Actions:**

- Supprimer le code de fallback
- Supprimer le stream processor
- Drop collection recruiters

---

## Monitoring et Métriques

### Métriques à Collecter

```typescript
// server/src/common/metrics.ts

export const migrationMetrics = {
  // Compteur de lectures par source
  reads: new Counter({
    name: "migration_reads_total",
    labelNames: ["source"], // "jobs_partners" | "recruiters"
  }),

  // Compteur de fallbacks (Phase 2)
  fallbacks: new Counter({
    name: "migration_fallbacks_total",
    help: "Number of times we fell back to recruiters",
  }),

  // Latence par source
  readLatency: new Histogram({
    name: "migration_read_latency_seconds",
    labelNames: ["source"],
  }),

  // Erreurs d'écriture
  writeErrors: new Counter({
    name: "migration_write_errors_total",
    labelNames: ["target"], // "jobs_partners" | "recruiters"
  }),

  // Incohérences détectées
  inconsistencies: new Counter({
    name: "migration_inconsistencies_total",
  }),
}
```

### Alertes Recommandées

```yaml
# alertmanager/migration-alerts.yml
groups:
  - name: migration
    rules:
      # Trop de fallbacks = problème de sync
      - alert: HighFallbackRate
        expr: rate(migration_fallbacks_total[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Fallback rate too high during migration"

      # Erreurs d'écriture jobs_partners
      - alert: JobsPartnersWriteErrors
        expr: rate(migration_write_errors_total{target="jobs_partners"}[5m]) > 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Errors writing to jobs_partners"

      # Latence dégradée
      - alert: HighReadLatency
        expr: histogram_quantile(0.95, migration_read_latency_seconds{source="jobs_partners"}) > 0.5
        for: 5m
        labels:
          severity: warning
```

---

## Procédure de Rollback

### Rollback Rapide (< 1 minute)

```bash
# Activer le bypass d'urgence
kubectl set env deployment/lba-server FORCE_RECRUITERS_FALLBACK=true

# Vérifier
kubectl logs -l app=lba-server --tail=10 | grep "fallback"
```

### Rollback Phase 3 → Phase 2

```bash
# 1. Désactiver l'écriture directe
kubectl set env deployment/lba-server USE_JOBS_PARTNERS_WRITE=false

# 2. Réactiver le backup
kubectl set env deployment/lba-server KEEP_RECRUITERS_BACKUP=false

# 3. Redémarrer le stream processor
kubectl scale deployment/stream-processor --replicas=1

# 4. Lancer un sync de rattrapage
kubectl exec -it deploy/lba-server -- yarn cli jobs:run backfillJobsPartners
```

### Rollback Phase 2 → Phase 1

```bash
# Désactiver la lecture depuis jobs_partners
kubectl set env deployment/lba-server USE_JOBS_PARTNERS_READ=false
```

---

## Checklist par Phase

### Phase 1 ✓

- [ ] Champs manquants ajoutés au schéma jobs_partners
- [ ] Migration DB exécutée
- [ ] Backfill complet lancé
- [ ] Vérification: count recruiters.jobs == count jobs_partners (LBA)
- [ ] Stream processor stable depuis 1 semaine

### Phase 2 ✓

- [ ] `USE_JOBS_PARTNERS_READ=true` activé
- [ ] Fallback rate < 0.1%
- [ ] Latence jobs_partners ≤ latence recruiters
- [ ] Tests E2E passent
- [ ] Stable depuis 2 semaines

### Phase 3 ✓

- [ ] `USE_JOBS_PARTNERS_WRITE=true` activé
- [ ] `KEEP_RECRUITERS_BACKUP=true` (temporaire)
- [ ] Vérifier dual-write fonctionne
- [ ] Couper stream processor
- [ ] `KEEP_RECRUITERS_BACKUP=false`
- [ ] Stable depuis 2 semaines

### Phase 4 ✓

- [ ] Supprimer code fallback
- [ ] Supprimer stream processor
- [ ] Drop collection recruiters
- [ ] Drop collection anonymized_recruiters
- [ ] Nettoyer les feature flags
