# Guide de modération OPCO

Page `/espace-pro/opco/guide-de-moderation`, réservée aux utilisateurs OPCO. Son texte est à usage restreint et ce dépôt est public : il n'est pas versionné ici, il est lu dans Notion à chaque requête.

## Où vit le contenu

- Page Notion « Guide de modération des comptes et des offres (espace OPCO) », sous « Contenus web ». Son identifiant est `OPCO_GUIDE_NOTION_PAGE_ID` (`fetch-opco-guide.ts`).
- La page reste **privée** : ne jamais la publier sur le web. Elle est lue par l'API Notion officielle avec le jeton d'une intégration, et non par `fetch-notion-page.ts`, qui ne lit que les pages publiques.
- Le site garde le contenu 15 minutes en cache, par processus. Passé ce délai, la visite suivante reçoit encore l'ancienne version et déclenche la relecture : une modification dans Notion apparaît à la visite d'après, sans déploiement.

## Règles de rédaction dans Notion

- Les sections sont des titres de niveau 2 numérotés dans l'ordre : `1. …`, `2. …`, jusqu'à `7. …`. Le site rattache chaque numéro à une ancre (`#guide-comptes` pour la 3, `#guide-analyse` pour la 5…), liée depuis les pages Entreprises et Offres en modération. Un titre manquant, en trop ou mal numéroté fait refuser toute la page : le site affiche alors les sections vides.
- Ce qui précède le premier titre (chapeau, bandeau, date de version) s'affiche en introduction. Le sommaire Notion est ignoré, le site a le sien.
- Le premier séparateur (`---`) clôt le guide. La conclusion et le bouton « Vérifier les comptes en attente » sont dans le code.
- Blocs rendus : paragraphe, titre de niveau 3, listes, encadré, bloc dépliable, citation, colonnes, tableau, séparateur, vidéo déposée dans Notion. Les autres (image, vidéo par lien externe, sous-page…) ne s'affichent pas et sont signalés à Sentry.
- Liens : seuls les liens `https` vers un autre site et les adresses de La bonne alternance restent cliquables. Les liens vers Notion et les adresses d'exemple (« emxxx@xxx.fr ») s'affichent en texte simple.

## Vidéo

- Un fichier vidéo déposé dans la page Notion s'affiche dans un lecteur, avec sa légende Notion et le lien « Ouvrir la vidéo dans un nouvel onglet ». Une vidéo intégrée par lien (YouTube, Vimeo…) n'est pas affichée : elle sortirait de l'espace réservé aux OPCO.
- Le fichier passe par la route `/espace-pro/opco/guide-de-moderation/video/<bloc>` (`video/[blockId]/route.ts`) : session OPCO obligatoire, seuls les blocs vidéo du guide sont servis. Le lien Notion du fichier ouvre la vidéo sans authentification pendant une heure : il reste côté serveur et il est renouvelé avant son expiration.
- Accessibilité : il faut des sous-titres et une transcription. La transcription peut être un bloc dépliable sous la vidéo ; les sous-titres (`.vtt`) ne sont pas encore pris en charge.

## Jeton

`LBA_NOTION_API_TOKEN`, dans le fichier sops commun à tous les environnements (`.infra/env.global.yml`), passé à l'UI par `.infra/.env_ui`. L'intégration Notion n'a accès qu'à cette page.

Sans jeton, ou si l'API Notion échoue, la page affiche ses sections vides avec « Contenu momentanément indisponible » et un warning Sentry (« Guide de modération OPCO : … »). Après un premier chargement réussi, le site sert la dernière version connue pendant 7 jours au plus quand Notion est indisponible.
