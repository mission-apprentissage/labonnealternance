# Nurturing des entreprises désinscrites « déjà trouvé nos alternants »

Une entreprise « algo » (recruteurs LBA) qui se désinscrit avec le motif **« Nous avons déjà trouvé nos alternants pour l'année en cours »** n'exprime pas un refus du service : son besoin est satisfait *cette année*. Le job la relance **une fois, 9 mois après sa désinscription**, soit environ 3 mois avant le renouvellement du contrat de ses apprentis, via une liste Brevo dédiée (template + automation pilotés par growth).

Les autres motifs (opposition au traitement des données, entreprise fermée, ne recrute pas en alternance…) ne sont **jamais** relancés.

## Données

La désinscription ([unsubscribe-recruteur-lba.service.ts](../server/src/services/unsubscribe-recruteur-lba.service.ts)) copie l'établissement dans `unsubscribedrecruteurslba`. Pour le seul motif « déjà trouvé », elle y conserve aussi l'e-mail (`email`) : c'est la minimisation des données, la ligne `jobs_partners` qui le portait étant supprimée. Les motifs sont la constante `UNSUBSCRIBE_REASONS` ([unsubscribe.ts](../shared/src/constants/unsubscribe.ts)) ; les valeurs en base sont les libellés affichés dans le formulaire.

Les désinscriptions antérieures à ce dispositif n'ont pas d'e-mail et ne sont pas relancées par le job : le **stock** est traité en campagne manuelle par growth, en excluant la liste du job.

## Fonctionnement

Code : [nurturing-desinscrits.ts](../server/src/jobs/recruiters/nurturing-desinscrits.ts), cron `5 8 * * *`, production uniquement ([jobs.ts](../server/src/jobs/jobs.ts)).

Chaque jour, le job cible les désinscriptions « déjà trouvé » survenues **il y a exactement 9 mois** (jour calendaire, `Europe/Paris`) :

1. **Règle d'août** : le job ne fait rien en août, et le 1ᵉʳ septembre sa fenêtre s'élargit de 31 jours pour rattraper les cohortes d'août (même règle que le [nurturing des entreprises dormantes](./nurturing-entreprises.md)).
2. Sélection : motif `DEJA_TROUVE`, `email` renseigné, `relance_nurturing_date` vide.
3. Exclusion des adresses de la collection `emailblacklists`.
4. **Un mail par adresse** : les établissements qui partagent une adresse sont regroupés.
5. **Marquage avant l'envoi** (`relance_nurturing_date = now`, sur tous les établissements de l'adresse, y compris ceux dont l'échéance tombe un autre jour) : en cas de crash, on préfère rater une relance qu'en envoyer deux.
6. Envoi vers la liste Brevo, puis **effacement de l'e-mail** (`email = null`). Si Brevo échoue, l'e-mail est conservé pour permettre une relance manuelle depuis un export, et une alerte Slack est envoyée.

Attributs poussés : `EMAIL`, `RAISON_SOCIALE`, `DATE_DESINSCRIPTION`. Pas de `PRENOM` : les entreprises algo n'ont pas de contact nominatif.

## Configuration

- `LBA_BREVO_NURTURING_DESINSCRITS_LIST_ID` (→ `config.brevo.listIds.nurturingDesinscrits`) : ID de la liste Brevo. **Garde-fou** : job inactif si absente. À ajouter dans les secrets SOPS **et** dans le template `.infra/.env_server`.
- Côté Brevo : template + automation sur la liste (déclencheur : ajout à la liste, entrée unique). L'appel à l'action est le dépôt d'offre, `/espace-pro/creation/entreprise` avec `utm_campaign=nurturing-desinscrits`.
- Le délai (9 mois) est la constante `NURTURING_MONTHS`.

## Tests

```bash
yarn test run server/src/jobs/recruiters/nurturing-desinscrits.test.ts
```
