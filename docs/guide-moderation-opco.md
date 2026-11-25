# Guide de modération OPCO

Page `/espace-pro/opco/guide-de-moderation`, réservée aux utilisateurs OPCO. Son texte est à usage restreint et ce dépôt est public : il n'est pas versionné ici, il est lu dans Notion à chaque requête.

## Où vit le contenu

- Page Notion « Guide de modération des comptes et des offres (espace OPCO) », sous « Contenus web ». Son identifiant est `OPCO_GUIDE_NOTION_PAGE_ID` (`fetch-opco-guide.ts`).
- La page reste **privée** : ne jamais la publier sur le web. Elle est lue par l'API Notion officielle avec le jeton d'une intégration, et non par `fetch-notion-page.ts`, qui ne lit que les pages publiques.
- Le site met le contenu en cache 15 minutes. Une modification dans Notion apparaît donc au plus tard 15 minutes après, sans déploiement.

## Règles de rédaction dans Notion

- Les sections sont des titres de niveau 2 numérotés dans l'ordre : `1. …`, `2. …`, jusqu'à `7. …`. Le site rattache chaque numéro à une ancre (`#guide-comptes` pour la 3, `#guide-analyse` pour la 5…), liée depuis les pages Entreprises et Offres en modération. Un titre manquant, en trop ou mal numéroté fait refuser toute la page : le site affiche alors les sections vides.
- Ce qui précède le premier titre (chapeau, bandeau, date de version) s'affiche en introduction. Le sommaire Notion est ignoré, le site a le sien.
- Le premier séparateur (`---`) clôt le guide. La conclusion et le bouton « Vérifier les comptes en attente » sont dans le code.
- Blocs rendus : paragraphe, titre de niveau 3, listes, encadré, bloc dépliable, citation, colonnes, tableau, séparateur. Les autres (image, vidéo, sous-page…) ne s'affichent pas et sont signalés à Sentry.
- Liens : seuls les liens `https` vers un autre site et les adresses de La bonne alternance restent cliquables. Les liens vers Notion et les adresses d'exemple (« emxxx@xxx.fr ») s'affichent en texte simple.

## Jeton

`LBA_NOTION_API_TOKEN`, dans le fichier sops de chaque environnement (`.infra/env.<env>.yml`), passé à l'UI par `.infra/.env_ui`. L'intégration Notion n'a accès qu'à cette page.

Sans jeton, ou si l'API Notion échoue, la page affiche ses sections vides avec « Contenu momentanément indisponible » et un warning Sentry (« Guide de modération OPCO : … »). Après un premier chargement réussi, le site sert la dernière version connue pendant 7 jours au plus quand Notion est indisponible.
