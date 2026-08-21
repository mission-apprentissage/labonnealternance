# Nurturing des entreprises dormantes (anniversaire du dépôt d'offre)

Troisième dispositif de relance Brevo, calqué sur les boucles candidats ([relance inactifs](./relance-candidats-inactifs.md) / [incitation spontanée](./relance-incitation-spontanee.md)).

Les entreprises qui ont déposé une offre d'alternance ont un besoin **annuel** (rentrée de septembre). Beaucoup ne reviennent pas l'année suivante. Le job les relance **à l'anniversaire du dépôt de leur dernière offre, un mois avant la date pile (J+330)** — au moment où elles re-planifient leur recrutement — via une liste Brevo dédiée (template + automation pilotés par growth).

Le dispositif complet a deux briques :

- **Stock** (entreprises dont l'anniversaire était déjà passé au déploiement) : campagne manuelle dans Brevo par growth, en segmentant sur `LAST_ACTION_DATE` (exposé par l'export Brevo, issue 4977), en excluant la liste de ce job pour éviter les doubles envois.
- **Flux** : ce job cron quotidien.

## Fonctionnement

Code : [nurturing-entreprises.ts](../server/src/jobs/recruiters/nurturing-entreprises.ts), cron `0 8 * * *`, production uniquement ([jobs.ts](../server/src/jobs/jobs.ts)).

Chaque jour, le job cible les offres LBA (`jobs_partners`, `partner_label = offres_emploi_lba`, `managed_by ≠ null`) créées **il y a exactement 330 jours** (jour calendaire, `Europe/Paris`) :

1. **Règle d'août** : les déclenchements tombant en août (mois creux) sont **reportés au 1ᵉʳ septembre** — le job ne fait rien en août, et le 1ᵉʳ septembre sa fenêtre s'élargit pour rattraper les cohortes d'août.
2. Une seule offre pivot par entreprise (la plus récente dans la fenêtre, `$group` par `managed_by`).
3. **Exclusions** (l'entreprise n'est pas dormante) : offre plus récente que le pivot, offre encore `ACTIVE` non expirée, ou nurturing déjà envoyé sur le cycle (< 330 j) — cap **une relance par an**.
4. Contact via `rolemanagement360` : uniquement `role_authorized_type = ENTREPRISE`, `role_last_status = GRANTED`, `user_last_status = ACTIF` (exclut CFA, comptes désactivés et anonymisés). La vue est régénérée 3×/jour ; à 8h elle est fraîche de la veille 17h — acceptable pour du nurturing.
5. **Marque l'offre pivot** (`relance_mail_nurturing = now`, champ de [jobs-partners.model.ts](../shared/src/models/jobs-partners.model.ts)) **avant** l'envoi (en cas de crash : on préfère rater une relance qu'en envoyer deux), puis pousse vers la liste Brevo marketing dédiée. Alerte Slack en cas d'échec/succès.

Attributs poussés : `EMAIL`, `PRENOM`, `RAISON_SOCIALE`, `METIER` (titre de la dernière offre), `DATE_DERNIERE_OFFRE`.

## Configuration

- `LBA_BREVO_NURTURING_ENTREPRISES_LIST_ID` (→ `config.smtp.brevoNurturingEntreprisesListId`) : ID de la liste Brevo (liste `nurturing-entreprises-plus-d'un-an`, compte Brevo Marketing), dans les secrets SOPS production. **Garde-fou** : job inactif si absente.
- Côté Brevo : template + automation sur la liste (déclencheur : ajout à la liste, entrée unique).
- Le `$match` initial porte sur `offer_creation` (indexée) + `partner_label` — volumétrie d'une tranche de 24 h, pas d'index supplémentaire requis. `relance_mail_nurturing` n'a pas d'index dédié (lookup par `managed_by`, déjà indexé).

## Tests

```bash
yarn test run server/src/jobs/recruiters/nurturing-entreprises.test.ts
```

Tests d'intégration (MongoDB réelle, Brevo/Slack mockés) : push de l'entreprise dormante à J+330 et marquage de l'offre pivot ; exclusions (offre plus récente, offre encore active, CFA, compte désactivé, pivot déjà marqué) ; règle d'août (rien en août, rattrapage des anniversaires d'août au 1ᵉʳ septembre).
