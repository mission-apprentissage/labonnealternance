# Mesure terrain des web-vitals

INP, CLS, LCP, TTFB et FCP mesurés chez les vrais visiteurs, avec leur attribution, sur 10 % des chargements de page hors widget. Lecture dans Loki, rien en base.

## Chaîne

1. `WebVitalsReporter` (layout racine) tire au sort le chargement. Pour les visites retenues seulement, il charge `web-vitals` (build attribution) et le code d'envoi : rien de tout cela n'est sur le first-load.
2. `startWebVitalsReporting` met chaque métrique rapportée en file, une entrée par métrique (la dernière valeur l'emporte), et envoie la file en un seul lot par `sendBeacon` au passage en arrière-plan (`visibilitychange` vers `hidden`, comme le recommande `web-vitals`). Pas d'envoi au `pagehide` : Chrome le déclenche avant `visibilitychange`, avant que l'INP et le CLS soient finalisés.
3. `POST /_private/web-vitals` valide le lot (schéma zod strict `ZWebVitalsBatch`), ignore les robots et journalise **une ligne par métrique** : `log_msg` = `web-vital`, champs sous `log_web_vital.*`, contexte de la page recopié sur chaque ligne. Un lot refusé (400) journalise une ligne `web-vital rejected` avec le chemin et la règle des champs refusés, jamais leur valeur.

nginx sert `/bff/_private/web-vitals` hors de la zone `lba_search` ; le débit est borné par Fastify (5 requêtes/s par IP).

## Champs

Communs (lot) : `page_id`, `landing_route`, `version`, `viewport_width`, `cpu_cores`, `device_memory`, `effective_type`.

Communs (métrique) : `metric`, `value` (ms, sauf CLS), `rating` (seuils Google, calculé par `web-vitals`), `route`, `navigation_type`.

| Métrique | Attribution |
|---|---|
| INP | `target`, `interaction_type`, `load_state`, `input_delay`, `processing_duration`, `presentation_delay`, `total_script_duration`, `total_style_and_layout_duration`, `longest_script_*` |
| CLS | `target`, `load_state`, `largest_shift_value` |
| LCP | `target`, `url` (ressource, sans query), `time_to_first_byte`, `resource_load_delay`, `resource_load_duration`, `element_render_delay` |
| TTFB | `waiting_duration` (redirections, démarrage), `cache_duration`, `dns_duration`, `connection_duration`, `request_duration` (attente serveur) |
| FCP | `load_state`, `time_to_first_byte`, `first_byte_to_fcp` |

Aucune donnée personnelle : routes réduites à des gabarits (`toRouteTemplate`, contrôlé côté API par `zWebVitalRoute`), query et fragment retirés de toute URL (refusés par l'API sinon), `page_id` tiré au hasard à chaque chargement et à chaque restauration bfcache, sans lien d'une page à l'autre.

`landing_route` est la route au chargement, celle de CrUX et de la Search Console. `route` est la route au moment mesuré : l'interaction pour l'INP, le plus grand décalage pour le CLS, l'instant de la métrique pour LCP, TTFB et FCP.

## Plusieurs valeurs par page (INP, CLS)

`web-vitals` renvoie l'INP et le CLS à chaque passage en arrière-plan où leur valeur a augmenté. Un p75 calculé sur toutes les lignes compte ces valeurs intermédiaires et sous-estime la métrique. Pour l'INP et le CLS, garder la valeur maximale par `page_id`. LCP, TTFB et FCP ne partent qu'une fois par `page_id`.

LogQL n'a pas de quantile sur un vecteur : après dédoublonnage, on compte les pages sous chaque seuil. Le p75 est « bon » si au moins 75 % des pages sont sous le seuil « bon », « mauvais » si plus de 25 % sont au-dessus du seuil « mauvais ». Pour encadrer la valeur du p75 (comparaison avec CrUX), répéter le comptage à des seuils successifs (150, 200, 250, 300 ms…) : le p75 est entre le dernier seuil sous lequel moins de 75 % des pages se trouvent et le suivant. Les comptages s'additionnent d'un jour à l'autre.

Seuils Google (bon ≤, mauvais >) : INP 200 / 500 ms, CLS 0,1 / 0,25, LCP 2 500 / 4 000 ms, FCP 1 800 / 3 000 ms, TTFB 800 / 1 800 ms.

## Requêtes

Datasource Loki de Grafana, requêtes instantanées. Les requêtes sur 7 jours expirent souvent : lancer une fenêtre `[1d]` par jour, une requête à la fois. « Mobile » = `viewport_width < 768`. Une journée de dédoublonnage par `page_id` représente quelques milliers de séries intermédiaires : la même forme, avec un champ de cardinalité comparable, passe sur une journée de production.

INP mobile, pages sous le seuil « bon » par type de page (remplacer `<= 200` par `> 500` pour les pages « mauvaises », retirer le filtre de comparaison pour le total ; pour le CLS, `"metric":"CLS"` et seuils `0.1` / `0.25`) :

```logql
count by (landing_route) (
  max by (landing_route, page_id) (
    max_over_time({product="lba", service="server", env="production"} |= `"log_msg":"web-vital"` |= `"metric":"INP"`
      | json metric="log_web_vital.metric", page_id="log_web_vital.page_id", landing_route="log_web_vital.landing_route", vw="log_web_vital.viewport_width", value="log_web_vital.value"
      | metric="INP" | vw < 768 | unwrap value | __error__="" [1d])
  ) <= 200
)
```

LCP mobile, p75 par type de page (`TTFB`, `FCP` : remplacer le nom de la métrique aux deux endroits) :

```logql
quantile_over_time(0.75, {product="lba", service="server", env="production"} |= `"log_msg":"web-vital"` |= `"metric":"LCP"`
  | json metric="log_web_vital.metric", landing_route="log_web_vital.landing_route", vw="log_web_vital.viewport_width", value="log_web_vital.value"
  | metric="LCP" | vw < 768 | unwrap value | __error__="" [1d]) by (landing_route)
```

LCP mobile au-dessus de 2,5 s, ressources les plus fréquentes (`target` à la place de `url` pour les éléments) :

```logql
topk(10, sum by (url) (count_over_time({product="lba", service="server", env="production"} |= `"log_msg":"web-vital"` |= `"metric":"LCP"`
  | json metric="log_web_vital.metric", url="log_web_vital.url", vw="log_web_vital.viewport_width", value="log_web_vital.value"
  | metric="LCP" | vw < 768 | value > 2500 [1d])))
```

Découpage moyen d'un LCP mobile au-dessus de 2,5 s : `sum_over_time(… | unwrap <champ> [1d])` sur chacun des quatre champs de découpage, divisé par `count_over_time` sur la même sélection. Même principe pour le TTFB (`dns_duration`, `connection_duration`, `request_duration`, `cache_duration`, `waiting_duration`) et le FCP (`time_to_first_byte`, `first_byte_to_fcp`).

Lots refusés et leur cause :

```logql
sum by (fields) (count_over_time({product="lba", service="server", env="production"} |= `"log_msg":"web-vital rejected"`
  | json fields="log_web_vital_rejected" [1d]))
```
