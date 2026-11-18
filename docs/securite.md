# Securité

## Secrets

Les secrets ne **doivent** jamais être embarqués en clair dans une transaction Git du dépôt. Dans le cas, où cela arriverait veuillez en informer l'équipe dans les plus brefs délais.

Les secrets sont chiffrés avec **SOPS** et **GnuPG**. Veuillez consulter la doc [Gestion des secrets](./infrastructure/manage.md#gestion-des-secrets)

### Clés des jetons de recherche

`LBA_SEARCH_TOKEN_KEYS` (vault de chaque environnement, lu par le serveur et l'UI) signe les jetons de recherche du site et les défis ALTCHA (cf. `shared/utils/search-token.ts`). Format : `k2:<base64>,k1:<base64>`, au moins 32 octets par clé ; la première signe, toutes vérifient.

Rotation, sans coupure :

1. `yarn vault:edit` : ajouter la nouvelle clé en 2e position (`k1:<ancienne>,k2:<nouvelle>`), déployer ;
2. la passer en 1re position (`k2:<nouvelle>,k1:<ancienne>`), déployer ;
3. au moins 2 h plus tard (durée de vie maximale d'un jeton), retirer l'ancienne, déployer.

Clé générée par `openssl rand -base64 32`.

## Fail2Ban

> TODO: See infra
