# RGAA 4.1.2 — Les 106 critères traduits en tests de code (React / Next.js / MUI / react-dsfr)

Format de chaque entrée :
`n.n — Question résumée · WCAG 2.2 · Vérif. · Sévérité par défaut · Audit 11/2025`
- **Vérif.** : `S` = vérifiable statiquement dans le code TSX/CSS · `R` = exige le DOM rendu (navigateur, `read_page`, axe, clavier) · `S+R` = les deux.
- **Sévérité** : échelle de l'audit (Bloquant / Majeur / Mineur), à ajuster selon le contexte réel.
- **Audit** : statut global dans la grille du 25/11/2025 (C conforme, NC non conforme, NA non applicable) et pages NC. Un critère NC ne bascule en C qu'une fois toutes ses pages corrigées (voir `audit-2025.md`).
- La correspondance WCAG est indicative (RGAA 4.1 est aligné sur WCAG 2.1 ; WCAG 2.2 ajoute des critères listés en fin de fichier).

---

## Thème 1 — Images

**1.1 — Image porteuse d'information : alternative textuelle ?** · 1.1.1 · S · Bloquant · Audit **NC** (P23)
Chercher : `<img>` / `next/image` sans `alt` ; `<svg>` informatif sans `role="img"` + `aria-label` ou `<title>` ; `<Icon>`, `fr-icon-*`, `iconId` seul dans un bouton ou lien sans `title` / `aria-label` / texte `fr-sr-only` ; image CSS (`background-image`) porteuse d'info sans texte équivalent. Logos partenaires avec `alt=""` alors que le nom n'est écrit nulle part (ticket P23).

**1.2 — Image de décoration ignorée par les TA ?** · 1.1.1 · S · Majeur · Audit **NC** (P05, P14, P15, P16, P17)
Chercher : `<img>` décorative sans `alt=""` ; `<svg>` décoratif sans `aria-hidden="true" focusable="false"` (icône de localisation ItemDetail) ; icône `fr-icon-*` ou émoji à côté d'un texte sans `aria-hidden="true"` ; `<Image alt="…">` qui répète le texte adjacent (à passer en `alt=""`).

**1.3 — Alternative pertinente ?** · 1.1.1 · S · Majeur · Audit **NC** (P10)
Lire chaque `alt` : pas de « image », « logo », nom de fichier, ni redite du texte voisin ; pour un logo, le texte visible sur l'image (ticket P10 : `alt="un jeune une solution"` → `#1jeune1solution`). Un `alt` de lien-image décrit la destination.

**1.4 / 1.5 — CAPTCHA** · 1.1.1 · S · Bloquant · Audit NA
Pas de CAPTCHA dans LBA. Si un jour introduit : `alt` décrivant la nature (pas la réponse) + alternative audio ou autre.

**1.6 / 1.7 — Description détaillée si nécessaire, et pertinente** · 1.1.1 · S · Majeur · Audit NA
Graphique, infographie, schéma (page Statistiques, baromètre) : `aria-describedby` vers un texte, ou texte adjacent, ou tableau de données équivalent.

**1.8 — Image texte remplaçable par du texte stylé ?** · 1.4.5 · S · Mineur · Audit NA
Bannière ou titre en PNG : remplacer par du texte CSS. Exception : logos.

**1.9 — Légende reliée à l'image ?** · 1.3.1 · S · Mineur · Audit NA
`<figure>` + `<figcaption>` (ou `role="figure"` + `aria-label`).

## Thème 2 — Cadres

**2.1 / 2.2 — Chaque `<iframe>` a un `title`, pertinent ?** · 4.1.2, 2.4.1 · S · Bloquant / Majeur · Audit NA
Chercher `<iframe` sans `title=`. Le titre décrit le contenu (« Vidéo de présentation du service », pas « iframe »). Le widget LBA embarqué chez les partenaires est concerné côté intégrateur : le documenter dans `espace-developpeurs`.

## Thème 3 — Couleurs

**3.1 — Information pas donnée uniquement par la couleur** · 1.4.1 · S+R · Majeur · Audit C
Onglet actif, filtre sélectionné, champ en erreur, statut d'offre, lien dans un paragraphe : exiger un second indicateur (texte, icône `aria-hidden` + texte, soulignement, `aria-selected`, `aria-current`, `aria-invalid`). Régression facile sur un `Badge` ou un `sx={{ color }}` conditionnel.

**3.2 — Contraste texte / fond ≥ 4,5:1 (3:1 si ≥ 24 px ou gras ≥ 18,5 px)** · 1.4.3 · R (S si couleurs en dur) · Majeur · Audit **NC** (P07, P26)
Couleurs DSFR (`fr.colors.decisions.*`) : conformes par construction sur fond DSFR. Vigilance sur `sx` avec hex en dur, texte sur image ou dégradé, `MuiTypography` grisé (`text.secondary`), petits libellés de tableau (ticket P07), items de menu MUI au survol (P26). Calculer le ratio au runtime.

