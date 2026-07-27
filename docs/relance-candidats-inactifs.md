# Relance des candidats inactifs (J+7) — note pour la relecture de la PR

> Document à l'intention du·de la développeur·euse qui relit et finalise cette PR.

## Pourquoi

Objectif métier (growth) : **réengager les futurs apprentis qui ont candidaté une fois à leur arrivée sur LBA puis ne sont jamais revenus.**

Séquence cible :
- **J+0** : le jeune fait une (ou plusieurs) candidature.
- **J+7** : s'il n'a fait **aucune nouvelle candidature** depuis, on lui envoie **un** email de relance l'invitant à reprendre sa recherche.

Contrainte produit : **une seule relance** par candidat (pas de J+14).

Le contenu et l'envoi de l'email sont **pilotés côté Brevo** par l'équipe growth (template + automation). Le rôle du back-end se limite à **alimenter une liste Brevo dédiée** avec les bons candidats et les bonnes données de personnalisation. C'est le même principe que le job existant `exportRecrutersToBrevo` — dont ce job est très largement calqué.

## Comment (l'approche)

Un **job cron quotidien** :

1. Sélectionne les candidats dont la **dernière candidature tombe sur le jour calendaire d'il y a 7 jours (heure de Paris)** et qui n'ont pas re-candidaté depuis. On s'appuie sur `applicants.last_connection`, qui vaut la date de la dernière candidature (mis à jour à chaque candidature par `getOrCreateApplicant`). Fenêtre = `[début du jour J-7, début du jour J-6)` en `Europe/Paris` (via `dayjs().tz(...)`) — tranche de 24 h, le cron tourne chaque jour, donc chaque candidat n'est ciblé qu'une fois.
2. Exclut les candidats **déjà relancés** (log `RELANCE_INACTIVITE` dans `applicants_email_logs`).
3. Pour chaque candidat, récupère sa **dernière candidature** et reconstruit un **lien de recherche personnalisé** à partir de `applications.application_url` (l'URL exacte de sa recherche au moment de postuler : `romes`, `lat/lon`, `address` déjà présents). Voir `buildRelanceSearchUrl`.
4. **Écrit d'abord un log `RELANCE_INACTIVITE` par candidat**, PUIS pousse `EMAIL / PRENOM / LIEN_RECHERCHE / METIER` dans la **liste marketing Brevo dédiée** via `uploadContactListToBrevo("MARKETING", …)`. L'ordre log-avant-envoi garantit le cap d'**une seule relance** même en cas de crash entre les deux (on préfère rater une relance que d'en envoyer deux). Un échec Brevo déclenche une alerte Slack.

### Personnalisation & fallback (2 templates côté Brevo)

- **CTA personnalisé** : si `application_url` donne une recherche exploitable (au moins un `romes`/`rncp`), `LIEN_RECHERCHE` contient un lien `/recherche?…` rejouant la propre recherche du candidat (métier + lieu exacts).
- **CTA générique** : sinon (`application_url` absent — candidatures API/widget/partenaires — ou sans métier), `LIEN_RECHERCHE` est **vide**.

Côté Brevo, l'équipe growth segmente sur la présence de `LIEN_RECHERCHE` : rempli → template personnalisé, vide → template générique. Une seule liste est poussée.

## Les modifications

| Fichier | Nature | Détail |
|---|---|---|
| `shared/src/models/applicantEmailLog.model.ts` | modif | Ajout de `EMAIL_LOG_TYPE.RELANCE_INACTIVITE` (distinct de `RELANCE`, déjà utilisé pour les intentions recruteur) + index `{ applicant_id: 1, type: 1 }`. |
| `shared/src/models/applicant.model.ts` | modif | Ajout de l'index `{ last_connection: 1 }`. |
| `server/src/migrations/20260709120000-add-relance-candidats-indexes.ts` | **création** | Migration `recreateIndexes()` pour créer les 2 index ci-dessus (même pattern que `20260218174124-update-indexes.ts`). |
| `server/src/config.ts` | modif | Ajout de `config.smtp.brevoRelanceCandidatsListId` (env `LBA_BREVO_RELANCE_CANDIDATS_LIST_ID`, optionnelle). |
| `server/.env.test` | modif | `LBA_BREVO_RELANCE_CANDIDATS_LIST_ID=999` (pour les tests). |
| `.infra/.env_server` | modif | Placeholder `{{ LBA_BREVO_RELANCE_CANDIDATS_LIST_ID }}`. |
| `server/src/jobs/applications/relanceCandidatsInactifs.ts` | **création** | Le job : `buildRelanceSearchUrl` + `relanceCandidatsInactifs`. |
| `server/src/jobs/applications/relanceCandidatsInactifs.test.ts` | **création** | Tests unitaires + intégration. |
| `server/src/jobs/jobs.ts` | modif | Import + entrée cron `"0 7 * * *"`. |

