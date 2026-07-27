# Nurturing des entreprises dormantes (anniversaire du dépôt d'offre) — note pour la relecture de la PR

> Document à l'intention du·de la développeur·euse qui relit et finalise cette PR.
> Troisième dispositif de relance Brevo, calqué sur les boucles candidats (relance inactifs / incitation spontanée) et sur les exports Brevo existants.

## Pourquoi

Les entreprises qui ont déposé une offre d'alternance ont un besoin **annuel** (rentrée de septembre). Beaucoup ne reviennent pas l'année suivante. Objectif : les relancer **à l'anniversaire du dépôt de leur dernière offre, un mois avant la date pile (J+330)** — au moment où elles re-planifient leur recrutement — via une liste Brevo dédiée (template + automation pilotés par growth).

Le dispositif complet se fait en deux briques :
- **Stock** (entreprises dont l'anniversaire est déjà passé au déploiement) : campagne manuelle dans Brevo par growth, en segmentant sur `LAST_ACTION_DATE` (exposé par la PR « export Brevo » liée à l'issue 4977), **en excluant la liste de ce job** pour éviter les doubles envois.
- **Flux** (cette PR) : job cron quotidien.

## Comment

Chaque jour (cron `0 8 * * *`, **production uniquement**), le job cible les offres LBA (`jobs_partners`, `partner_label = offres_emploi_lba`, `managed_by ≠ null`) créées **il y a exactement 330 jours** (jour calendaire, `Europe/Paris`) :

1. **Règle d'août** : les déclenchements tombant en août (mois creux) sont **reportés au 1ᵉʳ septembre** — le job ne fait rien en août, et le 1ᵉʳ septembre sa fenêtre s'élargit pour rattraper les cohortes d'août.
2. Une seule offre pivot par entreprise (la plus récente dans la fenêtre, `$group` par `managed_by`).
3. **Exclusions** (l'entreprise n'est pas dormante) : offre plus récente que le pivot, offre encore `ACTIVE` non expirée, ou nurturing déjà envoyé sur le cycle (< 330 j) — cap **une relance par an**.
4. Contact via `rolemanagement360` : uniquement `role_authorized_type = ENTREPRISE`, `role_last_status = GRANTED`, `user_last_status = ACTIF` (exclut CFA, comptes désactivés et anonymisés).
5. **Marque l'offre pivot** (`relance_mail_nurturing = now`) **avant** l'envoi (en cas de crash : on préfère rater une relance qu'en envoyer deux), puis pousse vers la liste Brevo marketing dédiée. Slack en cas d'échec/succès.

Attributs poussés : `EMAIL`, `PRENOM`, `RAISON_SOCIALE`, `METIER` (titre de la dernière offre), `DATE_DERNIERE_OFFRE`.

## Les modifications

| Fichier | Nature | Détail |
|---|---|---|
| `shared/src/models/jobsPartners.model.ts` | modif | Champ `relance_mail_nurturing` (même pattern que `relance_mail_expiration_J7/J1`). |
| `server/src/config.ts` | modif | `config.smtp.brevoNurturingEntreprisesListId` (env `LBA_BREVO_NURTURING_ENTREPRISES_LIST_ID`, optionnelle — garde-fou : job inactif si absente). |
| `server/.env.test` / `.infra/.env_server` | modif | Valeur de test (997) / placeholder. |
| `server/src/jobs/recruiters/nurturingEntreprises.ts` | **création** | Le job. |
| `server/src/jobs/recruiters/nurturingEntreprises.test.ts` | **création** | 7 tests d'intégration. |
| `server/src/jobs/jobs.ts` | modif | Cron `0 8 * * *`, scopé production. |

### À faire avant que la campagne tourne (hors code)

1. **Ops** : `LBA_BREVO_NURTURING_ENTREPRISES_LIST_ID: 741` dans SOPS production (liste `nurturing-entreprises-plus-d'un-an`, compte Brevo Marketing).
2. **Growth** : template + automation Brevo sur la liste 741 (déclencheur : ajout à la liste, entrée unique).

## Les plans de test

`yarn test run server/src/jobs/recruiters/nurturingEntreprises.test.ts` — 7 tests (MongoDB réelle, Brevo/Slack mockés) :
- pousse l'entreprise dormante à J+330 et marque l'offre pivot ;
- exclut : offre plus récente / offre encore active / CFA / compte désactivé / pivot déjà marqué ;
- **règle d'août** : rien en août ; rattrapage des anniversaires d'août au 1ᵉʳ septembre.

Statut : 7/7 verts, `yarn typecheck` + `biome check` OK.

## Points à valider par le·la relecteur·euse

1. Le `$match` initial porte sur `offer_creation` (indexée) + `partner_label` — volumétrie d'une tranche de 24 h, pas d'index supplémentaire requis a priori.
2. La dépendance à `rolemanagement360` (régénérée 3×/jour) : le job tourne à 8h, la vue est fraîche de la veille 17h — acceptable pour du nurturing.
3. `relance_mail_nurturing` est ajouté au modèle mais pas d'index dédié (lookup par `managed_by`, déjà indexé).
