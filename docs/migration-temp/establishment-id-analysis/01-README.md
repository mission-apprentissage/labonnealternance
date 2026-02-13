# Analyse de `establishment_id` - Impact sur le Décommissionnement de `recruiters`

## Résumé Exécutif

Cette analyse évalue la possibilité de **supprimer `establishment_id`** et de le remplacer par `_id` dans le cadre de la migration de la collection `recruiters` vers `jobs_partners`.

### Verdict : **NE PAS SUPPRIMER** `establishment_id`

| Critère          | Impact        | Détail                                  |
| ---------------- | ------------- | --------------------------------------- |
| **Server**       | 🔴 Élevé      | 20+ fichiers, 10 endpoints API          |
| **UI**           | 🔴 Élevé      | 11+ composants, 7 routes Next.js        |
| **Liens Emails** | 🔴 Critique   | URLs de délégation CFA seraient cassées |
| **Sécurité**     | 🟡 Régression | UUIDs plus sûrs que ObjectIds dans URLs |

---

## Documents de cette Analyse

| Document                                                             | Description                                  |
| -------------------------------------------------------------------- | -------------------------------------------- |
| [02-server-impact.md](./02-server-impact.md)                         | Impact côté serveur - 20+ fichiers détaillés |
| [03-ui-impact.md](./03-ui-impact.md)                                 | Impact côté UI - 11+ composants, 7 routes    |
| [04-migration-recommendations.md](./04-migration-recommendations.md) | Recommandations et plan d'action             |

---

## Qu'est-ce que `establishment_id` ?

```typescript
// Dans recruiters collection
{
  _id: ObjectId("..."),           // Identifiant MongoDB interne
  establishment_id: "a1b2c3d4-...", // UUID externe pour URLs/API
  establishment_siret: "12345678901234",
  jobs: [...]
}
```

| Propriété      | `_id`                   | `establishment_id`             |
| -------------- | ----------------------- | ------------------------------ |
| **Format**     | ObjectId (24 chars hex) | UUID v4 (36 chars avec tirets) |
| **Génération** | MongoDB automatique     | `randomUUID()` dans le code    |
| **Visibilité** | Interne uniquement      | URLs, API, emails              |
| **Sécurité**   | Séquentiel, devinable   | Aléatoire, sécurisé            |

---

## Pourquoi `establishment_id` existe ?

1. **Sécurité des URLs** : Les UUIDs sont impossibles à deviner contrairement aux ObjectIds séquentiels
2. **Identifiant externe** : Utilisé dans les liens envoyés par email aux CFAs
3. **Groupement** : Permet de regrouper les offres d'un même établissement
4. **Historique** : Séparation entre identifiant technique (MongoDB) et identifiant métier

---

## Impact de la Suppression

### Côté Server (20+ fichiers)

```
Controllers:     5 fichiers  (formulaire, jobs v1/v2)
Services:        8 fichiers  (formulaire, user, roleManagement...)
Security:        1 fichier   (authorisationService)
Jobs:            4 fichiers  (anonymization, metabase, export...)
Tests:           3 fichiers
```

### Côté UI (11+ composants)

```
API Functions:   7 fonctions (api.ts)
React Components: 12 composants
Next.js Routes:  7 pages dynamiques [establishment_id]
Route Builders:  7 fonctions (routes.utils.ts)
```

### Liens Emails Impactés

```
/espace-pro/proposition/formulaire/{establishment_id}/offre/{job_id}/siret/{siret}
/espace-pro/cfa/entreprise/{establishment_id}
/espace-pro/mise-en-relation/{establishment_id}/{job_id}
```

---

## Recommandation : Garder `establishment_id`

### Dans `jobs_partners`

```typescript
// Nouveau schéma jobs_partners
{
  _id: ObjectId("..."),              // ID unique de l'offre
  establishment_id: "a1b2c3d4-...",  // UUID groupant les offres
  managed_by: "user-id",             // Utilisateur gestionnaire
  // ... autres champs
}
```

### Patterns de Requête

```typescript
// Obtenir toutes les offres d'un établissement
const jobs = await getDbCollection("jobs_partners")
  .find({
    establishment_id: establishmentId,
    partner_label: "RECRUTEURS_LBA",
  })
  .toArray()

// Obtenir une offre spécifique
const job = await getDbCollection("jobs_partners").findOne({
  _id: jobId,
})
```

### Avantages

- ✅ Aucun breaking change
- ✅ Liens emails existants fonctionnent
- ✅ Sécurité maintenue (UUIDs dans URLs)
- ✅ Migration simplifiée

---

## Actions Requises

1. **Ajouter `establishment_id` au schéma `jobs_partners`**
2. **Synchroniser depuis `recruiters` pendant la migration**
3. **Créer l'index** `{ establishment_id: 1 }`
4. **Adapter les endpoints** pour query par `establishment_id`

Voir [04-migration-recommendations.md](./04-migration-recommendations.md) pour le plan détaillé.

---

## Bug Identifié

⚠️ **Incohérence dans le code** :

```typescript
// shared/src/models/recruiter.model.ts - Définition
establishment_id: z.string().default(() => new ObjectId().toString())

// server/src/services/formulaire.service.ts - Implémentation réelle
establishment_id: randomUUID() // ← C'est celui-ci qui est utilisé
```

La définition du modèle dit `ObjectId().toString()` mais l'implémentation utilise `randomUUID()`. Ce n'est pas bloquant car les deux sont des strings uniques, mais cela devrait être corrigé pour la cohérence.
