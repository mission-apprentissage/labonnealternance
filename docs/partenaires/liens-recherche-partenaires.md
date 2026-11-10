# Liens de recherche partenaires

Un partenaire renvoie ses usagers vers une recherche d'offres La bonne alternance avec une URL courte, construite à partir d'un code qu'il connaît (RNCP pour Mon Master). LBA traduit ce code en recherche et redirige vers la page de résultats `/recherche` (#5871).

## Mon Master

### Format

```
https://labonnealternance.apprentissage.beta.gouv.fr/monmaster/<RNCP>?latitude=<lat>&longitude=<lon>
```

| Paramètre | Emplacement | Obligatoire | Format | Effet |
| --- | --- | --- | --- | --- |
| `<RNCP>` | chemin | oui | `RNCP37873`, `rncp37873` ou `37873` (2 à 5 chiffres) | métier recherché |
| `latitude` | query | non | décimal WGS84 à point (`48.8566`), -90 à 90 | centre de la recherche |
| `longitude` | query | non | décimal WGS84 à point (`2.3522`), -180 à 180 | centre de la recherche |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | query | non | 100 caractères max | attribution de campagne (`utm_source=monmaster` par défaut) |

`latitude` et `longitude` vont ensemble : une seule des deux, une valeur non numérique ou à virgule décimale (`48,85`) est ignorée. Tout autre paramètre est ignoré.

### Exemples

```
/monmaster/RNCP37873?latitude=48.8566&longitude=2.3522
/monmaster/RNCP37873?latitude=45.764&longitude=4.8357&utm_medium=fiche-formation&utm_campaign=rentree-2027
/monmaster/RNCP37873
```

### Ce que voit l'usager

Une recherche d'offres d'emploi en alternance :

- **métier** : intitulé du métier (code ROME) le plus associé au RNCP dans le catalogue des formations en apprentissage, ou à défaut l'intitulé de la formation ;
- **lieu** : commune la plus proche du point (dans un rayon de 20 km), recherche dans un rayon de 20 km, élargie automatiquement de 20 km en 20 km jusqu'à 100 km si aucune offre n'est trouvée ;
- sans coordonnées : France entière.

### Cas limites

Le lien ne mène jamais à une page d'erreur : quand le code ne peut pas être traduit, l'usager arrive sur la recherche centrée sur le lieu (ou France entière), sans métier.

| Situation | Résultat |
| --- | --- |
| RNCP mal formé (`RNCP 37873`, `RS1234`, plus de 5 chiffres…) | recherche géographique seule |
| RNCP sans formation en apprentissage au catalogue LBA | recherche géographique seule |
| RNCP connu mais aucune offre à proximité | élargissement automatique du rayon, puis zéro résultat |
| coordonnées absentes, incomplètes, à virgule décimale ou hors bornes | recherche sur la France entière |

### Limites d'usage

Les liens sont destinés aux clics des usagers, pas à une interrogation automatisée. Le débit est limité par adresse IP (6 requêtes par minute, rafale de 10) ; au-delà, réponse 429, puis blocage temporaire de l'adresse. Pour un accès programmatique aux offres, utiliser l'API : https://api.apprentissage.beta.gouv.fr.

## Fonctionnement

```
/monmaster/<RNCP>?latitude&longitude  (UI, route handler)
  → GET /api/_private/search/partner-link  (API, réseau interne uniquement)
  → 307 /recherche?q=…&lieu_label=…&latitude=…&longitude=…&search_source=partner_links&utm_source=monmaster
```

- Résolution 100 % locale (`formationcatalogues.rncp_code` → `rome_codes` → `referentielromes`), sans appel à l'API Apprentissage : la page publique ne peut pas servir de proxy vers ce quota.
- La route API répond 404 hors réseau privé (contrôleur et nginx). La page publique est limitée par la zone nginx `lba_partner_links` ; les dépassements alimentent le jail fail2ban `nginx-req-limit`.
- Chaque résolution est journalisée (`partner search link`, champs `partner`, `rncp`, `outcome`, `cached`, `has_geo`) : `outcome` vaut `resolved`, `code_invalide`, `rncp_inconnu` ou `sans_libelle` ; filtrer les logs du serveur sur le message `partner search link` dans Loki.
- `search_source=partner_links` exclut ces recherches des statistiques de recherche organique (`analyze-search-queries`).

## Ajouter un partenaire

1. Ajouter sa clé à `PARTNER_SEARCH_LINK_PARTNERS` (`shared/src/routes/_private/partner-search.routes.ts`).
2. Ajouter son entrée à `PARTNER_SEARCH_LINKS` (`ui/app/(partenaires)/_utils/partner-search-link.utils.ts`).
3. Créer `ui/app/(partenaires)/<partenaire>/[<code>]/route.ts` sur le modèle de `monmaster/[rncp]/route.ts`.
4. Étendre la zone nginx (`location /<partenaire>/` dans `90_location_ui.conf.template`) et le `disallow` de `ui/app/robots.ts`.
5. Si le partenaire n'envoie pas un RNCP, adapter `resolvePartnerSearchLink` (`server/src/services/search/partner-search-link.service.ts`).
