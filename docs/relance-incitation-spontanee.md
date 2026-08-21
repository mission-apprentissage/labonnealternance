# Incitation aux candidatures spontanées (liste B, J+7)

Job cron quotidien complémentaire de la [relance des candidats inactifs](./relance-candidats-inactifs.md) (liste A). Objectif : pousser vers les candidatures spontanées (entreprises exposées par l'algorithme, `recruteurs_lba`) les candidats qui ne connaissent que les offres publiées.

## Découpage disjoint entre les listes A et B

Même déclencheur pour les deux listes : **J+7** (jour calendaire J-7, `Europe/Paris`). Au moment du run, la population des inactifs est partitionnée par un seul critère — « a déjà fait une candidature spontanée (`job_origin = recruteurs_lba`) ou non » :

| Liste | Cible | Message |
|---|---|---|
| **A** (`relanceCandidatsInactifs`) | inactif J+7 **ET a ≥1 spontanée** | relance générique |
| **B** (`relanceIncitationSpontanee`) | inactif J+7 **ET 0 spontanée** | incitation spontanée, CTA `scrollToRecruteursLba=true` |

Les deux listes sont **disjointes par construction** → un candidat tombe dans exactement une → un seul mail par épisode d'inactivité, sans règle de fréquence globale.

Seul `job_origin = recruteurs_lba` compte comme « spontanée ». Les candidatures sur offres LBA **et** partenaires sont « non spontanées » → éligibles à la liste B.

Cap : **une fois par liste** (chaque liste a son propre type de log, `RELANCE_INACTIVITE` / `RELANCE_INCITATION_SPONTANEE` dans [applicant-email-log.model.ts](../shared/src/models/applicant-email-log.model.ts)). Flow autorisé : un candidat reçoit B, fait enfin une spontanée, redevient inactif → il peut plus tard recevoir A. Jamais deux fois la même liste.

## Fonctionnement

Code : [relance-incitation-spontanee.ts](../server/src/jobs/applications/relance-incitation-spontanee.ts), cron `10 7 * * *`, production uniquement ([jobs.ts](../server/src/jobs/jobs.ts)).

1. Sélectionne les inactifs J+7 (même fenêtre que la liste A) **sans aucune candidature spontanée**.
2. Exclut ceux déjà relancés sur cette liste (log `RELANCE_INCITATION_SPONTANEE`).
3. Construit le lien de recherche via le helper partagé [relance-search-url.ts](../server/src/jobs/applications/relance-search-url.ts) (`buildTaggedSearchUrl`), avec `scrollToRecruteursLba=true` pour scroller vers les entreprises de l'algorithme.
4. Écrit le log **avant** l'envoi, puis pousse `EMAIL / PRENOM / LIEN_RECHERCHE / METIER` dans la liste Brevo B. Échec Brevo → alerte Slack.

## Configuration

- `LBA_BREVO_RELANCE_SPONTANEE_LIST_ID` (→ `config.smtp.brevoRelanceSpontaneeListId`) : ID de la liste Brevo B, dans les secrets SOPS. **Garde-fou** : tant que la variable est absente, le job ne fait rien.

## Tests

```bash
yarn test run server/src/jobs/applications/relance-incitation-spontanee.test.ts
```

Unitaires sur `buildTaggedSearchUrl` (ajout conditionnel de `scrollToRecruteursLba=true` + utm) + intégration (MongoDB réelle, Brevo/Slack mockés) : push des inactifs sans spontanée vers la liste B, exclusion de ceux ayant une spontanée (liste A) et des déjà-relancés.
