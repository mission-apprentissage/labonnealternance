# Tracking Matomo : règles à appliquer

À suivre dès qu'une issue demande de mesurer un usage (« tracker », « mesurer », « indicateur », « KPI »)
ou d'attribuer du trafic à une source (« UTM », « lien tracké », « campagne »). Deux mécanismes :

- **Événements** (§1 à §7) : le front pousse un événement métier, Matomo Tag Manager (MTM) le transforme en
  événement Matomo.
- **Liens tracés** (§8) : les paramètres `utm_*` d'un lien entrant attribuent la visite à une campagne
  dans Matomo et, côté serveur, la candidature, le compte ou l'offre qui en découle.

```
composant React ──pushMatomoEvent({ event, …champs })──▶ window._mtm
   MTM : déclencheur CustomEvent dl__<event> ─▶ balise <catégorie>__<action> ─▶ stats.beta.gouv.fr (site 7)
```

| Élément | Où |
| --- | --- |
| Liste des événements | `MATOMO_EVENTS` dans [`ui/utils/matomo-utils.ts`](../../ui/utils/matomo-utils.ts) |
| Envoi | `pushMatomoEvent` (même fichier). Jamais de `window._paq.push` ni de `_mtm.push` direct |
| Chargement du conteneur | [`ui/tracking/trackingMatomo.tsx`](../../ui/tracking/trackingMatomo.tsx) (`lazyOnload`, désactivé dans le widget) |
| Conteneur production | `s4n03ZE1`, site 7 |
| Conteneur recette et pentest | `6EvvnT5g`, site 10 ([`ui/config.public.ts`](../../ui/config.public.ts)) |
| Pas de tracking | local, preview (`siteId` vide) |

## 1. Avant de coder : la fiche de tracking

Chaque issue qui attend du tracking contient ce tableau, validé par le PM ou la data avant le développement.
Sans fiche, pas de push.

| Question produit | `event` (push) | Moment exact | Catégorie / action | `eventName` | `eventValue` | Dimensions | Objectif / entonnoir |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Combien de recruteurs exportent leurs candidatures ? | `applications_export_downloaded` | fichier généré (pas au clic) | `recruiter_applications` / `applications_export_downloaded` | `user_type \| offer_state` | nb de candidatures | — | — |

Une ligne par événement. On part de la question, puis on en déduit l'événement : un événement qui ne répond à
aucune question ne s'ajoute pas.

## 2. Modèle d'un événement Matomo

| Champ | Règle | Exemple |
| --- | --- | --- |
| `eventCategory` | Valeur fixe, prise dans la liste fermée ci-dessous | `search` |
| `eventAction` | **Valeur fixe**, identique au nom de l'`event` poussé. Jamais de `{{variable}}` | `application_detail_opened` |
| `eventName` | Le détail variable : un identifiant, un libellé ou un mode | `{{dlv__filter_name}}` |
| `eventValue` | Uniquement un nombre (compteur, montant, durée) | `{{dlv__results_count}}` |
| Dimensions | Attributs qu'on veut croiser avec d'autres rapports | `filter_value` |

Pourquoi l'action reste fixe : les objectifs, les entonnoirs et les rapports personnalisés filtrent sur
`eventAction == …`. Une action dynamique éclate le rapport en autant de lignes qu'il y a de valeurs,
et chaque nouvelle valeur oblige à modifier ces filtres. La variable va dans `eventName`.

Les actions existantes qui s'écartent de cette règle (`filter_applied` pour `search_filter_applied`,
`partner_popin_displayed` pour `partner_apply_popin_show`…) gardent leur nom, pour ne pas couper les séries
(cf. §7). La règle vaut pour tout nouvel événement.