**3.3 — Contraste des composants d'interface et éléments graphiques ≥ 3:1** · 1.4.11 · R · Majeur · Audit **NC** (P01, P07)
Bordure de champ, fond de l'option survolée dans une liste d'autocomplétion (P01), fond de l'onglet au focus (P07), icônes informatives, indicateur de focus.

## Thème 4 — Multimédia

**4.1 à 4.13** · 1.2.1 → 1.2.5, 1.4.2, 2.1.1, 4.1.2 · S+R · Bloquant (4.1, 4.3, 4.11) sinon Majeur · Audit NA (aucun média)
Si une `<video>` / `<audio>` ou un lecteur embarqué entre dans le diff, le critère devient applicable et entre au dénominateur du score. Exiger : transcription textuelle ou audiodescription (4.1/4.2), `<track kind="captions">` synchronisé (4.3/4.4), média identifiable par un texte adjacent (4.7), pas de son automatique > 3 s sans contrôle (4.10), lecteur contrôlable au clavier (4.11/4.12), compatible TA (4.13). Pour un média non temporel (carte Leaflet, SVG interactif) : alternative (4.8/4.9) et contrôle clavier (4.12).

## Thème 5 — Tableaux

**5.1 / 5.2 — Tableau complexe : résumé présent et pertinent** · 1.3.1 · S · Majeur · Audit NA
En-têtes sur deux niveaux : `aria-describedby` vers un texte de résumé.

**5.3 — Tableau de mise en forme : linéarisation compréhensible** · 1.3.2 · S · Majeur · Audit NA
Pas de `<table>` pour la mise en page. Si inévitable : `role="presentation"`, aucun `<th>`, `<caption>`, `scope`.

**5.4 / 5.5 — Titre du tableau associé et pertinent** · 1.3.1 · S · Mineur · Audit NA
`<caption>` (peut être `fr-sr-only`) ou `aria-labelledby`. Composant DSFR `Table` : prop `caption`. `TableWithPagination` / `VirtualTable` / `Table` de l'espace pro : vérifier qu'un `caption` est passé.

