# Incitation aux candidatures spontanées (liste B, J+7) — note pour la relecture de la PR

> Document à l'intention du·de la développeur·euse qui relit et finalise cette PR.
> **Dépendance** : cette PR est **empilée sur la PR de la relance des candidats inactifs** (« liste A »). Elle la modifie légèrement (voir ci-dessous) et doit être mergée **après** elle.

## Pourquoi

Second segment de relance, complémentaire de la relance des inactifs :

- **Liste A** (relance des inactifs, PR précédente) : un jeune inactif depuis 7 jours reçoit « revenez / nouvelles offres ».
- **Liste B** (cette PR) : un jeune inactif depuis 7 jours **qui n'a jamais fait de candidature spontanée** reçoit un message l'incitant à candidater spontanément (auprès des entreprises exposées par l'algorithme, `recruteurs_lba`).

But produit : pousser vers les candidatures spontanées les candidats qui ne connaissent que les offres publiées.

## Comment — un découpage DISJOINT

Même déclencheur pour les deux listes : **J+7** (jour calendaire J-7, `Europe/Paris`). Au moment du run, la population des inactifs est partitionnée par un seul critère — « a déjà fait une candidature spontanée (`job_origin = recruteurs_lba`) ou non » :

| Liste | Cible | Message |
|---|---|---|
| **A** (`relanceCandidatsInactifs`) | inactif J+7 **ET a ≥1 spontanée** | relance générique |
| **B** (`relanceIncitationSpontanee`) | inactif J+7 **ET 0 spontanée** | incitation spontanée, CTA `scrollToRecruteursLba=true` |

**Les deux listes sont disjointes par construction** → un candidat tombe dans **exactement une** → **un seul mail par épisode d'inactivité**, sans règle de fréquence globale.

Seul `job_origin = recruteurs_lba` compte comme « spontanée ». Les candidatures sur offres LBA **et** partenaires sont « non spontanées » → éligibles à la liste B.

Cap : **une fois par liste** (chaque liste a son propre type de log). Le flow autorisé : un candidat reçoit B, fait enfin une spontanée, redevient inactif → il peut plus tard recevoir A. Jamais deux fois la même liste.

## Les modifications

| Fichier | Nature | Détail |
|---|---|---|
| `server/src/jobs/applications/relanceSearchUrl.ts` | **création** | Helper partagé `buildTaggedSearchUrl(url, { utmCampaign, highlightRecruteursLba })` (extrait de la boucle A, DRY). |
| `server/src/jobs/applications/relanceCandidatsInactifs.ts` | modif | Utilise le helper partagé ; **resserré** : ne cible plus que les inactifs ayant ≥1 spontanée (`$lookup` sur `recruteurs_lba`). |
| `server/src/jobs/applications/relanceIncitationSpontanee.ts` | **création** | Le job liste B : inactifs J+7 sans spontanée, CTA `scrollToRecruteursLba=true`, log `RELANCE_INCITATION_SPONTANEE`. |
| `server/src/jobs/applications/relanceIncitationSpontanee.test.ts` | **création** | Tests unitaires (helper) + intégration. |
| `shared/src/models/applicantEmailLog.model.ts` | modif | Ajout de `EMAIL_LOG_TYPE.RELANCE_INCITATION_SPONTANEE`. |
| `server/src/config.ts` | modif | Ajout de `config.smtp.brevoRelanceSpontaneeListId` (env `LBA_BREVO_RELANCE_SPONTANEE_LIST_ID`, optionnelle). |
| `server/.env.test` / `.infra/.env_server` | modif | Valeur de test / placeholder. |
| `server/src/jobs/jobs.ts` | modif | Cron `10 7 * * *`, **scopé production uniquement** (`config.env === "production" ? … : async () => Promise.resolve(0)`). |

### À faire avant que la campagne tourne (hors code)

1. **Growth** : créer la **liste Brevo B dédiée** + le template « incitation spontanée » + l'automation. Attributs : `EMAIL`, `PRENOM`, `LIEN_RECHERCHE`, `METIER`.
2. **Ops** : renseigner `LBA_BREVO_RELANCE_SPONTANEE_LIST_ID` (ID de la liste B) dans SOPS. Tant qu'absent, le job ne fait rien (garde-fou).

## Les plans de test

`yarn test run server/src/jobs/applications/relanceIncitationSpontanee.test.ts` (+ la boucle A conserve ses tests, dont un nouveau cas « exclut les inactifs sans spontanée »).

**Unitaires — `buildTaggedSearchUrl` :**
- ajoute `scrollToRecruteursLba=true` + l'utm demandé quand `highlightRecruteursLba` ;
- ne l'ajoute pas sinon.

**Intégration — `relanceIncitationSpontanee` (MongoDB réelle, Brevo & Slack mockés) :**
- pousse les inactifs J+7 **sans** spontanée vers la liste B, CTA `scrollToRecruteursLba=true`, et logue `RELANCE_INCITATION_SPONTANEE` ;
- **exclut** les inactifs ayant déjà fait une spontanée (ils relèvent de la liste A) ;
- **exclut** ceux déjà relancés sur cette liste.

Statut : **14/14 verts** (boucles A + B), typecheck + biome OK.

## Points à valider par le·la relecteur·euse

1. **`notifyToSlack`** — ping récapitulatif en fin de job (cohérent avec la boucle A).
2. **Ordre de merge** — après la PR de la boucle A (dont dépend le resserrage de `relanceCandidatsInactifs`).