### À faire avant que la campagne tourne (hors code)

1. **Growth (Hugo)** : créer la **liste Brevo dédiée** + les 2 templates (perso / générique) et l'automation. Attributs disponibles : `EMAIL`, `PRENOM`, `LIEN_RECHERCHE`, `METIER`.
2. **Ops** : renseigner la vraie valeur `LBA_BREVO_RELANCE_CANDIDATS_LIST_ID` (ID numérique de la liste) dans les secrets **SOPS** (`.infra/env.production.yml`, recette, preview).

> Garde-fou : tant que `LBA_BREVO_RELANCE_CANDIDATS_LIST_ID` est absente, le job logue un warning et ne fait rien. La PR est donc mergeable avant que Brevo soit prêt, sans risque d'envoi prématuré.

## Les plans de test

Tests dans `server/src/jobs/applications/relanceCandidatsInactifs.test.ts` (Vitest, `yarn test run server/src/jobs/applications/relanceCandidatsInactifs.test.ts`).

**Unitaires — `buildRelanceSearchUrl` (pure, sans base) :**
- réécrit et re-tague une URL de recherche exploitable (conserve `romes`/`address`, force les `utm_*`) ;
- réécrit un pathname `/emploi/…` → `/recherche` ;
- retourne `null` si aucun métier (`romes`/`rncp`) exploitable ;
- retourne `null` pour une URL absente / invalide ;
- retire aussi `utm_content` / `utm_term` capturés dans l'URL d'origine.

**Intégration — `relanceCandidatsInactifs` (MongoDB réelle, Brevo & Slack mockés) :**
- pousse les candidats de la fenêtre J+7 vers Brevo (bon compte, bonne liste, `EMAIL/PRENOM/METIER/LIEN_RECHERCHE`) **et** écrit le log `RELANCE_INACTIVITE` ;
- **exclut** les candidats hors fenêtre (trop récents) **et** ceux déjà relancés (log existant) → aucun push ;
- laisse `LIEN_RECHERCHE` **vide** quand l'URL n'est pas exploitable (CTA générique).

Statut : **8/8 verts** en local. `yarn typecheck` et `biome check` passent.

## Suite à la review de @kevbarns (traitée)

1. **Index** — ajout des index `applicants_email_logs { applicant_id: 1, type: 1 }` (lu par le `$lookup`) et `applicants { last_connection: 1 }` (le `$match`), déclarés sur les modèles + migration `recreateIndexes()`.
2. **Atomicité** — le log est désormais écrit **avant** l'envoi Brevo, ce qui garantit le cap « une seule relance » même en cas de crash ; un échec Brevo alerte sur Slack.
3. **UTM** — `buildRelanceSearchUrl` retire aussi `utm_content` / `utm_term`.
4. **Fuseau horaire** — tranché : fenêtre calculée en `Europe/Paris` (jour calendaire J-7), plus en UTC.

## Points restants à valider par le·la relecteur·euse

1. **`notifyToSlack`** — un ping Slack récapitulatif est envoyé en fin de job (calqué sur les autres exports Brevo). À garder/retirer selon la convention souhaitée.
2. **Fixtures de test** — les données de test s'appuient sur `generateApplicantFixture` / `generateApplicationFixture` (`shared/src/fixtures/application.fixture.ts`).
