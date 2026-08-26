# Relance des candidats inactifs (liste A, J+7)

Job cron quotidien qui alimente une liste Brevo de candidats à relancer. Objectif métier : réengager les futurs apprentis qui ont candidaté une fois à leur arrivée sur LBA puis ne sont jamais revenus.

Le contenu et l'envoi de l'email sont pilotés côté Brevo par l'équipe growth (template + automation). Le back-end se limite à pousser les bons candidats et les données de personnalisation dans la liste.

Ce dispositif fonctionne en tandem avec l'[incitation aux candidatures spontanées](./relance-incitation-spontanee.md) (liste B) : les deux populations sont disjointes par construction.

## Fonctionnement

Code : [relance-candidats-inactifs.ts](../server/src/jobs/applications/relance-candidats-inactifs.ts), cron `0 7 * * *`, production uniquement ([jobs.ts](../server/src/jobs/jobs.ts)).

1. Sélectionne les candidats dont la **dernière candidature tombe sur le jour calendaire d'il y a 7 jours** (`Europe/Paris`) et qui n'ont pas re-candidaté depuis. S'appuie sur `applicants.last_connection` (mis à jour à chaque candidature par `getOrCreateApplicant`). Fenêtre = `[début du jour J-7, début du jour J-6)` — tranche de 24 h, chaque candidat n'est ciblé qu'une fois.
2. Ne garde que les inactifs ayant **au moins une candidature spontanée** (`job_origin = recruteurs_lba`) — les autres relèvent de la liste B.
3. Exclut les candidats **déjà relancés** (log `RELANCE_INACTIVITE` dans `applicants_email_logs`).
4. Pour chaque candidat, reconstruit un **lien de recherche personnalisé** à partir de `applications.application_url` (l'URL exacte de sa recherche au moment de postuler), via le helper partagé [relance-search-url.ts](../server/src/jobs/applications/relance-search-url.ts).
5. **Écrit d'abord le log `RELANCE_INACTIVITE`**, puis pousse `EMAIL / PRENOM / LIEN_RECHERCHE / METIER` dans la liste marketing Brevo via `uploadContactListToBrevo("MARKETING", …)`. L'ordre log-avant-envoi garantit le cap d'**une seule relance** même en cas de crash entre les deux (on préfère rater une relance qu'en envoyer deux). Un échec Brevo déclenche une alerte Slack.

### Personnalisation et fallback (2 templates côté Brevo)

- **CTA personnalisé** : si `application_url` donne une recherche exploitable (au moins un `romes`/`rncp`), `LIEN_RECHERCHE` contient un lien `/recherche?…` rejouant la propre recherche du candidat (métier + lieu exacts).
- **CTA générique** : sinon (`application_url` absent — candidatures API/widget/partenaires — ou sans métier), `LIEN_RECHERCHE` est **vide**.

Côté Brevo, growth segmente sur la présence de `LIEN_RECHERCHE` : rempli → template personnalisé, vide → template générique. Une seule liste est poussée.

## Configuration

- `LBA_BREVO_RELANCE_CANDIDATS_LIST_ID` (→ `config.smtp.brevoRelanceCandidatsListId`) : ID de la liste Brevo, dans les secrets SOPS. **Garde-fou** : tant que la variable est absente, le job logue un warning et ne fait rien.
- Index dédiés : `applicants_email_logs { applicant_id: 1, type: 1 }` et `applicants { last_connection: 1 }`.

## Tests

```bash
yarn test run server/src/jobs/applications/relance-candidats-inactifs.test.ts
```

Unitaires sur la construction d'URL (réécriture `/emploi/…` → `/recherche`, gestion des `utm_*`, retour `null` si pas de métier exploitable) + intégration (MongoDB réelle, Brevo/Slack mockés) : push de la fenêtre J+7, exclusion des hors-fenêtre et des déjà-relancés, `LIEN_RECHERCHE` vide en fallback.
