# Audit RGAA 4.1.2 — La bonne alternance — 25/11/2025 → 18/12/2025 (Audit-Web)

Sources : `~/Documents/Accessibilité/Rapport Audit RGAA 4.1-DGEFP-20251125.pdf` (147 p.) et `Grille-RGAA-DGEFP-20251125.xlsx` (onglets Synthèse, BaseDeCalcul, Critères, P01–P27). Certaines corrections ont été livrées depuis : **toujours confronter un ticket au code actuel avant de le reporter comme ouvert.**

## 1. Score

| Indicateur | Valeur |
|---|---|
| Taux de conformité global (critères C / (C + NC)) | **48,33 %** (29 / 60) |
| Critères conformes / non conformes / non applicables | 29 / 31 / 46 |
| Taux moyen de conformité par page (moyenne des 27 pages) | 74,21 % |
| Problèmes relevés | 185 : 28 bloquants, 134 majeurs, 23 mineurs |

## 2. Calcul du score et des points à gagner

- **Statut global d'un critère** : NC si au moins une page de l'échantillon est NC ; C si aucune page NC et au moins une C ; NA si NA partout. Le dénominateur est le nombre de critères C + NC (60 aujourd'hui).
- **Faire basculer un critère NC → C = +1,67 pt** sur le taux global (100 / 60). Il faut corriger **toutes** les pages NC de ce critère. Une correction partielle vaut 0 pt sur le taux global.
- **Taux par page** = C / (C + NC) de la page. Corriger un critère sur une page vaut +100 / (C + NC) sur cette page (voir tableau § 3, colonne « Gain / critère ») et 1/27 de cela sur le taux moyen.
- **Régression** : un critère C qui devient NC sur une seule page fait perdre 1,67 pt.
- **Nouvelle applicabilité** : un critère NA qui devient applicable (vidéo, iframe, CAPTCHA…) entre au dénominateur ; s'il est C, le taux devient 30/61 = 49,18 % (+0,85) ; s'il est NC, 29/61 = 47,54 % (−0,79).
- Objectif 100 % = 31 bascules. Les 7 critères transverses (6.1, 9.1, 9.2, 10.2, 12.1, 12.6, 12.8) valent à eux seuls **+11,67 pts** et se corrigent surtout dans Header, Footer, layouts et `DsfrLink`.

### Priorisation par rendement (pages à corriger pour basculer)

| Critère | Pages NC | Bascule | Où corriger principalement |
|---|---|---|---|
| 1.1 | P23 | 1 page | logos partenaires du formulaire d'offre (`alt`) |
| 1.3 | P10 | 1 page | logos A propos (`alt` = texte du logo) |
| 5.6 | P26 | 1 page | `Table*.tsx` espace pro : `<th>` Actions en `fr-sr-only` |
| 11.4 | P23 | 1 page | champ « Durée du contrat » accolé à son label |
| 3.2 | P07, P26 | 2 pages | contrastes tableau statistiques, menu actions |
| 3.3 | P01, P07 | 2 pages | fond option autocomplétion, focus onglets |
| 8.6 | P04, P06 | 2 pages | un seul `<title>` par page |
| 10.3 | P22, P23 | 2 pages | ordre DOM bloc OPCO, formulaire offre |
| 10.13 | P22, P23, P27 | 3 pages | tooltip → `Tooltip` DSFR |
| 7.3 | P22, P23, P26, P27 | 4 pages | tooltips, tri de tableau, bouton `+` |
| 11.5 | P14, P15, P17, P23 | 4 pages | `fieldset`/`legend` sur cases à cocher |
| 11.6 | P01, P14, P15, P17 | 4 pages | légende des groupes (accueil : `aria-labelledby` vide) |
| 1.2 | P05, P14, P15, P16, P17 | 5 pages | svg localisation `aria-hidden` (composant ItemDetail partagé) |
| 8.7 | P14, P15, P16, P17, P26 | 5 pages | `title` anglais → français (composant partagé) |
| 11.1 | P21, P22, P23, P24, P27 | 5 pages | `label for` / `id` MUI, combobox |
| 13.1 | P22, P23, P24, P26, P27 | 5 pages | expiration de session espace pro |
| 10.7 | P01, P03, P04, P05, P11, P12 | 6 pages | focus visible liens Notion + accueil |
| 11.13 | P14, P15, P17, P21, P22, P27 | 6 pages | `autoComplete` |
| 7.5 | P01, P13, P22, P23, P24, P26, P27 | 7 pages | zones live sur autocomplétions et recherches |
| 9.3 | P05, P07, P11, P12, P15, P16, P17 | 7 pages | listes `<ul>/<ol>` (Notion + ItemDetail) |
| 11.10 | P01, P14, P15, P17, P21, P22, P23, P27 | 8 pages | mention obligatoire, format, erreurs liées, focus |
| 12.2 | P13–P20, P25 | 9 pages | navigation des pages de processus |
| 7.1 | P01, P05, P06, P13, P14, P15, P16, P17, P22, P23, P26, P27 | 12 pages | rôles, intitulés de boutons icône |
| 8.9 | P01, P03, P04, P05, P07, P11, P12, P14, P15, P16, P17, P22, P23 | 13 pages | `<p>` sémantiques, `<h1>` doublés, `<br>` |
| 12.8 | toutes sauf P20 | 26 pages | focus après action SPA, formulaires en erreur, `<a>` dans `<button>` |
| 6.1, 9.1, 9.2, 10.2, 12.1, 12.6 | 27 pages | transverse | Header, Footer, layouts, `DsfrLink`, `Typography component` |

## 3. Échantillon audité → routes et composants du repo

| Page | Nom | Route auditée | Code (`ui/`) | C / NC | Gain / critère |
|---|---|---|---|---|---|
| P01 | Accueil | `/` | `app/(home)`, `app/_components/RechercheForm`, `components/SearchForTrainingsAndJobs` | 33 / 14 | +2,13 |
| P02 | Contact | `/contact` | `app/(editorial)/contact` | 33 / 7 | +2,50 |
| P03 | Mentions légales | `/mentions-legales` | `app/(editorial-with-notion)/mentions-legales` (rendu Notion, `public/styles/notion.css`) | 31 / 9 | +2,50 |
| P04 | Accessibilité | `/accessibilite` | `app/(editorial-with-notion)/accessibilite` | 30 / 10 | +2,50 |
| P05 | FAQ | `/faq` | `app/(editorial-with-notion)/faq` (side-menu + `<details>` Notion) | 30 / 12 | +2,38 |
| P06 | Ressources | `/ressources` | route disparue ; contenu réparti dans `app/(editorial)/guide-*` — à confirmer | 33 / 9 | +2,38 |
| P07 | Statistiques | `/statistiques` | `app/(editorial)/statistiques` (`StatistiquesClient.tsx`, onglets) | 29 / 11 | +2,50 |
| P08 | Espace développeurs | `/espace-developpeurs` | `app/(editorial)/espace-developpeurs` | 31 / 7 | +2,63 |
| P09 | Métiers | `/metiers` | `app/(editorial)/metiers` | 31 / 7 | +2,63 |
| P10 | A propos | `/a-propos` | `app/(editorial)/a-propos` | 32 / 8 | +2,50 |
| P11 | Politique de confidentialité | `/politique-de-confidentialite` | `app/(editorial-with-notion)/politique-de-confidentialite` (+ case opt-out Matomo) | 30 / 10 | +2,50 |
| P12 | CGU | `/conditions-generales-utilisation` | `app/(editorial-with-notion)/conditions-generales-utilisation` | 30 / 10 | +2,50 |
| P13 | Résultats de recherche | `/recherche?romes=…` | `app/(candidat)/(recherche)/recherche` (nouveau moteur livré depuis : `SearchBar.tsx`, `SearchFilterChip.tsx`, `RechercheLayoutClient.tsx`) | 29 / 10 | +2,56 |
| P14 | Détail d'une formation | `/formation/[id]/…` | `app/(candidat)/formation`, `components/ItemDetail`, `components/RDV` (formulaire de contact CFA) | 33 / 16 | +2,04 |
| P15 | Détail offre LBA | `/emploi/offres_emploi_lba/…` | `app/(candidat)/emploi`, `components/ItemDetail/CandidatureLba` (modale) | 32 / 17 | +2,04 |
| P16 | Détail offre partenaire | `/emploi/offres_emploi_partenaires/…` | `components/ItemDetail/PartnerJobComponents` | 28 / 13 | +2,44 |
| P17 | Candidature spontanée | `/emploi/recruteurs_lba/…` | `components/ItemDetail` (accordéon « Comment candidater ? »), `CandidatureLba` | 32 / 17 | +2,04 |
| P18 | Réponse négative recruteur | lien mail | `app/(candidat)/formulaire-intention`, `components/IntentionPage`, `components/MailCard.tsx` | 33 / 8 | +2,44 |
| P19 | Réponse positive recruteur | lien mail | idem P18 | 33 / 8 | +2,44 |
| P20 | Réponse CFA | lien mail | `app/(espace-pro)/(from-mail)/proposition/…` ou `components/RDV` — à confirmer | 32 / 7 | +2,56 |
| P21 | Connexion | `/espace-pro/authentification` | `app/(espace-pro)/espace-pro/authentification`, `components/espace_pro/Authentification` | 33 / 10 | +2,33 |
| P22 | Création de compte | `/espace-pro/creation/entreprise` | `app/(espace-pro-creation-compte)`, `components/espace_pro/CreationRecruteur`, `Authentification/CreationCompte.tsx`, `SiretAutocomplete.tsx`, `InformationLegaleEntreprise.tsx`, `InfoToolTip.tsx` | 31 / 17 | +2,08 |
| P23 | Création / édition d'offre | `/espace-pro/entreprise/offre/[id]` | `app/(espace-pro)/…/entreprise/creation-offre`, `offre/[job_id]`, `components/DepotOffre`, `DropdownCombobox.tsx` | 30 / 19 | +2,04 |
| P24 | Création d'entreprise partenaire | `/espace-pro/cfa/creation-entreprise` | `app/(espace-pro)/…/cfa/creation-entreprise/CreationEntreprisePage.tsx`, `AutocompleteAsync.tsx` | 32 / 10 | +2,38 |
| P25 | Écrans de confirmation | `/espace-pro/entreprise/offre/[id]/mise-en-relation` | `app/(espace-pro)/…/entreprise/offre/[job_id]/mise-en-relation` | 33 / 8 | +2,44 |
| P26 | Mes entreprises | `/espace-pro/cfa` | `app/(espace-pro)/…/cfa/page.tsx`, `app/(espace-pro)/_components/Table*.tsx`, `VirtualTable.tsx`, menu actions | 32 / 13 | +2,22 |
| P27 | Mes informations de compte | `/espace-pro/entreprise/compte` | `app/(espace-pro)/…/entreprise/compte`, `cfa/compte`, `InformationLegaleEntreprise.tsx`, `FieldWithValue.tsx` | 33 / 15 | +2,08 |

Composants transverses (toutes les pages) : `app/layout.tsx`, `app/_components/Header.tsx`, `HeaderNavigation.tsx`, `PublicHeader.tsx`, `Footer.tsx`, `Breadcrumb.tsx`, `components/dsfr/DsfrLink.tsx`, `public/styles/application.css`, `notion.css`.

## 4. Tickets transverses (rapport § 7 à 12)

| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 3.2 | Majeur | Statistiques (tableau), menu actions Mes entreprises | Textes < 4,5:1 → augmenter contraste ou taille |
| 3.3 | Majeur | Accueil (option survolée de l'autocomplétion), Statistiques (fond de l'onglet au focus) | Contraste ≥ 3:1 avec les couleurs adjacentes |
| 13.1 | Bloquant | Espace pro (P22–P27) | Session expirant sans contrôle → supprimer / prolonger / ≥ 20 h |
| 9.2, 12.6 | Majeur / Mineur | Layout | Pas de `<nav>` autour du menu, `<main>` sans `role="main"` → `<nav role="navigation" aria-label>` + `role="main"` |
| 8.6 | Majeur | Accessibilité, Ressources | Deux `<title>` (générique + spécifique) → un seul, nom du site inclus |
| 12.1 | Majeur | Toutes | Un seul système de navigation → ajouter plan du site ou moteur (plan du site livré depuis dans `(editorial)/plan-du-site` : vérifier l'accès depuis toutes les pages) |
| 12.2 | Majeur | P13–P17 (recherche, détails) | Ni menu ni footer ; fermeture renvoie vers une page sans navigation → renvoyer vers une page complète |
| 7.1, 12.8 | Bloquant | Navigation SPA globale | Rôle lien/bouton incohérent, focus non géré, titre non restitué → lien = rechargement ou titre + focus sur texte sr-only en tête de page ; bouton = focus sur la zone mise à jour |
| 6.1 | Majeur | Header logo | `title="Accueil - La bonne alternance"` incomplet → `"Accueil - La bonne alternance - République Française"` |
| 9.1 | Majeur | Footer | `fr-footer__top-cat` en `<h3>` → `<h2>` (un `<h2 class="fr-sr-only">` existe désormais dans `Footer.tsx` : vérifier la hiérarchie résultante) |
| 10.2 | Bloquant | Footer liens externes (Blog, Code source) | Icône « nouvelle fenêtre » en CSS → `title="Blog - Nouvelle fenêtre"` |
| 6.1 | Majeur | Footer logo France Relance | `title` → `"Accueil - La bonne alternance - France Relance"` |

## 5. Tickets par page (rapport § 13 à 38)

Une ligne par problème. « Sév. » = sévérité de l'audit. Les tickets marqués ★ concernent un composant partagé entre plusieurs pages.

### P01 Accueil
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 9.1 | Majeur | Titre « Se former et travailler en alternance » (`p.MuiTypography-body1`) | Titre simulé → `<h1>` |
| 9.1 | Majeur | « Vous révéler le marché caché de l'emploi » (`h1#home-content-container`) | Niveau incohérent → `<h2>` |
| 11.10 | Majeur | Formulaire de recherche ★ (aussi P13) | Pas de mention des champs obligatoires en amont → `<p>Champs obligatoires *</p>` |
| 11.6 | Majeur | Fieldset Emplois / Formations (`aria-labelledby` vers élément vide) ★ | Pas de légende → `<legend>` (peut être sr-only) |
| 7.5 | Majeur | Autocomplétions métier et lieu ★ | Nombre de suggestions non annoncé → `<div aria-live="polite">` + `<p>` sr-only |
| 7.1 | Majeur | Liste `role="listbox"` avec `<li>` de groupe sans rôle ★ | → `role="option"` sur les `<li>` |
| 9.1 | Majeur | « Métiers » / « Formations » dans la liste (`p.fr-text--bold`) ★ | Titres simulés → `<h2>` |
| 12.8 | Majeur | Formulaire en erreur ★ | → focus sur le premier champ en erreur |
| 9.3 | Majeur | Étapes 1-2-3 | Liste ordonnée non structurée → `<ol><li>` |
| 9.1 | Majeur | « La bonne alternance recense une liste d'outils… » (`p`) | Titre simulé → `<h2>` |
| 3.3, 6.1, 8.9, 9.2, 10.2, 10.7, 12.1, 12.6 | — | transverses | voir § 4 |

### P02 Contact
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 12.8 | Majeur | Bouton « Consulter la FAQ » (`<a>` dans `fr-btn`) | → lien seul (`Button linkProps`) |
| 6.1 | Majeur | Lien mailto (`fr-link fr-icon-map-pin-2-fill`, `aria-label`) | `aria-label` ≠ visible → reprendre l'intitulé visible |

### P03 Mentions légales (Notion)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 8.9 | Mineur | Blocs `div.notion-text` | → `<p>` |
| 6.1 | Majeur | Lien d'ancre `a.notion-hash-link` (svg nu) | → supprimer, ou visible au focus + `role="img" aria-label` |
| 12.8 | Majeur | idem | Ne pas déplacer le focus après activation |
| 6.1 | Majeur | « En savoir plus » externe | → `title="xxx - Nouvelle fenêtre"` |
| 10.7 | Majeur | Liens `notion-link` | Focus invisible → rétablir l'outline |

### P04 Accessibilité (Notion)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 8.9 | Mineur | Deux `<h1>` « Déclaration d'accessibilité » | → un seul `<h1>` |
| 8.9 | Mineur | `div.notion-text` | → `<p>` |
| 6.1 | Majeur | Liens externes « Voie de recours » | → `title="xxx - Nouvelle fenêtre"` |
| 10.7 | Majeur | Lien e-mail de contact | Focus invisible |
| 8.6 | Majeur | `<title>` doublé | → un seul |

### P05 FAQ (Notion + side-menu)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 7.1 | Majeur | `<details>/<summary>` (`notion-toggle`) | → `role="button"` sur `summary` (ou `Accordion` DSFR) |
| 8.9 | Mineur | Texte du toggle, section « Amélioration du service », `notion-blank` avec `&nbsp;` | → `<p>`, supprimer les vides |
| 1.2 | Majeur | Émoji 👉 avant un lien | → `aria-hidden="true"` |
| 6.1 | Majeur | Liens externes des réponses | → `title="xxx - Nouvelle fenêtre"` |
| 7.1 | Majeur | Side-menu `a.fr-sidemenu__link` qui change le contenu | → `<button>` ou `role="button"` + Entrée/Espace |
| 12.8 | Majeur | idem | → focus sur le contenu affiché |
| 10.7 | Majeur | Lien « La bonne alternance » | Focus invisible |
| 9.3 | Majeur | Listes imbriquées `notion-list` ; liste à tirets en `span` | → imbriquer dans le `<li>` parent ; `<ul><li>` |

### P06 Ressources (route à confirmer)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 9.1 | Majeur | Titres de cartes (`p.MuiTypography-body1`), encart « Diffusez simplement… » | → `<h3>` |
| 6.1 | Majeur | Liens externes « C'est parti ! », « En savoir plus » | → `title="xxx - Nouvelle fenêtre"` |
| 12.8 | Majeur | Side-menu / onglets | → focus sur le panneau affiché |
| 7.1 | Majeur | `fr-sidemenu__link` avec `aria-current="page"` | → bouton, `aria-current="true"` |
| 8.6 | Majeur | `<title>` doublé | → un seul |

### P07 Statistiques
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 8.9 | Mineur | Paragraphe méthode (`Typography` + doubles `<br>`) | → un `<p>` par paragraphe |
| 9.3 | Majeur | 3 étapes de calcul dans un paragraphe | → `<ol><li>` |
| 3.2, 3.3 | Majeur | Tableau, onglets | voir § 4 |

### P08 Espace développeurs
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 12.8 | Majeur | « Explorer l'API », « Voir la documentation » (`<a target=_blank>` dans `fr-btn`) | → lien seul |
| 10.2 | Bloquant | idem | → `title="xxx - nouvelle fenêtre"` |
| 6.1 | Majeur | « consultez cette documentation. » (`aria-label` ≠ visible) | → reprendre le visible |
| 9.1 | Majeur | « API » (`p.MuiTypography-body1`) | → `<h5>` (niveau selon hiérarchie réelle) |

### P09 Métiers
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 8.9 | Mineur | Deux `<h1>` « Tous les emplois et formations en alternance » | → un seul |

### P10 A propos
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 1.3 | Majeur | Logos partenaires (`alt="un jeune une solution"`) | → `alt` = texte du logo (`#1jeune1solution`, etc.) |
| 6.1 | Majeur | Lien « catalogue des formations… Carif-Oref » (`aria-label`) | → reprendre le visible |

### P11 Politique de confidentialité (Notion)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 8.9 | Mineur | Deux `<h1>` ; `<em>` « Dernière mise à jour » ; `div.notion-text` | → un `<h1>`, `<p>` |
| 6.1 | Majeur | Liens externes (service dématérialisé…) | → `title="xxx - Nouvelle fenêtre"` |
| 11.1 | Bloquant | Case « Vous êtes suivi(e), exclure du suivi » (`FormControlLabel` + `Checkbox` MUI) | → `label for` + `id` (ou `Checkbox` DSFR) |
| 10.7 | Majeur | Liens | Focus invisible |
| 9.3 | Majeur | Un `<ul>` par item (`notion-list`) | → une seule liste |

### P12 CGU (Notion)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 8.9 | Mineur | Deux `<h1>` ; `<em>` ; `div.notion-text` | → un `<h1>`, `<p>` |
| 6.1 | Majeur | Lien mailto DGEFP | → `title` reprenant le visible |
| 10.7 | Majeur | Lien « La bonne alternance » du préambule | Focus invisible |
| 9.3 | Majeur | Un `<ul>` par item | → une seule liste |

### P13 Résultats de recherche (ancien moteur ; le nouveau a été livré depuis, re-vérifier)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 7.1 | Bloquant | Bouton loupe (`fr-icon-search`, submit) et « retour en haut » (`fr-icon-arrow-up-line`) | Sans intitulé → texte sr-only |
| 9.1 | Majeur | Bandeau « Psst, nous avons une info pour vous ! » (`p.fr-text--lead`) | → `<h2>` |
| 6.1, 10.2 | Bloquant | « En savoir plus » nouvelle fenêtre (`fr-icon-map-pin-2-fill`) | → `title="xxx - Nouvelle fenêtre"` |
| 10.2 | Bloquant | Bouton tooltip « Employeur handi-engagé » (`#recherche-elligible-handicap-tooltip-button`) | Icône CSS seule → texte sr-only |
| 7.5 | Majeur | Filtres (type, métier, lieu, rayon, niveau, handi-engagé) | Résultats non annoncés → `aria-live="polite"` + nombre de résultats |
| 12.2, 12.8 | Majeur | Layout sans navigation ; focus SPA | voir § 4 |

### P14 Détail d'une formation ★ (ItemDetail + formulaire RDV)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 8.9 | Mineur | Bloc « FORMATION » (`div` + `img book.svg`), blocs Description / Objectifs / Sessions | → `<p>` |
| 1.2 | Majeur | SVG localisation ★ | → `aria-hidden="true" focusable="false"` |
| 10.2 | Majeur | Boutons précédent / suivant / fermer (`title="previous|next|close"`) ★ | Icône CSS → texte sr-only |
| 8.7 | Majeur | idem ★ | `title` anglais → français |
| 9.1 | Majeur | « Description de la formation », « Objectifs », « Sessions » (`p`/`span`) | → `<h4>` (selon hiérarchie) |
| 6.1 | Majeur | Lien « avec un CFA » (`aria-label`) | → reprendre le visible |
| 7.1 | Majeur | Bouton « Je prends rendez-vous » (`data-testid="prdvButton"`, `aria-label`) | → `aria-label` reprend le visible |
| 11.10 | Majeur | Formulaire contact CFA | Mention obligatoire en amont ; format e-mail / téléphone ; erreurs nommant les champs |
| 11.6 | Majeur | `RadioGroup` « Vous êtes » (`fieldset-who-type`) | Pas de légende → `aria-labelledby` vers un `<p>` / `legend` |
| 11.5 | Majeur | Cases « Quel(s) sujet(s) » (`fieldset-reasons`) | Pas de regroupement → `fieldset`/`legend` ou `role="group"` |
| 11.13 | Majeur | Nom / Prénom / E-mail / Téléphone | → `autoComplete` |
| 12.8 | Majeur | Formulaire en erreur | → focus sur le premier champ en erreur |

### P15 Détail offre LBA ★ (ItemDetail + modale CandidatureLba)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 8.9 | Mineur | Badges « OFFRE D'EMPLOI » / « LA BONNE ALTERNANCE » (`div` + `img`) | → `<p>` |
| 8.7, 10.2 | Bloquant | Bouton fermer (`ri-close-line`, `title="close"`, `data-testid="close-detail-button"`) ★ aussi P16, P17 | → français + texte sr-only |
| 9.1 | Majeur | « Description du métier » (`p`) | → titre |
| 9.3 | Majeur | « Qualités souhaitées » (puces « • » dans `span`) | → `<ul><li>` |
| 7.1, 10.2 | Bloquant | Bouton `?` tooltip (`question-line`, `title="label"`) ★ | → intitulé sr-only |
| 1.2 | Majeur | SVG localisation ★ | → `aria-hidden` |
| 7.1 | Majeur | Bouton « J'envoie ma candidature » (`aria-label="Ouvrir le formulaire d'envoi de candidature"`) ★ | → `aria-label` commence par le visible, ou le retirer |
| 9.1 | Majeur | Titre de la modale (`p.MuiTypography-body1`) | → `<h2>` (ou `title` de `createModal`) |
| 11.10 | Majeur | Modale : mention « *Champs obligatoires » après les champs ; formats e-mail / téléphone absents | → mention en amont, `hintText` |
| 11.13 | Majeur | Modale : Nom / Prénom / E-mail / Téléphone | → `autoComplete` |
| 11.1 | Bloquant | Modale : cases « j'ai lu l'offre… » (`FormControlLabel` MUI) ; `<textarea id="message">` sans `label for` | → `label for` + `id` |
| 12.8 | Majeur | Modale : dropzone CV (`tabindex` sur la div + `-1` sur l'input) ; formulaire en erreur | → un seul arrêt ; focus premier champ en erreur |
| 11.10 | Majeur | Dropzone CV | Formats / taille attendus → `aria-describedby` + `title` |

### P16 Détail offre partenaire ★
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 8.9 | Mineur | Bloc « Nature du contrat / Niveau visé » (`div.MuiStack`) ; `<p></p>` vide près de « Signaler l'offre » | → `<p>`, supprimer les vides |
| 1.2 | Majeur | SVG localisation ★ | → `aria-hidden` |
| 6.1 | Majeur | Lien « on vous donne des conseils ici… » (`MuiLink`, `target=_blank`) | → `title="xxx - Nouvelle fenêtre"` |
| 8.7, 10.2, 7.1 | — | bouton fermer, bouton `?` ★ | voir P15 |

### P17 Candidature spontanée ★
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 8.9 | Mineur | Bloc « CANDIDATURE SPONTANÉE » (`div` + `fr-icon-compass-3-fill`) ; doubles `<br>` dans l'exemple de relance | → `<p>` |
| 1.2 | Majeur | SVG localisation ★ | → `aria-hidden` |
| 9.1 | Majeur | Accordéon « Comment candidater ? » : `h3.fr-accordion__title` sous un `h4` ; « Vous ne recevez pas de réponse ? », « Vous avez une proposition d'entretien ? » en gras | → `titleAs` cohérent ; `<h5>` |
| 10.2 | Bloquant | Liens externes Diagoriente, clicnjob, cvdesignr, canva (icône CSS) | → `title="xxx - Nouvelle fenêtre"` |
| 6.1 | Majeur | Lien adresse (`aria-label="Localisation sur google maps - nouvelle fenêtre"`) | → nom commence par l'adresse visible |
| 9.4 | Majeur | Exemple de relance téléphonique | → `<q>` |
| 7.1, 11.x, 12.8 | — | bouton candidature, modale ★ | voir P15 |

### P18 / P19 Réponse recruteur (MailCard / IntentionPage)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 6.1 | Majeur | Logo « La bonne alternance » (`img` 160×60 dans un lien) | → `alt` = destination / texte |
| 9.1 | Majeur | « Objet : Réponse … de l'entreprise X » (`div.mail-card-title`) | → `<h2>` |

### P20 Réponse CFA
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 9.1 | Majeur | « Un candidat souhaite être contacté… » (`p`), « Voici les coordonnées du contact : » (`span.MuiTypography-h6`) | → `<h1>`, `<h2>` |

### P21 Connexion
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 11.1 | Bloquant | Champ « Votre email » (`FormLabel` sans `for`, `MuiInput` sans `id`) | → `htmlFor` + `id` (ou `Input` DSFR) |
| 11.10 | Majeur | idem : format non indiqué ; erreur « Insérez un email valide » non liée (`aria-invalid` seul) | → `hintText`, `aria-describedby` |
| 11.13 | Majeur | idem | → `autoComplete="email"` |
| 12.8 | Majeur | Formulaire en erreur | → focus sur le champ |

### P22 Création de compte (CreationCompte, SiretAutocomplete, InformationLegaleEntreprise, InfoToolTip)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 11.1 | Bloquant | Combobox SIRET / nom (`downshift`, `placeholder` seul) | → `<label>` associé (`getLabelProps`) ou `title` |
| 7.5 | Majeur | Combobox : résultats non annoncés | → `aria-live` |
| 12.8 | Majeur | Combobox : options non vocalisées aux flèches | → `aria-activedescendant` / options atteignables |
| 6.1 | Majeur | Liens « référencer son offre de formation », « La certification Qualiopi » (`aria-label` ≠ visible) | → reprendre le visible |
| 8.9 | Mineur | Texte « où trouver votre SIRET », `div.fr-info-text` | → `<p>` |
| 11.1 | Bloquant | Étape 2 : Nom / Prénom / Téléphone / Email (`MuiFormLabel` sans `for`) | → `htmlFor` + `id` |
| 11.10 | Majeur | Téléphone / Email : format absent ; champ en erreur sans `aria-describedby` | → `hintText`, `aria-describedby` |
| 11.13 | Majeur | Champs personnels | → `autoComplete` |
| 7.3 | Bloquant | Tooltip SIRET / Enseigne (`fr-icon-information-line` sur `span`) ★ aussi P27 | Non focusable → `<button type="button">` |
| 7.1 ×3 | Majeur | idem ★ | Sans intitulé ; sans `role="tooltip"` ; non lié → sr-only + `role="tooltip"` + `aria-describedby` (`Tooltip` DSFR) |
| 10.13 | Majeur | idem ★ | Non fermable à Échap |
| 10.3 | Majeur | Bloc « Votre OPCO » | Ordre DOM ≠ visuel → déplacer avant Annuler / Suivant |
| 9.1 | Majeur | « Votre OPCO » (`p.MuiTypography-body1`) | → `<h2>` |
| 7.1 | Majeur | Bouton « Modifier » à côté de « Votre OPCO » | → `aria-describedby` vers le titre ou sr-only « Modifier votre OPCO » |
| 13.1 | Bloquant | Session | voir § 4 |

### P23 Création / édition d'offre (DepotOffre, DropdownCombobox)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 11.10 | Majeur | Formulaire « Votre offre » | Mention obligatoire en amont ; format date |
| 11.1 | Bloquant | Champ « Métier » (`role="combobox"` downshift) ; cases compétences (`competence-checkbox-line`) | → `label for` + `id` |
| 6.1 | Majeur | « En savoir plus » (`MuiLink`) | → intitulé explicite |
| 11.4 | Majeur | « Durée du contrat (mois) » | Label éloigné → accoler |
| 7.1 | Bloquant | Bouton `+` (nombre de postes) | Sans intitulé → sr-only « Ajouter un poste » |
| 1.1 | Bloquant | Logos France Travail, Portail alternance, Choisir son affectation, Mon Master, Parcoursup (`alt=""`) | → `alt` = texte du logo |
| 11.5 | Majeur | Cases compétences | → `fieldset`/`legend` |
| 10.3, 13.1 | — | | voir § 4 |

### P24 Création d'entreprise partenaire (CreationEntreprisePage, AutocompleteAsync)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 11.1 | Bloquant | Champ « nom ou SIRET de l'entreprise partenaire » (`role="combobox"`) | → étiquette (`title` = placeholder au minimum, label mieux) |
| 7.5 | Majeur | Résultats non annoncés | → `aria-live` |
| 12.8 | Majeur | Options non vocalisées | → flèches / `aria-activedescendant` |

### P25 Écrans de confirmation
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 6.1 | Majeur | Liens « Voir mon offre sur La bonne alternance », « Imprimer l'offre » (`aria-label`) | → reprendre le visible |

### P26 Mes entreprises (Table*.tsx, menu actions)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 7.5 | Majeur | Champ « Rechercher une société » | Résultats non annoncés → `aria-live` |
| 10.2 | Majeur | Bouton loupe (`fr-icon-search-line`, `title="Lancer la recherche"`) | Icône CSS → texte sr-only |
| 5.6 | Majeur | En-tête colonne Actions vide (`th role="hack"`) | → « Actions » en sr-only |
| 8.7 | Majeur | `title="Toggle SortBy"` | → supprimer / traduire |
| 7.1 | Majeur | `role="hack"` | → supprimer |
| 7.1, 7.3, 10.2 | Bloquant | Tri « Entreprise » (icône cliquable, sans bouton, sans nom) | → `<button type="button">` + sr-only + `aria-sort` |
| 10.2, 7.1 | Majeur | Bouton `#composition-button` (`fr-icon-settings-5-line`, `title="Actions sur l'entreprise"`, `aria-haspopup`) | → sr-only « Actions » ; nom incluant l'entreprise |
| 3.2, 13.1 | — | | voir § 4 |

### P27 Mes informations de compte (InformationLegaleEntreprise, FieldWithValue, InfoToolTip)
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 11.1 | Bloquant | Prénom / Nom / Téléphone / Email (`MuiFormLabel` + `MuiInput` sans `id`) | → `htmlFor` + `id` |
| 11.13 | Majeur | idem | → `autoComplete` |
| 11.10 | Majeur | Mention obligatoire absente en amont ; format e-mail / téléphone ; erreur non liée au champ | → mention, `hintText`, `aria-describedby` |
| 7.3, 7.1 ×3, 10.13 | Bloquant | Tooltip SIRET / Enseigne ★ | voir P22 |
| 13.1 | Bloquant | Session | voir § 4 |

## 6. Indices de corrections déjà livrées (à confirmer sur le code avant de clore)

- Plan du site : `ui/app/(editorial)/plan-du-site/page.tsx`, lié dans `Footer.tsx` (critère 12.1).
- `Footer.tsx` : `<h2 className="fr-sr-only">Informations et liens du site</h2>` (9.1 footer).
- Nouveau moteur de recherche (`#5146`, août 2026) : `SkipLinks` desktop / mobile, `aria-labelledby` / `aria-describedby` / `aria-invalid` sur les champs de `SearchBar.tsx` (P13 : 11.1, 11.10, 12.7).
- `Header.tsx` : `homeLinkProps.title = "Accueil - La bonne alternance"` (toujours sans « République Française » : 6.1 header probablement ouvert).
- Commits antérieurs à l'audit : `<nav>` et rôles (#2556), `<title>` distincts (#2542), tableaux (#2585), alternatives images (#2546), liens d'évitement (#2331).
