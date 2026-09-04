---
name: review-rgaa
description: "Revue d'accessibilité du code UI (React / Next.js / MUI / react-dsfr) selon RGAA 4.1.2, WCAG 2.2 AA et WAI-ARIA 1.2 : contrôle les modifications d'une PR, d'une branche ou d'un diff, détecte les défauts préexistants sur les composants et pages touchés, chiffre le gain sur le taux de conformité RGAA et propose les corrections. Déclenche sur : '/review-rgaa', 'accessibilité', 'a11y', 'RGAA', 'WCAG', 'ARIA', 'lecteur d'écran', 'navigation clavier', 'contraste', ou depuis review-code (STEP 10) quand la PR touche l'UI."
---

# review-rgaa — Revue d'accessibilité RGAA / WCAG / ARIA

Tu agis comme expert accessibilité numérique et développeur front senior. La revue est **la tienne** : ne la délègue pas à un outil externe, un scanner automatique ne couvre qu'un tiers des critères.

**Référentiels** : RGAA 4.1.2 (106 critères, 13 thématiques) · WCAG 2.2 niveau AA · WAI-ARIA 1.2 (APG).
**Stack** : Next.js App Router (`ui/app`), React 19, MUI 7 (`@mui/material`), `@codegouvfr/react-dsfr`, Formik. Les recommandations proposent toujours d'abord le composant DSFR, puis MUI, puis le HTML natif. Jamais de solution Rails, Stimulus ou ERB.

**Deux objectifs, toujours dans cet ordre :**
1. **Le diff** — chaque ligne UI ajoutée ou modifiée respecte-t-elle les critères ? Une régression ou un défaut introduit est un finding au même niveau qu'un bug.
2. **Les composants et pages touchés** — les fichiers modifiés, et les pages qui les rendent, portent-ils des défauts préexistants ? Les signaler à part, chiffrés, sans bloquer la PR.

---

## 1. Déterminer la cible

Lire `$ARGUMENTS` d'abord. Formes acceptées, à traiter sans reposer de question :

| Argument | Action |
|---|---|
| URL de PR ou `#5280` | `gh pr view` + `gh pr diff`, restreint aux fichiers UI |
| branche / chemin | `git diff main...<branche> -- ui/` |
| route ou page (`/recherche`, `espace-pro/entreprise/compte`) | mode **page** : audit du composant de page et de son arbre d'imports, sans diff |
| composant (`SearchBar`, `ui/components/ItemDetail`) | mode **composant** : audit du fichier et de ses consommateurs |
| `--runtime` | force la vérification dans le navigateur (section 5) |
| aucun argument | **inférer** comme review-code : non commité → branche vs `main` → dernier commit |

Annoncer l'hypothèse en une ligne. Poser une question uniquement si les pistes sont vides ou contradictoires.

### Périmètre « UI impactée »