Catégories en usage (à réutiliser avant d'en créer une) :

| Catégorie | Périmètre |
| --- | --- |
| `search` | moteur de recherche : lancement, résultats, filtres, tri, mode |
| `discovery` | consultation d'offres : clic sur une carte, fiche affichée |
| `application` | candidature : ouverture, envoi, redirection vers le site partenaire |
| `conversion` | popin de retour après une redirection vers un partenaire |
| `content` | pages éditoriales et outils (simulateur de salaire…) |
| `recruiter` | parcours recruteur : accès, compte, dépôt d'offre |
| `recruiter_applications` | suivi des candidatures côté recruteur et CFA |
| `admin_recruiter` | actions sur les offres depuis l'espace pro |
| `cfa_sharing` | partage d'une offre avec des CFA |

### Valeurs

- `snake_case`, en anglais, sans accent : `jobs_only`, `structured`, `accepted`.
- Booléens : `"true"` / `"false"`.
- Valeur absente : `"non_renseigné"`. Jamais de chaîne vide, ni de `undefined` lu par une balise.
- Un même champ garde un seul vocabulaire sur tout le site. `job_offer_type` vaut toujours une valeur de
  `getMatomoJobOfferType()` : pas de libellé écrit à la main ailleurs.
- **Cardinalité** : un compteur ou une position brute en dimension crée une ligne par valeur, et Matomo regroupe
  le surplus dans « Autres ». On la découpe en tranches avec une variable `js__bucket_*`, ou on la passe en `eventValue`.
- Plusieurs attributs dans `eventName` uniquement s'ils n'ont pas de dimension : ordre fixe, séparateur ` | `,
  et ordre documenté dans la description de la balise.

### Dimensions personnalisées

- Une dimension n'est créée que si l'attribut sert à croiser des rapports (segment, rapport personnalisé).
  Sinon, il va dans `eventName`.
- Portée `action` par défaut. La portée `visit` ne garde qu'une valeur par visite : à réserver aux attributs
  stables sur toute la visite.
- Dans une balise, le champ « index » d'une dimension attend l'**id** de la dimension (`idcustomdimension`),
  pas son index de portée. L'id se lit dans *Administration › Dimensions personnalisées* (ou avec
  `list_goals_and_dimensions`).

## 3. Nommage dans Matomo Tag Manager

| Objet | Format | Exemple |
| --- | --- | --- |
| `event` poussé par le front | `<objet>_<verbe au participe passé>` | `application_detail_opened` |
| Constante TS | même nom en `SCREAMING_SNAKE_CASE` | `APPLICATION_DETAIL_OPENED` |
| Déclencheur CustomEvent | `dl__<event>`, à l'identique | `dl__application_detail_opened` |
| Balise | `<catégorie>__<action>` | `recruiter_applications__application_detail_opened` |
| Variable DataLayer | `dlv__<champ>`, champ à l'identique | `dlv__application_status` → `application_status` |
| Variable JS calculée | `js__<nom>` | `js__bucket_total_search_results` |
| Variable paramètre d'URL | `url__<nom>` | `url__recruiter_offer_creation_origin` |

- Un seul déclencheur par `event`. Avant d'en créer un, chercher s'il existe déjà.
- Les noms de champs sont précis (`ai_rewrite_decision`, pas `decision`) : tous les événements partagent le
  même dataLayer (cf. §4).
- Chaque balise, déclencheur et variable a une description : ce qu'elle mesure et le numéro d'issue.
  Par exemple : `Suivi des candidatures (#5769) : ouverture d'une candidature depuis la liste`.

## 4. Côté code

1. Ajouter l'événement à `MATOMO_EVENTS`. Pas de chaîne littérale dans `pushMatomoEvent`.
2. Pousser au moment du fait métier :
   - une confirmation (`*_confirmed`, `*_completed`) part dans le `onSuccess` de la mutation, jamais au clic
     (cf. `SMART_APPLY_CONFIRMED` dans `submit-candidature.ts`) ;
   - un affichage part quand les données réelles sont affichées, pas pendant un chargement ou un placeholder
     (cf. `SEARCH_RESULTS_DISPLAYED` dans `SearchPageClient.tsx`).
3. **Pousser dans le même `push` tous les champs que la balise lit.** Le dataLayer de MTM fusionne les pushes
   successifs dans un seul état et ne l'efface jamais. Une variable `dlv__x` lue par la balise B renvoie donc la
   valeur de `x` poussée par l'événement A s'il manque dans le push de B. Valeur inconnue :
   `"non_renseigné"`, explicitement.