**5.6 — En-têtes de colonnes et de lignes déclarés** · 1.3.1 · S · Majeur · Audit **NC** (P26)
Chaque colonne a un `<th scope="col">` avec contenu textuel (un `fr-sr-only` « Actions » pour la colonne d'actions, ticket P26). Pas de `<td>` en gras à la place d'un `<th>`. Pas de `role` fantaisiste (`role="hack"` relevé en P26).

**5.7 — Association cellules / en-têtes correcte** · 1.3.1 · S · Majeur · Audit C
`scope="col"` / `scope="row"` ; tableau complexe : `id` sur les `<th>` + `headers` sur les `<td>`.

**5.8 — Tableau de mise en forme sans éléments de données** · 1.3.1 · S · Majeur · Audit NA

## Thème 6 — Liens

**6.1 — Chaque lien est explicite ?** · 2.4.4 · S · Majeur · Audit **NC** (27 pages : transverse)
Un intitulé se comprend seul ou avec son contexte immédiat (phrase, `<li>`, titre précédent, cellule). Défauts LBA : « En savoir plus », « C'est parti ! », `aria-label` qui **ne reprend pas** le texte visible (WCAG 2.5.3, très fréquent dans l'audit : `aria-label="Localisation sur google maps - nouvelle fenêtre"` sur un lien affichant l'adresse), logo header avec `title` ≠ nom complet visible (« RÉPUBLIQUE FRANÇAISE » + « La bonne alternance »), lien-image dont le `alt` ne dit pas la destination, lien externe sans mention « nouvelle fenêtre ». Règle : le nom accessible **commence par** le texte visible, puis complète (« Blog - nouvelle fenêtre »). Voir `patterns-stack.md` § Liens.

**6.2 — Chaque lien a un intitulé ?** · 2.4.4, 1.1.1 · S · Bloquant · Audit C
`<a>` / `NextLink` / `DsfrLink` contenant seulement une icône ou un `<svg>` : exiger `aria-label`, `title` ou texte `fr-sr-only`. Lien d'ancre `notion-hash-link` avec svg nu (ticket P03).

## Thème 7 — Scripts

**7.1 — Composant scripté compatible TA (nom, rôle, état, valeur) ?** · 4.1.2, 1.3.1 · S+R · Majeur (Bloquant si sans intitulé) · Audit **NC** (12 pages)
Le plus gros gisement de l'audit. Tests :
- **Rôle exact** : liste d'autocomplétion → `role="listbox"` + `<li role="option">` (P01 : `renderGroup` MUI produit des `li` sans rôle) ; tooltip → `role="tooltip"` + `aria-describedby` sur le déclencheur ; onglets → `tablist` / `tab` / `tabpanel` ; menu → `aria-haspopup` + `aria-expanded` ; `summary` d'un `<details>` Notion → `role="button"` (P05) ; item de side-menu qui agit comme un onglet → `<button>` ou `role="button"` et `aria-current="true"` (pas `page`) (P06).
- **Intitulé** : bouton icône (`+`, loupe, croix, `?`, flèche de tri, engrenage « Actions ») sans texte → `title` **et** `fr-sr-only` ou `aria-label` reprenant la fonction (P13, P15, P23, P26). Un `title="label"` ou `title="close"` n'est pas un intitulé.
- **État** : `aria-expanded`, `aria-selected`, `aria-pressed`, `aria-current`, `aria-sort`, `aria-invalid`, `aria-busy` synchronisés avec l'état React.
- **Nom ≠ visible** : `aria-label="Ouvrir le formulaire d'envoi de candidature"` sur un bouton affichant « J'envoie ma candidature » (P15) → faire commencer l'`aria-label` par le texte visible ou le supprimer.

**7.2 — Alternative au script pertinente** · (4.1.2) · S · Majeur · Audit NA
Next.js rend côté serveur : vérifier qu'un contenu essentiel n'est pas exclusivement dans un `ClientOnly` sans repli.

**7.3 — Composant scripté contrôlable au clavier et à tout pointage ?** · 2.1.1 · S+R · Bloquant · Audit **NC** (P22, P23, P26, P27)
Chercher : `<Box|div|span onClick>` sans `role="button"` + `tabIndex={0}` + `onKeyDown` (Entrée/Espace) ; déclencheur de tooltip sur une icône `<span>` (P22, P27 : envelopper dans `<button type="button">`) ; en-tête de tableau triable cliquable sans bouton (P26) ; dropzone `react-dropzone` avec `tabIndex` sur la `div` et `-1` sur l'input (P15) ; `Popper` / menu MUI sans gestion Échap ; combobox dont les options ne sont pas atteignables aux flèches (P22, P24). Un `swipe` (`react-swipeable`) exige un équivalent bouton.

**7.4 — Changement de contexte : averti ou contrôlé ?** · 3.2.1, 3.2.2 · S · Majeur · Audit C
Pas de `router.push` ni de soumission sur `onChange` d'un `Select` / `Checkbox` sans bouton de validation ; pas d'ouverture de fenêtre au focus.

**7.5 — Messages de statut restitués par les TA ?** · 4.1.3 · S+R · Majeur · Audit **NC** (P01, P13, P22, P23, P24, P26, P27)
Tout changement de contenu sans déplacement de focus : nombre de suggestions d'une autocomplétion, nombre de résultats après filtre ou recherche (P01, P13, P22, P24, P26), confirmation d'enregistrement, chargement (`CircularProgress`, `Skeleton`), toast. Exiger une zone `aria-live="polite"` / `role="status"` **présente dans le DOM avant** le changement, remplie ensuite (texte `fr-sr-only` accepté) ; erreurs → `role="alert"`. Voir `patterns-stack.md` § Zones live.

## Thème 8 — Éléments obligatoires

**8.1 / 8.2 — Doctype ; code source valide** · (4.1.1 supprimé en WCAG 2.2, reste dans RGAA) · S+R · Majeur · Audit C
Next émet le doctype. Vérifier : `id` uniques (deux arbres desktop/mobile !), pas de `<a>` dans `<button>` ni `<button>` dans `<a>` (tickets P02, P08 : `fr-btn` contenant un lien), pas de `<div>` dans `<p>` (`Typography` par défaut rend un `<p>` : un `Box` enfant produit un `<div>` dans un `<p>`), pas de `<li>` hors liste, attributs ARIA valides pour le rôle.

**8.3 / 8.4 — Langue par défaut présente et pertinente** · 3.1.1 · S · Bloquant · Audit C
`ui/app/layout.tsx` pose `lang="fr"`. Vérifier tout nouveau `layout` racine, `global-error.tsx`, page widget.

**8.5 / 8.6 — Titre de page présent et pertinent** · 2.4.2 · S+R · Bloquant / Majeur · Audit **NC** 8.6 (P04, P06)
Chaque `page.tsx` exporte `metadata.title` (ou `generateMetadata`) unique, au format `Nom de la page - La bonne alternance`. Ticket : pages Accessibilité et Ressources rendaient deux `<title>` (le générique et le spécifique). En navigation client, le `<title>` doit changer avec la route (12.8).

**8.7 / 8.8 — Changement de langue signalé, code valide** · 3.1.2 · S · Majeur (Mineur si un mot) · Audit **NC** 8.7 (P14, P15, P16, P17, P26)
Attributs `title="previous"`, `"next"`, `"close"`, `"Toggle SortBy"`, `"label"` en anglais (P14, P15, P26) : traduire, jamais `lang="en"` sur un attribut. Texte visible en anglais (« Open source », nom de produit hors marque) : `<span lang="en">`. Noms propres et marques exemptés.

**8.9 — Balises non détournées à des fins de présentation** · 1.3.1 · S · Mineur (Majeur si titre) · Audit **NC** (13 pages)
Chercher : deux `<h1>` pour le même titre (desktop + mobile, P04, P09, P11, P12) ; `<div><span>` pour un paragraphe (P03, P05, P11, P12, P14–P17, P22) → `<Typography component="p">` ou `<p>` ; `<Typography variant="h2">` rendu `<h2>` pour de la taille sans rôle de titre (l'inverse du 9.1) ; doubles `<br>` pour espacer (P07, P17) ; `<p></p>` vides (P05, P16) ; `<em>` / `<strong>` pour la couleur.

**8.10 — Changement de sens de lecture signalé** · 1.3.2 · S · Mineur · Audit NA
`dir="rtl"` si texte arabe/hébreu.

## Thème 9 — Structuration

**9.1 — Information structurée par des titres appropriés ?** · 1.3.1, 2.4.6 · S+R · Majeur · Audit **NC** (27 pages : transverse)
Tests : un `<h1>` unique décrivant la page (accueil : le `<h1>` était « Vous révéler le marché caché de l'emploi » au lieu de « Se former et travailler en alternance ») ; aucune rupture de niveau ; **aucun titre simulé** : `<Typography variant="body1" fontWeight="bold">`, `<p className="fr-text--lead fr-text--bold">`, `fr-h3` sur un `<p>` (P01, P06, P08, P13, P14, P15, P17, P18–P20, P22) → `<Typography variant="h2" component="h2">` ; footer : `fr-footer__top-cat` en `<h3>` sans `<h2>` parent → `<h2>` (ou `<h2 class="fr-sr-only">` de section, déjà présent dans `Footer.tsx` : vérifier la cohérence) ; accordéon `Accordion` DSFR : `titleAs` au bon niveau (P17 : `h3` sous un `h4`).

**9.2 — Structure du document cohérente (landmarks) ?** · 1.3.1, 2.4.1 · S+R · Majeur · Audit **NC** (27 pages : transverse)
Un `<header>` (`role="banner"`), un `<nav>` principal, un seul `<main>` visible, un `<footer>` (`contentinfo`). L'audit relevait l'absence de `<nav>` autour du menu. Les pages de processus sans header (recherche, détail d'offre) doivent quand même avoir `<main>` et un `<footer>` ou un retour vers une page complète (12.2). Vérifier chaque nouveau `layout.tsx` de groupe.

**9.3 — Listes correctement structurées ?** · 1.3.1 · S · Majeur · Audit **NC** (P05, P07, P11, P12, P15, P16, P17)
Étapes numérotées → `<ol>` (P01, P07) ; puces textuelles « • » ou tirets dans un `Typography` → `<ul><li>` (P15) ; suite de `<ul>` à un item chacun (rendu Notion, P11, P12) → une seule liste ; liste imbriquée : `<ul>` dans le `<li>` parent (P05). MUI `List` rend `<ul>` : ne pas mettre `component="div"` sur une vraie liste.

**9.4 — Citations indiquées ?** · 1.3.1 · S · Mineur · Audit NA (mais ticket P17)
Exemple de message cité → `<q>` ; bloc → `<blockquote>` (composant DSFR `Quote`).

## Thème 10 — Présentation

**10.1 — Présentation contrôlée par CSS** · 1.3.1 · S · Mineur · Audit C
Pas de `<center>`, `<font>`, attributs `align`, `bgcolor`, `border`.

**10.2 — Contenu visible porteur d'info présent sans CSS ?** · 1.3.1, 1.1.1 · S · Majeur (Bloquant si seul vecteur) · Audit **NC** (27 pages : transverse)
Toute icône CSS porteuse de sens (`fr-icon-*` en `::before`, icône « lien externe » du DSFR sur `target="_blank"`, loupe, croix, flèche de tri, engrenage) doit avoir un équivalent texte dans le DOM : `title="Blog - nouvelle fenêtre"` sur le lien ou `<span className="fr-sr-only">`. Footer : liens externes Blog / Code source (transverse). Boutons icône-only : `fr-sr-only` + `title`.

**10.3 — Information compréhensible sans CSS (ordre du code) ?** · 1.3.2 · S · Majeur · Audit **NC** (P22, P23)
L'ordre DOM suit l'ordre de lecture : bloc « Votre OPCO » positionné en CSS loin de sa place logique (P22) ; `order` flex / `Grid` réordonnant visuellement des étapes ; `position: absolute` sortant un bouton d'action de son formulaire.

**10.4 — Lisible à 200 % de zoom** · 1.4.4 · R · Majeur · Audit C
Pas de `height` fixe + `overflow: hidden` sur du texte, pas de `font-size` en `px` pour le texte courant, pas de `user-scalable=no`. Tester `resize_window` + zoom.

**10.5 — Couleurs de fond et de police déclarées ensemble** · (1.4.8) · S · Majeur · Audit C
Un `sx={{ color }}` sur un conteneur dont le `backgroundColor` n'est pas maîtrisé (ou l'inverse) : déclarer les deux.

**10.6 — Liens visibles dans le texte (autre que par la couleur)** · 1.4.1 · S+R · Majeur · Audit C
Lien dans un paragraphe : soulignement (DSFR `fr-link` le fait) ou contraste ≥ 3:1 avec le texte + indicateur au survol/focus. `MuiLink underline="none"` dans du texte = régression.

**10.7 — Prise de focus visible ?** · 2.4.7 · S+R · Bloquant · Audit **NC** (P01, P03, P04, P05, P11, P12)
Chercher `outline: "none"`, `outline: 0`, `:focus { outline: none }` sans `:focus-visible` de remplacement (`CustomTabs.tsx` en contient un). Liens `notion-link` sans focus visible (P03–P05, P11, P12). Le DSFR fournit `outline: 2px solid #0a76f6` : ne pas l'écraser dans `application.css`, `notion.css` ou un `sx`. WCAG 2.2 ajoute 2.4.11 : le focus ne doit pas être masqué par un header/footer `sticky` (`scroll-padding-top`).

**10.8 — Contenus cachés à bon escient ?** · 1.3.1, 4.1.2 · S · Majeur · Audit C
`display: none` / `hidden` / `aria-hidden` uniquement sur ce qui doit être ignoré par tous (panneau fermé, arbre mobile inactif). Un `aria-hidden="true"` sur un élément focusable ou contenant du focus = bloquant. Texte pour TA : `fr-sr-only`, jamais `display: none` ni `font-size: 0`.

**10.9 / 10.10 — Information pas donnée uniquement par forme, taille ou position** · 1.3.3 · S · Majeur · Audit C
« Le bouton à droite », « le champ en rouge » : ajouter le libellé.

**10.11 — Reflow : pas de défilement horizontal à 320 px** · 1.4.10 · R · Majeur · Audit C
`resize_window` mobile + `scrollWidth > innerWidth`. Exceptions : tableaux de données, cartes.

**10.12 — Espacement du texte redéfinissable** · 1.4.12 · R · Majeur · Audit C
Pas de hauteur fixe qui tronque avec `line-height: 1.5`, `letter-spacing: 0.12em`, `word-spacing: 0.16em`, `paragraph-spacing: 2em`.

**10.13 — Contenus additionnels au survol / focus contrôlables ?** · 1.4.13 · S+R · Majeur · Audit **NC** (P22, P23, P27)
Tooltip : fermable par Échap sans bouger le pointeur, persistant quand le pointeur passe dessus, reste affiché tant que le focus/survol dure. MUI `Tooltip` gère Échap si le déclencheur est focusable ; le DSFR `Tooltip` aussi. Un tooltip maison sur `onMouseEnter` seul = finding 10.13 + 7.3.

**10.14 — Contenus additionnels CSS-only atteignables au clavier** · 1.4.13, 2.1.1 · S · Bloquant · Audit NA
Menu ou sous-menu ouvert au `:hover` : doit aussi s'ouvrir au `:focus-within` ou par un bouton.

## Thème 11 — Formulaires

**11.1 — Chaque champ a une étiquette ?** · 1.3.1, 3.3.2, 4.1.2 · S+R · Bloquant · Audit **NC** (P21, P22, P23, P24, P27)
Association par `<label htmlFor>` + `id`, ou `aria-labelledby`, ou `aria-label` (visible manquant), ou `title`. Défauts LBA : `<FormLabel>` MUI sans `htmlFor` + `<Input>` sans `id` (P21, P22, P27) ; combobox downshift / MUI `Autocomplete` avec seulement un `placeholder` (P22, P23, P24) ; `FormControlLabel` + `Checkbox` sans `id` (P11, P15) ; `<textarea id="message">` sans `<label for>` (P15). DSFR `Input` fait l'association si `label` est fourni. Un `placeholder` n'est pas une étiquette.

**11.2 — Étiquette pertinente (contient le libellé visible) ?** · 2.4.6, 2.5.3 · S · Majeur · Audit C
`aria-label` ≠ texte visible = finding. Éviter « Saisir », « Champ ».

**11.3 — Étiquettes cohérentes entre formulaires** · 3.2.4 · S · Mineur · Audit NA
Même champ, même libellé (« Email » vs « Adresse e-mail » vs « Votre email »).

**11.4 — Étiquette accolée à son champ ?** · 1.3.1, 3.3.2 · S+R · Majeur · Audit **NC** (P23)
Label au-dessus ou à gauche pour texte/select, à droite pour case/radio, contigu dans le DOM. Ticket P23 : « Durée du contrat (mois) » éloigné du champ par le layout.

**11.5 / 11.6 / 11.7 — Champs de même nature regroupés, avec légende pertinente** · 1.3.1 · S · Majeur · Audit **NC** 11.5 (P14, P15, P17, P23) · **NC** 11.6 (P01, P14, P15, P17)
Groupe de cases ou radios, adresse en plusieurs champs : `<fieldset>` + `<legend>` (DSFR `Checkbox` / `RadioButtons` avec prop `legend`), ou `role="group"` / `role="radiogroup"` + `aria-labelledby` vers un texte **existant** (P01 : `aria-labelledby` pointant vers un élément vide → finding 11.6). MUI `RadioGroup` pose `role="radiogroup"` mais pas la légende : ajouter `aria-labelledby` ou envelopper dans `<FormControl component="fieldset">` + `<FormLabel component="legend">`. La légende peut être `fr-sr-only`.

**11.8 — Items d'une liste de choix regroupés** · 1.3.1 · S · Mineur · Audit NA
`<optgroup>` si catégories ; MUI `Select` : `ListSubheader`.

**11.9 — Intitulé de bouton pertinent ?** · 2.4.6, 2.5.3 · S · Majeur · Audit C
`OK`, `Envoyer`, `+` seuls = non pertinents ; `aria-label` doit contenir le texte visible.

**11.10 — Contrôle de saisie pertinent (obligatoire, format, erreur) ?** · 3.3.1, 3.3.2 · S+R · Majeur (Bloquant si erreurs non liées) · Audit **NC** (P01, P14, P15, P17, P21, P22, P23, P27)
Quatre sous-tests, tous relevés dans l'audit :
1. **Mention obligatoire en amont** du formulaire, visible et dans l'ordre du code (« Champs obligatoires * » ou « Tous les champs sont obligatoires »), + `required` / `aria-required` sur les champs.
2. **Format attendu indiqué avant la saisie** (email, téléphone, date, SIRET, fichier CV : types, taille) via `hintText` DSFR ou `aria-describedby`.
3. **Message d'erreur associé** : `aria-invalid="true"` + `aria-describedby` vers l'`id` du message (DSFR `Input` : `state="error"` + `stateRelatedMessage` le fait ; MUI : `error` + `helperText` + `FormHelperText id` le fait ; Formik + `Box` maison ne le fait pas). Le message nomme le champ.
4. **Focus** déplacé sur le premier champ en erreur à la soumission (voir aussi 12.8).

**11.11 — Suggestions de correction** · 3.3.3 · S · Majeur · Audit NA
Le message d'erreur donne le format ou un exemple (« Format attendu : nom@domaine.fr »).

**11.12 — Données modifiables / annulables (conséquence juridique ou financière)** · 3.3.4 · S · Bloquant · Audit NA
Suppression d'offre, d'entreprise, de compte : modale de confirmation (existe : `ConfirmationSuppression*`), à conserver.

**11.13 — Finalité du champ déductible (autocomplete) ?** · 1.3.5 · S · Majeur (Mineur WCAG) · Audit **NC** (P14, P15, P17, P21, P22, P27)
Tout champ de données personnelles : `autoComplete="given-name"`, `family-name`, `email`, `tel`, `organization`, `street-address`, `postal-code`, `address-level2`. DSFR `Input` : `nativeInputProps={{ autoComplete: "email" }}` ; MUI `TextField` : `slotProps={{ htmlInput: { autoComplete } }}`. Deux occurrences seulement dans le repo aujourd'hui.

## Thème 12 — Navigation

**12.1 — Au moins deux systèmes de navigation (menu, plan du site, moteur de recherche) ?** · 2.4.5 · S · Majeur · Audit **NC** (27 pages : transverse)
Un plan du site existe désormais (`ui/app/(editorial)/plan-du-site`) et est lié dans le footer : vérifier qu'il est atteignable depuis **toutes** les pages de l'échantillon (y compris celles sans header : recherche, détail, formulaires depuis mail) avant de considérer le critère basculé.

**12.2 — Menu et barres de navigation à la même place ?** · 3.2.3 · S+R · Majeur · Audit **NC** (P13–P20, P25)
Pages du processus de recherche et pages arrivées par mail sans header ni footer : acceptable pour un processus, mais la sortie (fermeture, fin de parcours) doit renvoyer vers une page complète. Vérifier tout nouveau layout sans `Header`.

**12.3 / 12.4 / 12.5 — Plan du site pertinent, atteignable ; moteur atteignable** · 2.4.5 · S · Mineur · Audit NA (deviendra applicable avec le plan du site)
Le plan du site liste les pages principales et reste à jour quand une route est ajoutée : toute nouvelle `page.tsx` publique doit y figurer (`PAGES.static`).

**12.6 — Zones de regroupement atteignables ou évitables (landmarks) ?** · 1.3.1, 2.4.1 · S+R · Majeur · Audit **NC** (27 pages : transverse)
`<header role="banner">`, `<nav role="navigation" aria-label>` (label distinct par nav : « Menu principal », « Fil d'Ariane », « Pied de page »), `<main role="main">`, `<footer role="contentinfo">`, `<form role="search">` ou `<search>`. L'audit exigeait les rôles explicites en plus des balises.

**12.7 — Lien d'évitement vers le contenu principal ?** · 2.4.1 · S+R · Bloquant · Audit C
`SkipLinks` DSFR en premier dans le `<body>`, ancres existantes (`#main`, `#header-links`, `#footer-links`). Deux arbres desktop/mobile → deux jeux de liens (pattern `RechercheLayoutClient.tsx`). Un widget sans header ne doit pas proposer « Menu ».

**12.8 — Ordre de tabulation cohérent ?** · 2.4.3 · R (S pour `tabIndex`) · Majeur (Bloquant si focus perdu) · Audit **NC** (26 pages : transverse)
Sous-tests : pas de `tabIndex > 0` ; pas de `<a>` dans `<button>` (double arrêt de tabulation, P02, P08) ; après une action qui change le contenu sans rechargement (filtre, onglet, side-menu, ouverture d'un panneau, `router.push`) le focus va sur le nouveau contenu ou son titre (transverse SPA) ; après soumission en erreur, focus sur le premier champ en erreur (P01, P14, P15, P21) ; combobox : options parcourues aux flèches (P22, P24) ; dropzone : un seul arrêt (P15) ; fermeture de modale → focus sur le déclencheur.

**12.9 — Pas de piège au clavier ?** · 2.1.2 · R · Bloquant · Audit C
Modale : focus piégé **et** Échap ferme ; `Popper`, menu, date-picker : Tab sort toujours.

**12.10 — Raccourcis clavier mono-touche désactivables** · 2.1.4 · S · Majeur · Audit NA
Chercher `onKeyDown` global sur une lettre sans modificateur.

**12.11 — Contenus additionnels au survol / focus atteignables au clavier** · 1.4.13 · S+R · Majeur · Audit C
Sous-menu, tooltip : accessibles au focus, ne disparaissent pas au parcours.

## Thème 13 — Consultation

**13.1 — Limite de temps contrôlable ?** · 2.2.1 · S · Bloquant · Audit **NC** (P22, P23, P24, P26, P27)
Session de l'espace pro expirant sans avertissement ni prolongation : avertir avant expiration avec possibilité de prolonger, ou session ≥ 20 h, ou désactivation. Tout `setTimeout` qui déconnecte, efface un formulaire ou masque un contenu est concerné. Un toast qui disparaît seul l'est aussi (WCAG 2.2.1) : préférer fermeture manuelle.

**13.2 — Pas d'ouverture de fenêtre sans action ; nouvelle fenêtre annoncée** · 3.2.5 · S · Mineur (Majeur si non annoncé) · Audit C
`target="_blank"` → intitulé ou `title` « … - nouvelle fenêtre ». `DsfrLink` pose `target` automatiquement sur les liens externes **sans** ajouter la mention : à compléter (voir `patterns-stack.md`).

**13.3 / 13.4 — Documents bureautiques accessibles ou version alternative** · (1.1.1, 1.3.1) · S · Majeur · Audit C
PDF en téléchargement (CERFA, guides) : balisé ou alternative HTML ; lien avec format et poids.

**13.5 / 13.6 — Contenu cryptique (émoji, art ASCII) avec alternative** · 1.1.1 · S · Mineur · Audit NA
Émoji porteur de sens → `<span role="img" aria-label="…">` ; décoratif → `aria-hidden="true"` (P05 : 👉).

**13.7 — Pas de flash > 3/s** · 2.3.1 · R · Bloquant · Audit NA

**13.8 — Contenu en mouvement / clignotant contrôlable (≤ 5 s ou pause)** · 2.2.2 · S+R · Majeur · Audit NA
Carrousel, animation continue : bouton pause et respect de `prefers-reduced-motion`.

**13.9 — Consultable en portrait et paysage** · 1.3.4 · R · Majeur · Audit C

**13.10 — Geste complexe doublé d'un geste simple** · 2.5.1 · S · Majeur · Audit C
`react-swipeable`, carte à pincer : boutons équivalents.

**13.11 — Action au pointeur annulable (déclenchée au relâchement)** · 2.5.2 · S · Majeur · Audit C
Pas d'action sur `onMouseDown` / `onPointerDown` / `onTouchStart` sans annulation.

**13.12 — Fonctionnalité liée au mouvement de l'appareil avec alternative** · 2.5.4 · S · Majeur · Audit NA

---

## WCAG 2.2 AA — critères absents du RGAA 4.1.2 à contrôler en plus

Le RGAA 4.1.2 reste aligné sur WCAG 2.1. Les critères suivants n'entrent pas dans le score RGAA mais sont exigés par WCAG 2.2 AA et la directive européenne ; les signaler en **Majeur** avec la mention « WCAG 2.2 uniquement, hors score RGAA ».

| SC | Exigence | Test dans le code |
|---|---|---|
| **2.4.11 Focus Not Obscured (Minimum)** | L'élément focusé n'est jamais entièrement masqué par un contenu fixe (header sticky, bandeau cookie, barre mobile). | `position: sticky/fixed` → `scroll-padding-top` / `scroll-margin` sur le contenu ; vérifier au clavier (Tab) sous le header. |
| **2.5.7 Dragging Movements** | Toute action par glisser a une alternative sans glisser. | Dropzone CV : bouton « Parcourir » présent (react-dropzone `open()`) ; slider de rayon : saisie clavier possible. |
| **2.5.8 Target Size (Minimum)** | Cible ≥ 24 × 24 px CSS ou espacement suffisant. | Boutons icône `fr-btn--sm`, chips de filtres, liens de pagination, croix de fermeture : vérifier la taille calculée au runtime. |
| **3.2.6 Consistent Help** | Le mécanisme d'aide (contact, FAQ) est au même endroit sur toutes les pages. | Footer présent sur toutes les pages ; pages sans footer → lien d'aide à position stable. |
| **3.3.7 Redundant Entry** | Ne pas redemander une information déjà saisie dans le même parcours. | Formulaires multi-étapes (création de compte, dépôt d'offre) : pré-remplir ou proposer « identique à ». |
| **3.3.8 Accessible Authentication (Minimum)** | Pas de test cognitif à la connexion sans alternative. | Connexion par lien magique (email) : conforme. Ne pas introduire de CAPTCHA ni de transcription de code sans coller autorisé. |
| 4.1.1 Parsing | **Supprimé** de WCAG 2.2 ; RGAA 8.2 s'applique toujours. | — |

## WAI-ARIA 1.2 — règles à faire respecter

1. **HTML natif d'abord** : `<button>`, `<a href>`, `<input>`, `<dialog>`, `<details>` avant tout `role`.
2. **Ne pas changer la sémantique native** sans nécessité (`<h2 role="button">` non ; `<li role="option">` oui dans un `listbox`).
3. **Tout contrôle ARIA est utilisable au clavier** : `role="button"` implique `tabIndex={0}` + Entrée/Espace ; `role="tab"` implique flèches ; `role="option"` implique flèches + `aria-activedescendant` ou focus roving.
4. **Pas de `role="presentation"` ni `aria-hidden="true"` sur un élément focusable.**
5. **Tout élément interactif a un nom accessible** qui contient son libellé visible.
6. **Combobox ARIA 1.2** : `role="combobox"` sur l'`<input>` lui-même (pas sur un wrapper), `aria-expanded`, `aria-controls` → `role="listbox"`, `aria-autocomplete="list"`, `aria-activedescendant` ; options `role="option"` + `aria-selected` ; groupes `role="group"` + `aria-labelledby`.
7. **`aria-label` interdit** sur les rôles génériques (`div`, `span` sans rôle, `role="presentation"`), sur `<p>`, `<li>` hors liste ARIA : le lecteur d'écran l'ignore. Utiliser un élément ou un rôle nommable.
8. **`role="alert"` implique `aria-live="assertive"`, `role="status"` implique `aria-live="polite"`** : ne pas doubler.
9. **Les `id` référencés existent, sont uniques et rendus dans le même DOM** au moment de la lecture.
10. **États synchronisés** : `aria-expanded`, `aria-selected`, `aria-checked`, `aria-pressed`, `aria-current`, `aria-sort`, `aria-invalid`, `aria-busy`, `aria-disabled` reflètent l'état React à chaque rendu.