Un changement impacte l'UI dès qu'il touche un fichier de `ui/app`, `ui/components`, `ui/styles`, `ui/public/styles`, `ui/theme`, ou un fichier de `ui/utils` / `shared` qui produit du texte affiché (libellés, titres de page, messages d'erreur). Sont exclus : `*.test.*`, `ui/e2e`, `ui/scripts`, `ui/config*`, `ui/services` (hors chaînes affichées), fichiers de configuration.

Si la cible ne contient aucun fichier UI : le dire en une ligne et s'arrêter. Pas de finding de remplissage.

---

## 2. Deux modes d'appel

### Mode autonome (`/review-rgaa`)
Suivre les sections 3 à 7 en entier. La restitution est celle de la section 6.

### Mode intégré (appelé par review-code, STEP 10)
review-code appelle ce skill **si et seulement si** la PR impacte l'UI (définition ci-dessus). Alors :
- Exécuter les sections 3, 4 et 5 sur le même diff, sans recharger le contexte déjà rassemblé par review-code.
- Restituer dans la revue globale sous un titre `**Accessibilité (RGAA)**`, numérotation `R1, R2…` distincte de `C/D/A`.
- Un finding **Bloquant** issu du diff (objectif 1) compte dans le total des bloquants de la revue. Les défauts préexistants (objectif 2) vont dans une ligne « Dette accessibilité » avec le gain de points, jamais dans les bloquants de la PR.
- Le récapitulatif de review-code gagne une ligne : `RGAA : X findings (B/M/m) · gain potentiel +Y pts`.
- Pas de `AskUserQuestion` propre : les suites sont proposées par review-code.

---

## 3. Rassembler le contexte

1. **Fichiers UI du diff** et, pour chaque composant modifié, ses **consommateurs** (`grep -rl "from \"@/…/Composant\""` dans `ui/`) jusqu'aux fichiers `page.tsx` ou `layout.tsx` : c'est la liste des pages touchées.
2. **Correspondance avec l'échantillon d'audit** : pour chaque page touchée, chercher son numéro `Pxx` dans `references/audit-2025.md` (tableau routes → pages). Relever les critères déjà NC sur ces pages : ce sont les défauts préexistants à confirmer ou infirmer sur le code actuel.
3. **Composants transverses** : si le diff touche `ui/app/_components/Header.tsx`, `HeaderNavigation.tsx`, `Footer.tsx`, `Breadcrumb.tsx`, `ui/app/layout.tsx`, `ui/components/head.tsx` ou un `layout.tsx` de groupe, toutes les pages sont concernées. Le dire, et pointer les 7 critères transverses NC de l'audit (6.1, 9.1, 9.2, 10.2, 12.1, 12.6, 12.8).
4. **Lire les fichiers complets**, pas seulement le diff : un `aria-labelledby` ajouté ne vaut que si l'`id` existe et est unique dans la page rendue.
5. **Titres de page** : vérifier `METADATA` dans `ui/utils/routes.utils` (ou la constante `metadata` du `page.tsx`) quand une page est ajoutée ou renommée.

Charger les références selon le besoin :
- `references/criteres.md` — les 106 critères, test de code par critère, correspondance WCAG 2.2, ce qui est vérifiable statiquement ou au runtime, statut audit.
- `references/patterns-stack.md` — patterns corrects et pièges pour react-dsfr, MUI, Next.js, Formik dans ce repo.
- `references/audit-2025.md` — audit du 25/11/2025 : score, critères NC par page, tickets par composant, méthode de calcul des points.

---

## 4. Analyser

### Objectif 1 — Le diff, thème par thème

Passer les 13 thématiques dans l'ordre. Pour chacune, ouvrir la section correspondante de `references/criteres.md` et n'appliquer que les critères dont le sujet est présent dans le diff (une image, un lien, un champ…). Écrire « sans objet » pour les thèmes vides, ne pas les développer.

| Thème | Déclencheur dans le diff |
|---|---|
| 1 Images | `<img>`, `<Image>`, `<svg>`, `fr-icon-*`, `iconId`, `background-image` porteuse d'info |
| 2 Cadres | `<iframe>` |
| 3 Couleurs | `color`, `backgroundColor`, `fr.colors.*`, `sx` avec couleur, badge, état signalé par couleur |
| 4 Multimédia | `<video>`, `<audio>`, lecteur embarqué |
| 5 Tableaux | `<table>`, `Table` DSFR, `TableWithPagination`, `VirtualTable`, `react-table` |
| 6 Liens | `<a>`, `NextLink`, `DsfrLink`, `linkProps`, `href`, `target="_blank"` |
| 7 Scripts | tout composant interactif : `onClick`, `onKeyDown`, `Autocomplete`, `Tooltip`, modale, onglets, accordéon, menu, `aria-live`, toast |
| 8 Éléments obligatoires | `metadata.title`, `lang`, texte en langue étrangère, balise sémantique détournée (`<h3>` pour la taille, `<Typography variant="h2">` sans `component`) |
| 9 Structuration | titres `h1-h6`, `Typography variant="hN"`, listes (`<ul>/<ol>`, `List`), landmarks `<main>`, `<nav>`, `<header>`, `<footer>` |
| 10 Présentation | `outline`, `:focus`, `display: none` sur un contenu utile, icône CSS seule, `hidden`, `sr-only`, hauteur fixe + `overflow: hidden`, `position: sticky` |
| 11 Formulaires | `Input`, `TextField`, `Select`, `Checkbox`, `RadioButtons`, `useField`, `label`, `hintText`, `stateRelatedMessage`, `required`, `autoComplete`, `<fieldset>` |
| 12 Navigation | `SkipLinks`, `Breadcrumb`, `MainNavigation`, `tabIndex`, gestion du focus après navigation client (`router.push`, `useRouter`) |
| 13 Consultation | timeout de session, `setTimeout` qui modifie le contenu, animation, carrousel, `target="_blank"`, geste tactile (`react-swipeable`) |

Pour chaque finding, exiger les quatre éléments : **critère** (n° RGAA + SC WCAG), **preuve** (`fichier:ligne`, extrait), **impact utilisateur** (qui est exclu : lecteur d'écran, clavier seul, malvoyance, cognition), **correction** (code React prêt à coller, composant DSFR d'abord).

### Objectif 2 — Défauts préexistants sur les composants et pages touchés

Sur chaque fichier modifié et chaque page identifiée en section 3 :

1. Confronter les critères NC de l'audit (colonne « Audit » de `criteres.md`, tableau par page de `audit-2025.md`) au code actuel. Trois issues possibles : **toujours présent** (finding, avec preuve), **corrigé** (le dire, une ligne), **non vérifiable statiquement** (à passer au runtime, section 5).
2. Lancer les **sondes statiques** ci-dessous sur les fichiers concernés. Une sonde qui matche n'est pas un finding : ouvrir le code et qualifier.

```bash
# Titres simulés (9.1 / 8.9) : Typography stylé en titre sans balise de titre
grep -nE 'variant="h[1-6]"' <fichiers> | grep -v 'component="h'
# Éléments cliquables non natifs (7.3)
grep -nE '<(Box|div|span|Typography|Stack)[^>]*onClick' <fichiers>
# Ordre de tabulation forcé (12.8) et outline supprimé (10.7)
grep -nE 'tabIndex=\{[1-9]|outline: *"?none' <fichiers>
# Liens nouvelle fenêtre sans avertissement (13.2 / 6.1)
grep -nE 'target="_blank"' <fichiers> | grep -viE 'nouvelle fenêtre|title='
# Champs sans étiquette explicite (11.1) : input MUI/HTML sans label/aria
grep -nE '<(TextField|Input|OutlinedInput|Select|TextareaAutosize|input|textarea|select)\b' <fichiers> | grep -vE 'label=|aria-label|aria-labelledby|id='
# Autocomplete manquant sur données personnelles (11.13)
grep -nEi 'name="?(nom|prenom|first_?name|last_?name|email|telephone|phone|tel|adresse)' <fichiers> | grep -v autoComplete
# Messages dynamiques sans zone live (7.5)
grep -nE 'useToast|setError|Alert|CircularProgress|Skeleton' <fichiers> | grep -vE 'role=|aria-live'
# Icône seule sans nom accessible (1.1 / 6.2 / 11.9)
grep -nE 'iconId=|fr-icon-|<Icon\b' <fichiers> | grep -vE 'title=|aria-label|aria-hidden'
# Images sans alt (1.1 / 1.2)
grep -nE '<(img|Image)\b' <fichiers> | grep -v 'alt='
# Balise lang sur texte étranger (8.7)
grep -nE '\b(Open source|Data|Dashboard|Newsletter|Cookies?|Widget)\b' <fichiers> | grep -v 'lang='
```

3. Pour les composants d'interface complexes (combobox, modale, onglets, tooltip, menu, accordéon, tableau triable), comparer l'implémentation au pattern APG correspondant listé dans `patterns-stack.md`. Une divergence de rôle, d'état (`aria-expanded`, `aria-selected`, `aria-invalid`) ou de clavier (Échap, flèches, retour du focus) est un finding 7.1 ou 7.3.

### Angles morts récurrents (à passer systématiquement)

- **A — Le nom accessible ≠ le libellé visible.** Un `aria-label` qui ne contient pas le texte affiché casse la commande vocale (WCAG 2.5.3). Vérifier chaque `aria-label`, `title`, `homeLinkProps`.
- **B — L'`id` référencé.** Chaque `aria-labelledby`, `aria-describedby`, `aria-controls`, `htmlFor` doit pointer un `id` existant, unique, rendu **dans le même arbre DOM au même moment** (attention aux deux arbres desktop/mobile rendus en `display: none`, cf. `RechercheLayoutClient.tsx`). Préférer `useId()`.
- **C — Le composant tiers fait-il vraiment le travail ?** `Autocomplete` MUI pose `role="combobox"` et `listbox`, mais un `renderGroup` personnalisé peut produire des `<li>` sans `role="option"` (finding 7.1 de l'audit sur l'accueil). Lire le DOM produit, pas la doc.
- **D — Navigation client sans rechargement.** Après `router.push`, un filtre, une pagination ou une ouverture de panneau : où va le focus, le `<title>` change-t-il, le résultat est-il annoncé (`aria-live`) ? Défaut 12.8 transverse de l'audit.
- **E — L'erreur de formulaire.** À la soumission en erreur : `aria-invalid` sur le champ, message lié par `aria-describedby`, focus déplacé sur le premier champ en erreur, format attendu indiqué **avant** la saisie. Formik ne fait rien de tout ça par défaut.
- **F — Le contenu masqué.** `display: none`, `hidden`, `aria-hidden="true"` sur un contenu qui doit être lu ; `fr-sr-only` sur un contenu qui doit être vu. Un `aria-hidden` sur un élément focusable est une erreur bloquante.
- **G — La couleur seule.** Onglet actif, filtre sélectionné, champ en erreur, badge de statut : un second indicateur (texte, icône, `aria-selected`, `aria-current`) est obligatoire.

---

## 5. Vérifier par exécution

Aucune affirmation ne sort d'une lecture seule. Ce qui se vérifie statiquement se vérifie par `grep` et lecture du code. Le reste passe au navigateur.

**Statique** : `yarn typecheck` si des props ARIA typées ont été ajoutées (MUI refuse `aria-*` mal placé dans `slotProps`).

**Runtime** (obligatoire en `--runtime`, recommandé dès qu'un finding dépend du DOM rendu, du focus, du contraste ou d'un composant MUI) :

1. `preview_start` avec `name: "ui-dev"` (et `server-dev` si la page appelle l'API). Naviguer vers la route concernée.
2. `read_page` : arbre d'accessibilité réel. Vérifier noms, rôles, états, hiérarchie des titres, landmarks. C'est la preuve de référence pour 7.1, 9.1, 9.2, 11.1, 12.6.
3. `javascript_tool` pour les contrôles mécaniques :

```js
// Titres et landmarks
[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => h.tagName + ' ' + h.textContent.trim().slice(0, 70))
[...document.querySelectorAll('header,nav,main,footer,[role]')].map(e => e.tagName + ' role=' + (e.getAttribute('role') || '(implicite)') + ' label=' + (e.getAttribute('aria-label') || ''))
document.title; document.documentElement.lang
// Références ARIA cassées (angle mort B)
[...document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')].flatMap(e => ['aria-labelledby','aria-describedby','aria-controls'].flatMap(a => (e.getAttribute(a) || '').split(' ').filter(Boolean).filter(id => !document.getElementById(id)).map(id => a + '→#' + id + ' manquant sur ' + e.outerHTML.slice(0, 80))))
// ids dupliqués (8.2)
Object.entries([...document.querySelectorAll('[id]')].reduce((m, e) => (m[e.id] = (m[e.id] || 0) + 1, m), {})).filter(([, n]) => n > 1)
```

4. **axe-core** injecté depuis cdnjs (CSP actuelle : cdnjs non autorisé dans `script-src`) puis exécuté :

```js
await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js'; s.onload = ok; s.onerror = ko; document.head.appendChild(s) })
const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })
r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 5).map(n => n.target.join(' ')) }))
```
   Si l'injection échoue (CSP), le dire et s'en tenir à `read_page`. axe ne remplace pas la revue : il ne détecte ni les intitulés non pertinents, ni la gestion du focus, ni les titres simulés.

5. **Clavier** : `computer` avec `key: "Tab"` en répétition, puis `screenshot` : le focus est-il visible (10.7), l'ordre suit-il la lecture (12.8), Échap ferme-t-il modale et tooltip (7.3, 10.13), le focus revient-il sur le déclencheur ?
6. **Contraste** : `getComputedStyle` sur le texte et son fond, ratio calculé (formule WCAG). Seuils : 4,5:1 texte courant, 3:1 texte ≥ 24 px ou gras ≥ 18,5 px et composants d'interface (3.2, 3.3).
7. **Zoom 200 % et reflow 320 px** : `resize_window` en `mobile`, puis `javascript_tool` `document.documentElement.scrollWidth > innerWidth` (10.4, 10.11).

Si la vérification est impossible : écrire « Incertain — vérification au runtime requise » et le compter à part dans le récapitulatif. Ne jamais présenter une hypothèse comme un fait.

---

## 6. Chiffrer et restituer

### Points à gagner

Méthode de la grille d'audit (`audit-2025.md`, section « Calcul du score ») :
- Le **taux global** = critères C / (C + NC), tous critères NA exclus. Audit : 29 / 60 = **48,33 %**.
- Un critère passe NC → C **uniquement** quand il ne reste aucune page de l'échantillon en NC sur ce critère. Chaque bascule vaut **+1,67 pt** (100 / 60).
- Une correction sur une seule page ne fait pas bouger le taux global ; elle fait progresser le **taux moyen par page** (74,21 %) : +100 / (C + NC de la page) sur cette page, soit environ +2 pts sur la page, +0,08 pt sur la moyenne.

Pour chaque finding, indiquer donc : statut audit du critère (C / NC / NA), pages de l'échantillon encore NC, si la correction proposée **fait basculer le critère** (toutes les pages NC couvertes) et le gain correspondant. Si le critère est C dans l'audit, la correction évite une **régression de −1,67 pt** : le dire ainsi. Si le critère est NA dans l'audit et devient applicable (nouvelle vidéo, nouvel iframe), le dire : il entre au dénominateur.

Ces chiffres se rapportent à l'échantillon de 27 pages du 25/11/2025. Signaler quand une page touchée n'en fait pas partie : le gain est alors « hors échantillon, non chiffrable ».

### Format de restitution (mode autonome)

Concis : le fait, la preuve, l'action. Numérotation `R1, R2…` stable.

```
Périmètre : <n> fichiers UI · <n> pages (P01, P13, hors échantillon : /rdva)
Findings : Bloquant X · Majeur X · Mineur X   Préexistants : X   Incertain (runtime) : X
Gain potentiel : +X,XX pts sur le taux global (n critères basculent) · régressions évitées : n
Vérifié par : <grep, typecheck, read_page, axe, clavier>   Confiance : Élevée / Moyenne / Faible
```

Puis, dans l'ordre, en omettant toute section vide :

**Bloquant** / **Majeur** / **Mineur** (objectif 1, le diff) — pour chacun :
`Rn — <critère RGAA> (WCAG <SC>) — fichier:ligne`
le fait en une phrase · l'impact utilisateur · la correction (bloc de code) · score : `NC audit sur P22, P23 → bascule : non (reste P23) · +0 pt global, +2,08 pts P22`.

**Défauts préexistants sur les composants touchés** (objectif 2) — même format, préfixe `Rn (préexistant)`. Proposer d'ouvrir une issue via `/lba-issue` plutôt que d'élargir la PR, sauf si la correction tient en quelques lignes dans un fichier déjà modifié.

**Corrigé par cette PR** — critères NC de l'audit que le diff règle, une ligne chacun, avec le gain.

**Conformes vérifiés** — une ligne : les critères effectivement contrôlés et conformes sur le périmètre. C'est ce qui rend la revue crédible.

Terminer par un `AskUserQuestion` : appliquer les corrections (toutes ou une sélection par numéro), lancer la vérification runtime, ouvrir les issues des préexistants (`/lba-issue`), enchaîner `/pull-request-lba`.

### Sévérité (échelle de l'audit)

- **Bloquant** : empêche une majorité d'utilisateurs en situation de handicap de percevoir ou d'interagir (champ sans étiquette, composant inutilisable au clavier, piège au focus, image porteuse d'information sans alternative, focus invisible, limite de temps non contrôlable).
- **Majeur** : difficulté réelle mais contournable (contraste, titre simulé, lien non explicite, message d'erreur non associé, message de statut non annoncé, landmark manquant).
- **Mineur** : gêne sans blocage (`autocomplete`, `lang` sur un mot, liste non structurée, légende de tableau).

---

## 7. Appliquer les corrections

1. Corriger les points demandés (par numéro : « fait R1-R3 »). Un point refusé ou reporté se dit, il ne se corrige pas en silence.
2. Respecter les patterns de `patterns-stack.md` : composant react-dsfr d'abord (`Input`, `Button`, `Accordion`, `Tabs`, `Table`, `SkipLinks`, `Badge`, `Alert`, `Tooltip`), MUI ensuite via `slotProps` / `inputProps` / `component=`, HTML natif enfin. Pas de `div` cliquable, pas de `tabIndex` positif, pas d'`aria-live` sur un `role="alert"`.
3. `useId()` pour tout couple label / champ / message d'erreur. Jamais d'`id` en dur dupliqué entre desktop et mobile.
4. Relancer `yarn typecheck` puis, si un DOM a changé, la vérification runtime de la section 5 sur la page concernée. Joindre la preuve (arbre `read_page` ou capture).
5. Ne pas commiter ni pousser : l'utilisateur commite lui-même. Enchaîner sur `/pull-request-lba` s'il le demande.
6. Une correction transverse (Header, Footer, layout) se mentionne avec son effet sur les 27 pages et le nombre de critères qui basculent.

---

## Règles importantes

- Justifier chaque finding par le critère, la preuve et l'impact. Proposer une correction concrète en React, jamais en HTML abstrait quand un composant DSFR ou MUI existe.
- Ne pas inventer de problème. Un thème sans objet se dit en un mot. Une revue sans finding se dit en une ligne, avec la liste des critères vérifiés.
- Distinguer toujours ce qui vient du diff (objectif 1, bloque la PR si Bloquant) de ce qui préexiste (objectif 2, dette chiffrée, jamais bloquant pour la PR).
- Les chiffres de points s'appuient sur la grille du 25/11/2025 : les citer comme tels, signaler toute page hors échantillon.
- Aucune mention de Claude, d'IA ou d'outil de génération dans un texte destiné à la PR.