4. Dédoublonner les effets : un événement par fait métier, pas par rendu. Une ref sur la clé métier
   (cf. `lastTrackedItemIdRef` dans `JobDetailRendererClient.tsx`). Quand l'usager peut revenir sur une clé
   déjà suivie sans nouvel appel serveur, retenir toutes les clés, pas la dernière (cf. `createSearchKeyTracker`
   dans `search.tracking.utils.ts`, #6052).
5. Une dimension calculée (statut, tranche, libellé) sort dans une fonction pure testée, à côté du composant
   (cf. `diffFilterChanges` dans `search.tracking.utils.ts` et son test).
6. Retirer une constante de `MATOMO_EVENTS` dès que plus rien ne la pousse, et nettoyer le conteneur en même temps
   (cf. §7).

Le conteneur est chargé en `lazyOnload` : les événements poussés avant le chargement attendent dans
`window._mtm` et partent ensuite. Une visite qui se termine avant `window.load` n'envoie rien.

## 5. Données personnelles

Matomo est configuré en mode exempté de consentement (cf. politique de confidentialité). Un événement ne
contient donc jamais :

- nom, prénom, e-mail, téléphone, adresse postale, contenu d'un CV ou d'un message ;
- identifiant de compte ou d'utilisateur (`user_id`, e-mail du recruteur) ;
- texte libre saisi par l'usager hors champs de recherche.

Autorisés : identifiants d'offre, types, statuts, compteurs, tranches, mots-clés et lieu de recherche.
Nom d'entreprise et SIRET : jamais dans `eventName` ni dans une dimension. L'identifiant d'offre suffit à les
retrouver. Seuls les champs lus par une balise partent vers Matomo, mais on ne pousse pas non plus de champ
interdit dans le dataLayer. En cas de doute, on demande au PM avant de pousser, pas après.

## 6. Recette et mise en production

Ordre : **conteneur avant code**. Un événement poussé sans balise est perdu, alors qu'une balise sans
événement ne coûte rien. La version du conteneur est publiée au plus tard au moment du déploiement en
production.

1. **Brouillon** : déclencheur, variables et balise créés dans le brouillon du conteneur `s4n03ZE1`.
   Avec le serveur MCP `lba-matomo`, `track_custom_event` fait les trois d'un coup (le lancer d'abord en
   `dry_run`).
2. **Vérification en mode prévisualisation** (*Tag Manager › Prévisualiser / Déboguer*) sur la recette ou
   la production : pour chaque `event`, la balise se déclenche une seule fois et chaque variable lit la bonne valeur.
3. **Version** : nom `NN. type: sujet (#issue)` (types des PR : `feat`, `fix`, `chore`), description qui
   liste les balises ajoutées, modifiées ou supprimées. Un seul sujet par version.
4. **Publication en `live`** avec l'accord du PM. Via le serveur MCP, la publication ajoute une annotation sur
   les graphiques Matomo. Via l'interface, on la crée à la main, à la date de mise en production.
