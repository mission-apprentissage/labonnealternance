# design-sync — notes repo (LBA `ui`)

## Forme du repo (hors-enveloppe standard)
- `ui/` est une **app Next.js**, pas un package librairie : pas de `dist/` propre, pas d'exports `.d.ts` barrelés.
- Le design system réel = **`@codegouvfr/react-dsfr`** (composants DSFR) + un **sous-ensemble MUI** rendu sous le thème DSFR (`MuiDsfrThemeProvider` de `@codegouvfr/react-dsfr/mui`).
- react-dsfr expose ses composants en **sous-chemins par fichier** (`@codegouvfr/react-dsfr/Button`), pas via un barrel — `fr/index` ne contient que ~9 utils. Le converter ne découvre donc rien par défaut.

## Barrel maison = l'entry du converter
- `.design-sync/ds-src/index.ts` (+ `index.d.ts`, `package.json` name `lba-ds`) : re-exporte les 39 composants DSFR racine + `blocks/PasswordInput` + un sous-ensemble MUI curé + `MuiDsfrThemeProvider`.
- **Régénérable** : le barrel est produit à partir des `.d.ts` racine de react-dsfr + une liste MUI curée (mesurée depuis les imports réels de `ui/`). Voir le script de génération dans l'historique de conversation / à réécrire si la liste bouge.
- **Sous-ensemble MUI** : Box, Typography, Grid, Stack, Container… (les primitives layout/form que DSFR n'a pas). Collisions de noms DSFR↔MUI (Button, Alert, Badge, Checkbox, Input, Select, Tabs, Tooltip) → **DSFR gagne**, la version MUI est retirée du barrel (elles sont très peu utilisées côté MUI dans LBA).
- DSFR manquants du barrel : `LanguageSelect` (export non-`const`), `Header`/`Display`/`Chart` (dossiers, pas `.d.ts` racine). Ajoutables via `componentSrcMap` si besoin.

## CSS / fonts DSFR
- Le dist DSFR fait 86M (surtout `artwork`). On copie **seulement** ce que `dsfr.min.css` référence dans `ds-src/dsfr/` : `dsfr.min.css` + `fonts/` (Marianne, ~1M) + `icons/` (~4M). `cssEntry: "dsfr/dsfr.min.css"`.
- `cssEntry` DOIT être **dans** pkgRoot (ds-src) — `cfgPath` rejette tout chemin hors du package. D'où la copie locale.
- Police brand = **Marianne** (20 @font-face). Conforme à l'obligation DSFR de l'État.

## Provider previews
- `cfg.provider = { component: "LbaDsProvider" }`. Ce wrapper (`.design-sync/ds-src/provider.tsx`, re-exporté par le barrel) appelle **`startReactDsfr({ defaultColorScheme: "light" })` au chargement du module** PUIS enveloppe dans `MuiDsfrThemeProvider`.
- **Critique** : `MuiDsfrThemeProvider` seul NE SUFFIT PAS — sans `startReactDsfr()` les composants DSFR jettent « react-dsfr not initialized » et rendent vide. C'est la clé de tout le rendu des previews.
- `LbaDsProvider` est exclu de la liste composants via `componentSrcMap: { "LbaDsProvider": null }` (infra, pas une carte).

## Re-sync risks
- Le **barrel `ds-src/` est un artefact généré committé** : si react-dsfr ou la liste MUI change, le régénérer. Ce n'est pas de l'upstream auto-suivi. `Tab` (MUI) est volontairement exclu (`componentSrcMap.Tab=null`) — son parent MUI `Tabs` a été retiré (collision de nom avec DSFR Tabs), donc Tab seul est inutilisable.
- La CSS DSFR complète est reconstruite par **`.design-sync/build-dsfr-css.mjs`** : combine `dsfr.main.min.css` (COMPLET — pas `dsfr.min.css` qui est un core stripped) + `utility/icons/icons.min.css`, et **inline tous les SVG/PNG en data-URI** (self-contained, requis pour la CSP de claude.ai/design). Sortie : `ds-src/dsfr/dsfr-complete.css` (~833 KB) + `ds-src/dsfr/fonts/`. `cssEntry` pointe dessus.
- **`ds-src/dsfr/` est gitignoré** (bulky, régénérable). **Sur un fresh clone OU après un bump de `@codegouvfr/react-dsfr`, lancer `node .design-sync/build-dsfr-css.mjs` AVANT `package-build`** (sinon `[CSS_IMPORT_MISSING]` sur `dsfr/dsfr-complete.css`).
- Fonts Marianne (20 @font-face) copiées dans `ds-src/dsfr/fonts/` par le même script.
- Icônes `fr-icon-*` : whitelist limitée à ce que `icons.min.css` embarque (~57 classes). Les previews n'utilisent que cette whitelist (une icône hors whitelist rend en boîte blanche). Liste dans les prompts de fan-out / regénérable via `grep -oE "fr-icon-[a-z0-9-]+" ds-src/dsfr/dsfr-complete.css`.

## Props DSFR/MUI vérifiées (issues du fan-out authoring)
- **Input** : `label` requis ; états via `state` (`default|info|success|error`) + `stateRelatedMessage` ; icône `iconId` ; textarea via `textArea`+`nativeTextAreaProps` ; valeurs via `nativeInputProps.defaultValue`.
- **Select** : `nativeSelectProps` requis (même `{}`), `children`=`<option>`, `hint` (pas `hintText`).
- **Checkbox/RadioButtons** : `options:[{label,hintText?,nativeInputProps}]`, `legend`, `orientation`, `small`, `state`+message. Checkbox : `name?: never` racine → `name` dans chaque `nativeInputProps`.
- **PasswordInput** : pas de `state` ; critères via `messages:[{severity,message}]`, severity ∈ `valid|info|error` ; `messagesHint`.
- **Upload** : rend un `<input type=file>` natif ("Choose File") — comportement DSFR attendu ; label/hint/état stylés.
- **ToggleSwitch** : `label`, `helperText`, `labelPosition` (`left|right`), `defaultChecked`.
- **SegmentedControl** : `segments` tuple 1→5 ; règle DSFR **tous avec icône OU tous sans** ; `legend` requis sauf `hideLegend` ; `inlineLegend`, `small`.
- **Breadcrumb** : `segments:[{label,linkProps:{href}}]` + `homeLinkProps` + `currentPageLabel`.
- **Quote** : `text`+`author`+`source`, guillemets « » auto.
- **Stepper** : `currentStep`/`stepCount`/`title`/`nextTitle`.
- **MUI (Typography/Stack/Grid)** : prop `component` marquée **requise** dans les `.d.ts` émis → la passer explicitement (`"h1"/"p"/"div"`). Grid item : `size={{xs,md}}`. Couleurs sémantiques rendues via thème DSFR.
- **MUI Tab** : à rendre DANS `<Tabs>` (standalone = vide).

## Bug CSS résolu — dsfr.min.css → dsfr.main.min.css
Le fan-out a révélé que `dsfr.min.css` (que le builder utilisait) est un **core stripped** : il OMET fr-toggle, fr-tag (surface), fr-notice, fr-pagination, fr-download, la majorité de fr-segmented. Le fichier complet est **`dsfr.main.min.css`** (toggle=76, segmented=38, pagination=60, download=31 dans la version non-min). `build-dsfr-css.mjs` corrigé en conséquence. Symptômes avant fix : ToggleSwitch→checkbox native, Tag→texte nu sans pilule, Notice→pas de bandeau, Pagination→liste verticale, Download→sans icône.

## Known render warns (triés, non-bloquants)
- `[TOKENS_MISSING]` ~18 vars `--*-hover/-active` : tokens d'interaction injectés au runtime par le thème DSFR, absents des feuilles statiques. Normal (états hover/active non capturables en statique).
- Stepper : `title` et « Étape X sur Y » visuellement collés dans le sheet — rendu DSFR par défaut (compteur = label au-dessus en usage réel avec layout complet), pas un bug.