5. **Contrôle à J+1 puis J+7** :
   - les balises reçoivent des événements (`check_tag_activity`, ou *Comportement › Événements*) ;
   - le volume est cohérent avec les visites (nombre d'événements par visite). Un ratio anormal signale un doublon ;
   - aucune valeur `undefined`, vide ou périmée (cf. §4.3) dans `eventName` ni dans les dimensions.

La recette charge un autre conteneur (`6EvvnT5g`, site 10) : une balise créée uniquement dans
`s4n03ZE1` ne se déclenche pas en recette. Sur la recette, on vérifie le push avec
`window._mtm` dans la console. Sur la production, on vérifie la balise en mode prévisualisation.

## 7. Renommer, modifier, supprimer

Un renommage casse la continuité des séries : l'ancienne action et la nouvelle apparaissent comme deux lignes
distinctes. Si on renomme quand même, on met à jour tout ce qui référence l'action, dans la même version :

| À vérifier | Où |
| --- | --- |
| Constante et pushes | `MATOMO_EVENTS`, `git grep` sur la valeur |
| Déclencheur, balise, variables | conteneur (`get_references` pour les usages) |
| Objectifs | *Objectifs › Gérer* (motif `event_action` exact) |
| Entonnoirs | étapes `eventaction_equals` |
| Rapports personnalisés | filtres de segment `eventAction==…` |
| Tableaux de bord et notes Notion | à signaler au PM |

Pour supprimer un événement : retirer le push et la constante, puis le déclencheur, la balise et les variables
qui ne servent plus (`find_orphan_triggers`), puis les objectifs, entonnoirs et rapports qui filtrent dessus.
Les déclencheurs et variables orphelins se suppriment à chaque version.

## 8. Liens tracés (UTM)

### Ce que les UTM déclenchent

| Côté | Mécanisme | Conséquence |
| --- | --- | --- |
| Matomo | Lit `utm_campaign`, `utm_source`, `utm_medium` (et `mtm_*`) de l'URL d'arrivée | La visite passe en canal « Campagne ». Par défaut, Matomo ouvre une nouvelle visite quand la campagne change en cours de visite (`create_new_visit_when_campaign_changes`, réglage de l'instance à confirmer) |
| Front | `setTrackingCookies` ([`tracking-cookie-utils.ts`](../../ui/tracking/tracking-cookie-utils.ts)) copie `utm_campaign` (ou `mtm_campaign`), `utm_source` et `utm_medium` dans des cookies valables 3 mois | Dernier clic gagnant. **Seuls les paramètres présents dans l'URL sont réécrits** : les autres gardent la valeur d'un lien précédent |
| Serveur | `getSourceFromCookies` ([`http-utils.ts`](../../server/src/common/utils/http-utils.ts)) relit ces cookies, `traffic-source.service.ts` les enregistre dans `trafficsources` | La candidature, le compte ou l'offre créés sont attribués à cette campagne |

### Règle 1 : jamais d'UTM sur un lien interne

Un UTM ne se met que sur un lien qui **entre** sur La bonne alternance depuis l'extérieur : e-mail, site
partenaire, affiche ou QR code, réseau social, application installée. Un lien d'une page LBA vers une autre
page LBA n'en porte pas. Sinon la visite est réattribuée à une campagne interne : la vraie source (moteur de
recherche, partenaire, e-mail) disparaît de Matomo, et les cookies du tableau ci-dessus l'écrasent pour
`trafficsources`.

Pour mesurer un lien interne, on utilise :

- un paramètre dédié, déjà lu par la page cible : `search_source` (recherche), `guide_source` (guides),
  `print_source` (impression), `origin` (création de compte recruteur ou CFA) ;
- ou un événement Matomo au clic (§1 à §7).

### Règle 2 : les trois paramètres, toujours ensemble

`utm_source`, `utm_medium` et `utm_campaign` sont tous présents sur chaque lien tracé. Un lien qui n'en porte
qu'un mélange sa valeur avec les deux autres, restés dans les cookies depuis un lien précédent.
`utm_content` est facultatif. `utm_term` n'est pas utilisé.

### Règle 3 : le vocabulaire

| Paramètre | Rôle | Valeurs |
| --- | --- | --- |
| `utm_source` | Qui émet le lien | `lba` : e-mail envoyé par le serveur LBA. `lba-brevo` : lien inséré dans une campagne Brevo (cf. `relance-search-url.ts`). `lba-phygital` : affiche et QR code. `<partenaire>` : lien fourni à un partenaire, identifiant en minuscules (`monmaster`, `parcoursup`…). `pwa` : lancement depuis l'application installée |
| `utm_medium` | Canal | `email`, `phygital`, `partenariat`, `referral` (lien sortant, cf. règle 5) |
| `utm_campaign` | Message et lien | Format ci-dessous |
| `utm_content` | Variante dans un même message | Facultatif, minuscules |

`lba-brevo-transactionnel` existe sur des e-mails transactionnels déjà en production. On le garde sur ces
e-mails pour ne pas couper leurs séries, mais un nouvel e-mail transactionnel utilise `lba`.

Format de `utm_campaign` pour un e-mail envoyé par le serveur :

```
lba_<destinataire>-<message>_<lien>
```

- `destinataire` : `candidat`, `recruteur`, `cfa` ou `opco` ;
- `message` : identifiant de l'e-mail, en kebab-case, stable dans le temps ;
- `lien` : le lien dans l'e-mail (`lien-home`, `faq`, `politique-confidentialite`, `lien-recherche`…).

Exemple tiré du code : `lba_candidat-reponse-refus_faq`. Les campagnes créées dans Brevo suivent le format
`AAMM_lba_<cible>_<objet>_brevo<id>` (par exemple `2609_lba_jsc_promo-emplois_brevo1189`).

Pour toutes les valeurs : minuscules, sans accent ni espace, 100 caractères au plus (même limite que
`MAX_UTM_LENGTH` dans `partner-search-link.utils.ts`). Pas de donnée personnelle ni d'identifiant
d'utilisateur.

### Règle 4 : construire l'URL, ne pas concaténer

- Passer par `URL` et `searchParams.set()`, jamais par `` `${url}?${utmParams}` `` ni `` `${url}&utm_…` `` :
  la concaténation suppose de savoir si l'URL contient déjà un `?`.
- Avant de tracer une URL qui vient d'ailleurs (URL d'origine d'une candidature, lien partenaire), supprimer
  les cinq `utm_*` qu'elle porte déjà (cf. `buildTaggedSearchUrl` dans `relance-search-url.ts`).
- Côté serveur, les valeurs de `utm_campaign` sont des constantes nommées dans le service (cf.
  `RELANCE_INACTIVITE_UTM_CAMPAIGN`, `UTM_CAMPAIGNS` dans `send-suggestions-naf-emails.ts`). Le template
  d'e-mail reçoit des URL déjà tracées, sans `utm_` écrit en dur.
- Un test vérifie les paramètres du lien produit (cf. `relance-candidats-inactifs.test.ts`).

### Règle 5 : liens sortants vers un partenaire

Un lien de LBA vers un autre site porte des UTM qui désignent LBA : `utm_source=labonnealternance`,
`utm_medium=referral`, `utm_campaign=<objet du partenariat>`. Jamais `utm_source=<le partenaire>` : la
source est le site qui envoie le visiteur, pas celui qui le reçoit.

### Liens entrants fournis aux partenaires

- Recherche : `/<partenaire>/<code>` (cf. [`docs/partenaires/`](../partenaires/)). La redirection garde les
  `utm_*` reçus et pose `utm_source=<partenaire>` par défaut, avec `search_source=partner_links`.
- Liens de prise de rendez-vous servis par l'API (`eligible-trainings-for-appointment.service.ts`) :
  `search_source=partner_links` et `utm_source` égal au referrer du partenaire.
- Liens emploi des vœux de formation (`training-links.service.ts`) : `search_source=training_links` et les
  `utm_*` du vœu, ou à défaut `lba` / `email` / `promotion-emploi-jeunes-voeux`.

## 9. Checklist de PR

- [ ] La fiche de tracking est dans l'issue, et l'implémentation la suit (noms, champs, moment).
- [ ] Les événements sont dans `MATOMO_EVENTS`, sans chaîne littérale.
- [ ] Chaque push contient tous les champs lus par sa balise, avec `"non_renseigné"` si la valeur manque.
- [ ] Les confirmations partent après le succès serveur. Les effets sont dédoublonnés.
- [ ] Aucune donnée personnelle (cf. §5).
- [ ] Les dimensions calculées sont testées.
- [ ] Balises, déclencheurs et variables sont prêts dans le brouillon `s4n03ZE1`, avec une description qui cite l'issue.
- [ ] La description de PR liste les événements ajoutés et indique si la version du conteneur est publiée.
- [ ] Liens tracés : aucun UTM sur un lien interne. Les trois `utm_*` sont présents, construits avec `URL`,
      dans le vocabulaire du §8, et couverts par un test côté serveur.
